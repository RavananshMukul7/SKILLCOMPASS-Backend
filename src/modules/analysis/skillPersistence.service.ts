import { prisma } from "../../config/prisma.js";
import type { ExtractedSkill } from "./skillExtraction.service.js";

interface PersistSkillsInput {
  userId: string;
  analysisRunId: string;
  skills: ExtractedSkill[];
  technologyEvidenceByName: Map<
    string,
    {
      id: string;
      normalizedName: string;
    }
  >;
}

export const persistExtractedSkills = async ({
  userId,
  analysisRunId,
  skills,
  technologyEvidenceByName,
}: PersistSkillsInput) => {
  const persistedSkills = [];

  for (const extractedSkill of skills) {
    const skill = await prisma.skill.upsert({
      where: {
        normalizedName: extractedSkill.normalizedName,
      },
      update: {
        name: extractedSkill.skillName,
        category: extractedSkill.category,
      },
      create: {
        name: extractedSkill.skillName,
        normalizedName: extractedSkill.normalizedName,
        category: extractedSkill.category,
      },
    });

    const existingUserSkill = await prisma.userSkill.findUnique({
      where: {
        userId_skillId: {
          userId,
          skillId: skill.id,
        },
      },
      select: {
        id: true,
        currentScore: true,
        confidence: true,
        firstDetectedAt: true,
      },
    });

    const now = new Date();

    const userSkill = await prisma.userSkill.upsert({
      where: {
        userId_skillId: {
          userId,
          skillId: skill.id,
        },
      },
      update: {
        currentScore: extractedSkill.confidence * 100,
        confidence: extractedSkill.confidence,
        lastEvaluatedAt: now,
        sourceAnalysisRunId: analysisRunId,
      },
      create: {
        userId,
        skillId: skill.id,
        currentScore: extractedSkill.confidence * 100,
        confidence: extractedSkill.confidence,
        firstDetectedAt: now,
        lastEvaluatedAt: now,
        sourceAnalysisRunId: analysisRunId,
      },
    });

    for (const evidence of extractedSkill.evidence) {
      const technologyEvidence =
        technologyEvidenceByName.get(
          evidence.technologyName
            .trim()
            .toLowerCase()
        );

      if (!technologyEvidence) {
        continue;
      }

      await prisma.skillEvidence.upsert({
        where: {
          userSkillId_technologyEvidenceId: {
            userSkillId: userSkill.id,
            technologyEvidenceId:
              technologyEvidence.id,
          },
        },
        update: {
          weight: extractedSkill.confidence,
          reasoning: evidence.reasoning,
        },
        create: {
          userSkillId: userSkill.id,
          technologyEvidenceId:
            technologyEvidence.id,
          weight: extractedSkill.confidence,
          reasoning: evidence.reasoning,
        },
      });
    }

    persistedSkills.push({
      skillId: skill.id,
      userSkillId: userSkill.id,
      skillName: skill.name,
      normalizedName: skill.normalizedName,
      currentScore: Number(userSkill.currentScore),
      confidence: Number(userSkill.confidence),
      wasExistingSkill: Boolean(existingUserSkill),
    });
  }

  return persistedSkills;
};