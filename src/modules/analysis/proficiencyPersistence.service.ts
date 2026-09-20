import { prisma } from "../../config/prisma.js";

import type {
  ProficiencyResult,
} from "./proficiency.service.js";

interface PersistProficienciesInput {
  analysisRunId: string;

  persistedSkills: Array<{
    userSkillId: string;
    normalizedName: string;
  }>;

  proficiencies: ProficiencyResult[];
}

const normalizeSkillName = (
  name: string
): string => {
  return name
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, "-");
};

export const persistProficiencies = async ({
  analysisRunId,
  persistedSkills,
  proficiencies,
}: PersistProficienciesInput) => {
  const userSkillByName = new Map(
    persistedSkills.map((skill) => [
      normalizeSkillName(
        skill.normalizedName
      ),
      skill.userSkillId,
    ])
  );

  const persistedAssessments = [];

  for (const proficiency of proficiencies) {
    const normalizedName =
      normalizeSkillName(
        proficiency.skillName
      );

    const userSkillId =
      userSkillByName.get(
        normalizedName
      );

    if (!userSkillId) {
      console.warn(
        `No persisted UserSkill found for proficiency: ${proficiency.skillName} (${normalizedName})`
      );

      continue;
    }

    const confidence = Number(
      proficiency.confidence.toFixed(3)
    );

    const assessment =
      await prisma.proficiencyAssessment.create({
        data: {
          userSkillId,
          analysisRunId,
          score: proficiency.score,
          level: proficiency.level,
          confidence,
          methodologyVersion:
            proficiency.methodologyVersion,
        },
      });

    await prisma.userSkill.update({
      where: {
        id: userSkillId,
      },
      data: {
        currentScore: proficiency.score,
        confidence,
        lastEvaluatedAt: new Date(),
        sourceAnalysisRunId:
          analysisRunId,
      },
    });

    persistedAssessments.push({
      id: assessment.id,
      userSkillId,
      skillName: proficiency.skillName,
      score: proficiency.score,
      level: proficiency.level,
      confidence,
      methodologyVersion:
        proficiency.methodologyVersion,
    });
  }

  return persistedAssessments;
};