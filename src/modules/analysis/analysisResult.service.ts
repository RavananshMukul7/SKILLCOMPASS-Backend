import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";

export const getAnalysisResult = async (
  userId: string,
  analysisRunId: string
) => {
  const analysisRun =
    await prisma.analysisRun.findFirst({
      where: {
        id: analysisRunId,
        userId,
      },
      include: {
        repository: {
          select: {
            id: true,
            name: true,
            fullName: true,
            ownerLogin: true,
            defaultBranch: true,
            htmlUrl: true,
          },
        },
        snapshots: {
          orderBy: {
            capturedAt: "desc",
          },
          take: 1,
          include: {
            languages: {
              orderBy: {
                percentage: "desc",
              },
            },
            technologyEvidence: {
              orderBy: {
                confidence: "desc",
              },
            },
          },
        },
        userSkills: {
          where: {
            sourceAnalysisRunId: analysisRunId,
          },
          include: {
            skill: true,
            assessments: {
              where: {
                analysisRunId,
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
            },
            evidence: {
              include: {
                technologyEvidence: true,
              },
            },
          },
          orderBy: {
            currentScore: "desc",
          },
        },
      },
    });

  if (!analysisRun) {
    throw new AppError(
      "Analysis run not found",
      404
    );
  }

  const snapshot = analysisRun.snapshots[0];

  return {
    analysisRun: {
      id: analysisRun.id,
      status: analysisRun.status,
      startedAt: analysisRun.startedAt,
      completedAt: analysisRun.completedAt,
      errorMessage: analysisRun.errorMessage,
      createdAt: analysisRun.createdAt,
    },

    repository: analysisRun.repository,

    snapshot: snapshot
      ? {
          id: snapshot.id,
          commitSha: snapshot.commitSha,
          capturedAt: snapshot.capturedAt,

          languages: snapshot.languages.map(
            (language) => ({
              language: language.language,
              bytes: language.bytes.toString(),
              percentage: Number(
                language.percentage
              ),
            })
          ),

          technologies:
            snapshot.technologyEvidence.map(
              (technology) => ({
                id: technology.id,
                name: technology.technologyName,
                normalizedName:
                  technology.normalizedName,
                evidenceType:
                  technology.evidenceType,
                evidenceValue:
                  technology.evidenceValue,
                confidence: Number(
                  technology.confidence
                ),
              })
            ),
        }
      : null,

    skills: analysisRun.userSkills.map(
      (userSkill) => {
        const assessment =
          userSkill.assessments[0];

        return {
          id: userSkill.id,
          name: userSkill.skill.name,
          normalizedName:
            userSkill.skill.normalizedName,
          category:
            userSkill.skill.category,

          score: Number(
            userSkill.currentScore
          ),

          confidence: Number(
            userSkill.confidence
          ),

          proficiency: assessment
            ? {
                score: Number(
                  assessment.score
                ),
                level: assessment.level,
                confidence: Number(
                  assessment.confidence
                ),
                methodologyVersion:
                  assessment.methodologyVersion,
              }
            : null,

    evidence:
        userSkill.evidence
          .filter((evidence) =>
            snapshot?.technologyEvidence.some(
              (technology) =>
                technology.id ===
                evidence.technologyEvidenceId
            )
          )
          .map((evidence) => ({
            technology:
              evidence.technologyEvidence
                .technologyName,
            evidenceType:
              evidence.technologyEvidence
                .evidenceType,
            evidenceValue:
              evidence.technologyEvidence
                .evidenceValue,
            weight: Number(
              evidence.weight
            ),
            reasoning:
              evidence.reasoning,
          })),
        };
      }
    ),
  };
};