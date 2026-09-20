import { prisma } from "../../config/prisma.js";

const MATCH_ALGORITHM_VERSION = "weighted-skill-v1";
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

interface CalculatedGap {
  skillId: string;
  skillName: string;
  currentScore: number;
  gapScore: number;
  priority: number;
  importance: number;
}

export interface JobMatchResult {
  jobId: string;
  analysisRunId: string;
  matchScore: number;
  skillCoverage: number;
  skillGapCount: number;
  explanation: string;
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

  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
};

const getRequirementMultiplier = (requirementType: RequirementType): number => {
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

  return `${base} ` + `Missing or below-threshold skills: ${gapDetails}.`;
};

export const calculateJobMatch = async (
  userId: string,
  jobId: string,
  analysisRunId: string,
): Promise<JobMatchResult> => {
  const analysisRun = await prisma.analysisRun.findFirst({
    where: {
      id: analysisRunId,
      userId,
      status: "COMPLETED",
    },
    select: {
      id: true,
    },
  });

  if (!analysisRun) {
    throw new Error(
      "Completed analysis run not found for the authenticated user.",
    );
  }

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
    throw new Error("Job does not contain any required or preferred skills.");
  }

  const userSkills = (await prisma.userSkill.findMany({
    where: {
      userId,
    },
    include: {
      skill: true,
    },
  })) as UserSkillWithSkill[];

  const userScoreBySkillId = new Map<string, number>();

  for (const userSkill of userSkills) {
    userScoreBySkillId.set(
      userSkill.skillId,
      Math.max(0, Math.min(100, round(toNumber(userSkill.currentScore), 3))),
    );
  }

  let totalRequirementWeight = 0;
  let achievedRequirementWeight = 0;
  let weightedSkillScore = 0;

  const gaps: CalculatedGap[] = [];

  for (const jobSkill of job.skills as JobSkillWithSkill[]) {
    const importance = Math.max(0, toNumber(jobSkill.importance));

    const requirementMultiplier = getRequirementMultiplier(
      jobSkill.requirementType,
    );

    const requirementWeight = importance * requirementMultiplier;

    const currentScore = userScoreBySkillId.get(jobSkill.skillId) ?? 0;

    console.log({
      jobSkill: jobSkill.skill.name,
      jobSkillId: jobSkill.skillId,
      jobNormalizedName: jobSkill.skill.normalizedName,
      currentScore,
      userHasSameSkillId: userScoreBySkillId.has(jobSkill.skillId),
    });

    totalRequirementWeight += requirementWeight;

    weightedSkillScore += requirementWeight * (currentScore / 100);

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

  const explanation = buildExplanation(
    job.skills.length,
    job.skills.length - gaps.length,
    gaps,
  );

  await prisma.skillGap.deleteMany({
    where: {
      userId,
      jobId,
      analysisRunId,
    },
  });

  if (gaps.length > 0) {
    await prisma.skillGap.createMany({
      data: gaps.map((gap) => ({
        userId,
        jobId,
        analysisRunId,
        skillId: gap.skillId,
        currentScore: gap.currentScore,
        gapScore: gap.gapScore,
        priority: gap.priority,
        requiredImportance: gap.importance,
      })),
    });
  }

  await prisma.jobMatch.upsert({
    where: {
      userId_jobId_analysisRunId_algorithmVersion: {
        userId,
        jobId,
        analysisRunId,
        algorithmVersion: MATCH_ALGORITHM_VERSION,
      },
    },
    create: {
      userId,
      jobId,
      analysisRunId,
      matchScore,
      skillCoverage,
      skillGapCount: gaps.length,
      explanation,
      algorithmVersion: MATCH_ALGORITHM_VERSION,
    },
    update: {
      matchScore,
      skillCoverage,
      skillGapCount: gaps.length,
      explanation,
    },
  });

  return {
    jobId,
    analysisRunId,
    matchScore,
    skillCoverage,
    skillGapCount: gaps.length,
    explanation,
  };
};
