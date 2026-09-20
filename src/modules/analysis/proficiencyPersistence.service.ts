import { prisma } from "../../config/prisma.js";
import type { ProficiencyResult } from "./proficiency.service.js";

interface PersistProficienciesInput {
  analysisRunId: string;
  persistedSkills: Array<{
    userSkillId: string;
    normalizedName: string;
  }>;
  proficiencies: ProficiencyResult[];
}

export const persistProficiencies = async ({
  analysisRunId,
  persistedSkills,
  proficiencies,
}: PersistProficienciesInput) => {
  const userSkillByName = new Map(
    persistedSkills.map((skill) => [
      skill.normalizedName,
      skill.userSkillId,
    ])
  );

  const persistedAssessments = [];

  for (const proficiency of proficiencies) {
    const normalizedName =
      proficiency.skillName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");

    const userSkillId =
      userSkillByName.get(normalizedName);

    if (!userSkillId) {
      continue;
    }

    const assessment =
      await prisma.proficiencyAssessment.create({
        data: {
          userSkillId,
          analysisRunId,
          score: proficiency.score,
          level: proficiency.level,
          confidence: Number(
            proficiency.confidence.toFixed(3)
          ),
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
        confidence: Number(
          proficiency.confidence.toFixed(3)
        ),
        lastEvaluatedAt: new Date(),
        sourceAnalysisRunId: analysisRunId,
      },
    });

    persistedAssessments.push({
      id: assessment.id,
      userSkillId,
      skillName: proficiency.skillName,
      score: proficiency.score,
      level: proficiency.level,
      confidence: Number(
        proficiency.confidence.toFixed(3)
      ),
      methodologyVersion:
        proficiency.methodologyVersion,
    });
  }

  return persistedAssessments;
};