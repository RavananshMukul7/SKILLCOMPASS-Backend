import type { ExtractedSkill } from "./skillExtraction.service.js";

export type ProficiencyLevel =
  | "BEGINNER"
  | "INTERMEDIATE"
  | "ADVANCED"
  | "EXPERT";

export interface ProficiencyResult {
  skillName: string;
  score: number;
  level: ProficiencyLevel;
  confidence: number;
  methodologyVersion: string;
  factors: {
    evidenceCount: number;
    uniqueFileCount: number;
    evidenceConfidence: number;
  };
}

const getLevel = (
  score: number
): ProficiencyLevel => {
  if (score >= 85) {
    return "EXPERT";
  }

  if (score >= 65) {
    return "ADVANCED";
  }

  if (score >= 40) {
    return "INTERMEDIATE";
  }

  return "BEGINNER";
};

export const calculateProficiency = (
  skill: ExtractedSkill
): ProficiencyResult => {
  const evidenceCount =
    skill.evidence.length;

  const uniqueFiles = new Set(
    skill.evidence.map(
      (evidence) => evidence.path
    )
  );

  const uniqueFileCount =
    uniqueFiles.size;

  const evidenceConfidence =
    skill.confidence;

  /*
   * Repository-only proficiency estimate.
   *
   * This intentionally does NOT claim that repository
   * evidence is equivalent to a real-world skill test.
   */

  const evidenceScore = Math.min(
    evidenceCount * 10,
    30
  );

  const fileScore = Math.min(
    uniqueFileCount * 10,
    30
  );

  const confidenceScore =
    evidenceConfidence * 20;

  const score = Math.round(
    Math.min(
      100,
      evidenceScore +
        fileScore +
        confidenceScore
    )
  );

  const confidence = Math.min(
    1,
    0.5 +
      evidenceCount * 0.1 +
      uniqueFileCount * 0.1
  );

  return {
    skillName: skill.skillName,
    score,
    level: getLevel(score),
    confidence,
    methodologyVersion: "repository-evidence-v1",
    factors: {
      evidenceCount,
      uniqueFileCount,
      evidenceConfidence,
    },
  };
};

export const calculateProficiencies = (
  skills: ExtractedSkill[]
): ProficiencyResult[] =>
  skills.map(calculateProficiency);