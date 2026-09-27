import { prisma } from "../../config/prisma.js";

import { extractJobSkills } from "./jobSkillExtraction.service.js";

export interface JobSkillInput {
  skillName: string;
  normalizedName: string;
  category: string;
  requirementType: "REQUIRED" | "PREFERRED";
  importance: number;
}

export interface JobInput {
  source: string;
  externalJobId: string;
  title: string;
  companyName: string;
  location?: string | null;
  employmentType?: string | null;
  remote?: boolean;
  url: string;
  description?: string | null;
  postedAt?: Date | null;
  expiresAt?: Date | null;
  skills: JobSkillInput[];
}

type ProfileRequirementType = "CORE" | "IMPORTANT" | "PREFERRED";

interface ProfileSkillRecord {
  skillId: string;
  requirementType: ProfileRequirementType;
  requiredLevel: number;
  importance: number;
  aliases: string[];
  skill: {
    id: string;
    normalizedName: string;
  };
}

interface JobProfileRecord {
  id: string;
  slug: string;
  title: string;
  domain: string;
  aliases: string[];
  skills: ProfileSkillRecord[];
}

interface JobProfileClassification {
  jobProfileId: string;
  classificationScore: number;
  classificationMethod: string;
}

const PROFILE_CLASSIFICATION_THRESHOLD = 25;

const TITLE_EXACT_BONUS = 45;

const TITLE_ALIAS_BONUS = 35;

const TITLE_CORE_TOKEN_BONUS = 30;

const TITLE_TOKEN_MIN_LENGTH = 4;

const SKILL_COVERAGE_WEIGHT = 0.7;

const GENERIC_ROLE_TERMS = new Set([
  "a",
  "an",
  "and",
  "architect",
  "consultant",
  "developer",
  "engineer",
  "lead",
  "manager",
  "programmer",
  "scientist",
  "senior",
  "specialist",
  "staff",
  "analyst",
  "associate",
  "administrator",
  "designer",
  "director",
  "junior",
  "principal",
  "professional",
  "intern",
]);

const toNumber = (value: unknown): number => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return parsed;
};

const normalizeText = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeSkillKey = (value: string): string => {
  return normalizeText(value)
    .replace(/\s+/g, "-")
    .trim();
};

const getTitleTokens = (value: string): string[] => {
  return [
    ...new Set(
      normalizeText(value)
        .split(/[\s-]+/)
        .map((token) => token.trim())
        .filter(
          (token) =>
            token.length > 1 && !GENERIC_ROLE_TERMS.has(token),
        ),
    ),
  ];
};

const round = (value: number, decimals: number): number => {
  const multiplier = 10 ** decimals;

  return (
    Math.round((value + Number.EPSILON) * multiplier) / multiplier
  );
};

const getProfileRequirementMultiplier = (
  requirementType: ProfileRequirementType,
): number => {
  switch (requirementType) {
    case "CORE":
      return 1;
    case "IMPORTANT":
      return 0.8;
    case "PREFERRED":
      return 0.5;
    default:
      return 1;
  }
};

const getTitleMatchBonus = (
  jobTitle: string,
  profile: JobProfileRecord,
): number => {
  const normalizedJobTitle = normalizeText(jobTitle);

  if (!normalizedJobTitle) {
    return 0;
  }

  const profileTitle = normalizeText(profile.title);

  if (
    profileTitle &&
    (normalizedJobTitle === profileTitle ||
      normalizedJobTitle.includes(profileTitle))
  ) {
    return TITLE_EXACT_BONUS;
  }

  for (const alias of profile.aliases ?? []) {
    const normalizedAlias = normalizeText(alias);

    if (
      normalizedAlias &&
      (normalizedJobTitle === normalizedAlias ||
        normalizedJobTitle.includes(normalizedAlias))
    ) {
      return TITLE_ALIAS_BONUS;
    }
  }

  const profileTitleTokens = getTitleTokens(profile.title);

  if (profileTitleTokens.length === 0) {
    return 0;
  }

  const jobTitleTokens = getTitleTokens(jobTitle);

  const matchingTokenCount = profileTitleTokens.filter((profileToken) =>
    jobTitleTokens.some((jobToken) => {
      if (
        profileToken.length < TITLE_TOKEN_MIN_LENGTH ||
        jobToken.length < TITLE_TOKEN_MIN_LENGTH
      ) {
        return false;
      }

      return (
        jobToken === profileToken ||
        jobToken.includes(profileToken) ||
        profileToken.includes(jobToken)
      );
    }),
  ).length;

  if (matchingTokenCount === 0) {
    return 0;
  }

  const tokenCoverage =
    matchingTokenCount / profileTitleTokens.length;

  return round(TITLE_CORE_TOKEN_BONUS * tokenCoverage, 3);
};

const getProfileSkillMatchNames = (
  profileSkill: ProfileSkillRecord,
): Set<string> => {
  const names = new Set<string>();

  const normalizedSkillName = normalizeSkillKey(
    profileSkill.skill.normalizedName,
  );

  if (normalizedSkillName) {
    names.add(normalizedSkillName);
  }

  for (const alias of profileSkill.aliases ?? []) {
    const normalizedAlias = normalizeSkillKey(alias);

    if (normalizedAlias) {
      names.add(normalizedAlias);
    }
  }

  return names;
};

const classifyJobAgainstProfiles = (
  title: string,
  jobSkills: JobSkillInput[],
  profiles: JobProfileRecord[],
): JobProfileClassification[] => {
  if (profiles.length === 0) {
    return [];
  }

  const jobNormalizedNames = new Set<string>();

  for (const jobSkill of jobSkills) {
    const normalizedName = normalizeSkillKey(
      jobSkill.normalizedName,
    );

    if (normalizedName) {
      jobNormalizedNames.add(normalizedName);
    }

    const normalizedDisplayName = normalizeSkillKey(
      jobSkill.skillName,
    );

    if (normalizedDisplayName) {
      jobNormalizedNames.add(normalizedDisplayName);
    }
  }

  const classifications: JobProfileClassification[] = [];

  for (const profile of profiles) {
    if (profile.skills.length === 0) {
      continue;
    }

    let totalProfileWeight = 0;
    let matchedProfileWeight = 0;

    for (const profileSkill of profile.skills) {
      const importance = Math.max(
        0,
        Math.min(1, toNumber(profileSkill.importance)),
      );

      const requirementMultiplier = getProfileRequirementMultiplier(
        profileSkill.requirementType,
      );

      const weight = importance * requirementMultiplier;
      totalProfileWeight += weight;

      const profileSkillNames = getProfileSkillMatchNames(
        profileSkill,
      );

      const matched = Array.from(profileSkillNames).some(
        (profileSkillName) =>
          jobNormalizedNames.has(profileSkillName),
      );

      if (matched) {
        matchedProfileWeight += weight;
      }
    }

    const skillCoverage =
      totalProfileWeight > 0
        ? matchedProfileWeight / totalProfileWeight
        : 0;

    const titleBonus = getTitleMatchBonus(title, profile);

    /*
     * Skill evidence remains the primary signal, but strong role-title
     * evidence can classify an opening on its own. This is important for
     * titles such as "Custom Software Engineer", "Software Development
     * Engineer II", and "Senior JavaBackend Engineer", where the exact
     * canonical profile title may not appear as one contiguous phrase.
     *
     * The classifier still preserves skill overlap as a major component,
     * so a title signal does not replace the skill-based model.
     */
    let classificationScore =
      skillCoverage * 100 * SKILL_COVERAGE_WEIGHT +
      titleBonus;

    classificationScore = Math.min(
      100,
      round(classificationScore, 3),
    );

    if (classificationScore < PROFILE_CLASSIFICATION_THRESHOLD) {
      continue;
    }

    classifications.push({
      jobProfileId: profile.id,
      classificationScore,
      classificationMethod:
        "SKILL_AND_TITLE_RULES_V3",
    });
  }

  return classifications.sort(
    (first, second) =>
      second.classificationScore - first.classificationScore,
  );
};

const loadActiveJobProfiles = async (): Promise<JobProfileRecord[]> => {
  const profiles = await prisma.jobProfile.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      domain: true,
      aliases: true,
      skills: {
        select: {
          skillId: true,
          requirementType: true,
          requiredLevel: true,
          importance: true,
          aliases: true,
          skill: {
            select: {
              id: true,
              normalizedName: true,
            },
          },
        },
      },
    },
  });

  return profiles.map((profile) => ({
    id: profile.id,
    slug: profile.slug,
    title: profile.title,
    domain: profile.domain,
    aliases: profile.aliases,
    skills: profile.skills.map((skill) => ({
      skillId: skill.skillId,
      requirementType: skill.requirementType,
      requiredLevel: toNumber(skill.requiredLevel),
      importance: toNumber(skill.importance),
      aliases: skill.aliases,
      skill: {
        id: skill.skill.id,
        normalizedName: skill.skill.normalizedName,
      },
    })),
  }));
};

export const upsertJob = async (input: JobInput) => {
  const job = await prisma.job.upsert({
    where: {
      source_externalJobId: {
        source: input.source,
        externalJobId: input.externalJobId,
      },
    },
    update: {
      title: input.title,
      companyName: input.companyName,
      location: input.location ?? null,
      employmentType: input.employmentType ?? null,
      remote: input.remote ?? false,
      url: input.url,
      description: input.description ?? null,
      postedAt: input.postedAt ?? null,
      expiresAt: input.expiresAt ?? null,
    },
    create: {
      source: input.source,
      externalJobId: input.externalJobId,
      title: input.title,
      companyName: input.companyName,
      location: input.location ?? null,
      employmentType: input.employmentType ?? null,
      remote: input.remote ?? false,
      url: input.url,
      description: input.description ?? null,
      postedAt: input.postedAt ?? null,
      expiresAt: input.expiresAt ?? null,
    },
  });

  const skills =
    input.skills.length > 0
      ? input.skills
      : extractJobSkills(input.title, input.description);

  const activeProfiles = await loadActiveJobProfiles();

  await prisma.$transaction(async (tx) => {
    await tx.jobSkill.deleteMany({
      where: {
        jobId: job.id,
      },
    });

    await tx.jobJobProfile.deleteMany({
      where: {
        jobId: job.id,
      },
    });

    for (const jobSkill of skills) {
      const normalizedName = normalizeSkillKey(
        jobSkill.normalizedName,
      );

      if (!normalizedName) {
        continue;
      }

      const skill = await tx.skill.upsert({
        where: {
          normalizedName,
        },
        update: {
          name: jobSkill.skillName,
          category: jobSkill.category,
        },
        create: {
          name: jobSkill.skillName,
          normalizedName,
          category: jobSkill.category,
        },
      });

      await tx.jobSkill.create({
        data: {
          jobId: job.id,
          skillId: skill.id,
          requirementType: jobSkill.requirementType,
          importance: jobSkill.importance,
        },
      });
    }

    const classifications = classifyJobAgainstProfiles(
      input.title,
      skills,
      activeProfiles,
    );

    if (classifications.length > 0) {
      await tx.jobJobProfile.createMany({
        data: classifications.map((classification) => ({
          jobId: job.id,
          jobProfileId: classification.jobProfileId,
          classificationScore:
            classification.classificationScore,
          classificationMethod:
            classification.classificationMethod,
        })),
        skipDuplicates: true,
      });
    }
  });

  return prisma.job.findUniqueOrThrow({
    where: {
      id: job.id,
    },
    include: {
      skills: {
        include: {
          skill: true,
        },
      },
      jobProfiles: {
        include: {
          jobProfile: {
            select: {
              id: true,
              slug: true,
              title: true,
              domain: true,
            },
          },
        },
        orderBy: {
          classificationScore: "desc",
        },
      },
    },
  });
};
