import { prisma } from "../../config/prisma.js";

const MATCH_ALGORITHM_VERSION = "weighted-skill-v2";

const PROFICIENCY_THRESHOLD = 40;

const REQUIRED_WEIGHT_MULTIPLIER = 1;

const PREFERRED_WEIGHT_MULTIPLIER = 0.5;

type RequirementType = "REQUIRED" | "PREFERRED";

interface JobSkillWithSkill {
  id: string;
  jobId: string;
  skillId: string;
  requirementType: RequirementType;
  importance: unknown;
  skill: {
    id: string;
    name: string;
    normalizedName: string;
    category: string | null;
  };
}

interface UserSkillWithSkill {
  skillId: string;
  currentScore: unknown;
  confidence?: unknown;
  skill: {
    id: string;
    name: string;
    normalizedName: string;
    category: string | null;
  };
}

export interface CalculatedGap {
  skillId: string;
  skillName: string;
  currentScore: number;
  gapScore: number;
  priority: number;
  importance: number;
}

export interface JobMatchResult {
  jobId: string;
  matchScore: number;
  skillCoverage: number;
  skillGapCount: number;
  explanation: string;
}

export interface DetailedJobMatchResult extends JobMatchResult {
  gaps: CalculatedGap[];
}

const toNumber = (value: unknown): number => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return parsed;
};

const round = (value: number, decimals: number): number => {
  const multiplier = 10 ** decimals;

  return (
    Math.round((value + Number.EPSILON) * multiplier) / multiplier
  );
};

const normalizeSkillKey = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s+/g, "-");
};

const getRequirementMultiplier = (
  requirementType: RequirementType,
): number => {
  return requirementType === "PREFERRED"
    ? PREFERRED_WEIGHT_MULTIPLIER
    : REQUIRED_WEIGHT_MULTIPLIER;
};

const buildExplanation = (
  totalSkills: number,
  skillsMeetingThreshold: number,
  gaps: CalculatedGap[],
): string => {
  const base =
    `The candidate meets the configured proficiency threshold for ` +
    `${skillsMeetingThreshold} of ${totalSkills} job skills.`;

  if (gaps.length === 0) {
    return (
      `${base} ` +
      `No skills are currently below the configured proficiency threshold.`
    );
  }

  const gapDetails = gaps
    .map((gap) => `${gap.skillName} (${gap.currentScore}/100)`)
    .join(", ");

  return `${base} Missing or below-threshold skills: ${gapDetails}.`;
};

const calculateJobMatchInternal = async (
  userId: string,
  jobId: string,
): Promise<DetailedJobMatchResult> => {
  const job = await prisma.job.findUnique({
    where: {
      id: jobId,
    },
    include: {
      skills: {
        include: {
          skill: true,
        },
      },
    },
  });

  if (!job) {
    throw new Error("Job not found.");
  }

  if (job.skills.length === 0) {
    throw new Error(
      "Job does not contain any required or preferred skills.",
    );
  }

  /*
   * Live recommendations are based on the user's current persisted
   * UserSkill profile. AnalysisRun is historical provenance and is not
   * required to calculate the current job fit.
   */
  const userSkills = (await prisma.userSkill.findMany({
    where: {
      userId,
    },
    include: {
      skill: true,
    },
  })) as UserSkillWithSkill[];

  const userScoreBySkillId = new Map<string, number>();
  const userScoreByNormalizedName = new Map<string, number>();

  for (const userSkill of userSkills) {
    const currentScore = Math.max(
      0,
      Math.min(100, round(toNumber(userSkill.currentScore), 3)),
    );

    userScoreBySkillId.set(userSkill.skillId, currentScore);

    const normalizedName = normalizeSkillKey(
      userSkill.skill.normalizedName,
    );

    if (normalizedName) {
      const existingScore =
        userScoreByNormalizedName.get(normalizedName) ?? -1;

      if (currentScore > existingScore) {
        userScoreByNormalizedName.set(normalizedName, currentScore);
      }
    }
  }

  const getCandidateScoreForJobSkill = (
    jobSkill: JobSkillWithSkill,
  ): number => {
    const scoreById = userScoreBySkillId.get(jobSkill.skillId);

    if (scoreById !== undefined) {
      return scoreById;
    }

    const normalizedName = normalizeSkillKey(
      jobSkill.skill.normalizedName,
    );

    if (!normalizedName) {
      return 0;
    }

    return userScoreByNormalizedName.get(normalizedName) ?? 0;
  };

  let totalRequirementWeight = 0;
  let achievedRequirementWeight = 0;
  let weightedSkillScore = 0;

  const gaps: CalculatedGap[] = [];

  for (const jobSkill of job.skills as JobSkillWithSkill[]) {
    const importance = Math.max(0, toNumber(jobSkill.importance));

    const requirementMultiplier = getRequirementMultiplier(
      jobSkill.requirementType,
    );

    const requirementWeight =
      importance * requirementMultiplier;

    const currentScore =
      getCandidateScoreForJobSkill(jobSkill);

    totalRequirementWeight += requirementWeight;

    weightedSkillScore +=
      requirementWeight * (currentScore / 100);

    if (currentScore >= PROFICIENCY_THRESHOLD) {
      achievedRequirementWeight += requirementWeight;
    } else {
      const gapScore = 100 - currentScore;
      const priority = gapScore * importance;

      gaps.push({
        skillId: jobSkill.skillId,
        skillName: jobSkill.skill.name,
        currentScore: round(currentScore, 3),
        gapScore: round(gapScore, 3),
        priority: round(priority, 3),
        importance: round(importance, 4),
      });
    }
  }

  if (totalRequirementWeight <= 0) {
    throw new Error(
      "Job skill weights must contain at least one positive importance value.",
    );
  }

  const matchScore = round(
    (weightedSkillScore / totalRequirementWeight) * 100,
    3,
  );

  const skillCoverage = round(
    achievedRequirementWeight / totalRequirementWeight,
    4,
  );

  const sortedGaps = [...gaps].sort(
    (first, second) => second.priority - first.priority,
  );

  const explanation = buildExplanation(
    job.skills.length,
    job.skills.length - sortedGaps.length,
    sortedGaps,
  );

  return {
    jobId,
    matchScore,
    skillCoverage,
    skillGapCount: sortedGaps.length,
    explanation,
    gaps: sortedGaps,
  };
};

export const calculateJobMatch = async (
  userId: string,
  jobId: string,
): Promise<JobMatchResult> => {
  const result = await calculateJobMatchInternal(
    userId,
    jobId,
  );

  return {
    jobId: result.jobId,
    matchScore: result.matchScore,
    skillCoverage: result.skillCoverage,
    skillGapCount: result.skillGapCount,
    explanation: result.explanation,
  };
};

export const calculateDetailedJobMatch = async (
  userId: string,
  jobId: string,
): Promise<DetailedJobMatchResult> => {
  return calculateJobMatchInternal(userId, jobId);
};

export const calculateJobRecommendations = async (
  userId: string,
  jobIds: string[],
): Promise<DetailedJobMatchResult[]> => {
  const uniqueJobIds = [
    ...new Set(
      jobIds.filter((jobId) => jobId.trim().length > 0),
    ),
  ];

  if (uniqueJobIds.length === 0) {
    return [];
  }

  const results: DetailedJobMatchResult[] = [];

  for (const jobId of uniqueJobIds) {
    try {
      const result = await calculateJobMatchInternal(
        userId,
        jobId,
      );

      results.push(result);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Job not found."
      ) {
        continue;
      }

      if (
        error instanceof Error &&
        error.message ===
          "Job does not contain any required or preferred skills."
      ) {
        continue;
      }

      throw error;
    }
  }

  return results.sort(
    (first, second) =>
      second.matchScore - first.matchScore ||
      second.skillCoverage - first.skillCoverage ||
      first.skillGapCount - second.skillGapCount,
  );
};

export const matchAlgorithmVersion =
  MATCH_ALGORITHM_VERSION;
