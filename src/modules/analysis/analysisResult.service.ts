import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { createInstallationAccessToken } from "../github/githubInstallation.service.js";

/**
 * Loads one completed/selected analysis run and returns a JSON-safe projection
 * for the Analysis page.
 *
 * Important:
 * - Skill category comes from Skill.
 * - Evidence comes from SkillEvidence -> TechnologyEvidence.
 * - No raw Prisma objects containing BigInt values are returned.
 */
export const getAnalysisResult = async (
  userId: string,
  analysisRunId: string,
) => {
  const analysisRun = await prisma.analysisRun.findFirst({
    where: {
      id: analysisRunId,
      userId,
    },
    include: {
      snapshots: {
        orderBy: { capturedAt: "desc" },
        include: {
          repository: {
            select: {
              id: true,
              name: true,
              fullName: true,
              defaultBranch: true,
              description: true,
            },
          },
          languages: true,
          technologyEvidence: true,
        },
      },
      userSkills: {
        include: {
          skill: true,
          assessments: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
      proficiencyAssessments: {
        orderBy: { createdAt: "desc" },
        include: {
          userSkill: {
            include: { skill: true },
          },
        },
      },
    },
  });

  if (!analysisRun) {
    throw new AppError("Analysis run not found", 404);
  }

  const snapshot = analysisRun.snapshots[0] ?? null;

  // Load SkillEvidence separately. This avoids relying on the generated
  // UserSkill relation type, which may be stale in Prisma Client.
  const userSkillIds = analysisRun.userSkills.map(
    (userSkill) => userSkill.id,
  );

  const skillEvidenceLinks = userSkillIds.length
    ? await prisma.skillEvidence.findMany({
        where: {
          userSkillId: { in: userSkillIds },
        },
        include: {
          technologyEvidence: true,
        },
      })
    : [];

  const evidenceByUserSkillId = new Map<
    string,
    typeof skillEvidenceLinks
  >();

  for (const link of skillEvidenceLinks) {
    const existing =
      evidenceByUserSkillId.get(link.userSkillId);

    if (existing) {
      existing.push(link);
    } else {
      evidenceByUserSkillId.set(
        link.userSkillId,
        [link],
      );
    }
  }

  const safeEvidence = (
    links: typeof skillEvidenceLinks,
  ) =>
    links.map((link) => ({
      id: link.id,
      technology:
        link.technologyEvidence.technologyName,
      name:
        link.technologyEvidence.technologyName,
      normalizedName:
        link.technologyEvidence.normalizedName,
      evidenceType:
        link.technologyEvidence.evidenceType,
      evidenceValue:
        link.technologyEvidence.evidenceValue,
      confidence:
        Number(
          link.technologyEvidence.confidence,
        ),
      weight: Number(link.weight),
      reasoning: link.reasoning,
    }));

  const latestAssessmentByUserSkill = new Map<
    string,
    (typeof analysisRun.proficiencyAssessments)[number]
  >();

  for (const assessment of
    analysisRun.proficiencyAssessments) {
    if (
      !latestAssessmentByUserSkill.has(
        assessment.userSkillId,
      )
    ) {
      latestAssessmentByUserSkill.set(
        assessment.userSkillId,
        assessment,
      );
    }
  }

  const skills = analysisRun.userSkills.map(
    (userSkill) => {
      const assessment =
        latestAssessmentByUserSkill.get(
          userSkill.id,
        ) ??
        userSkill.assessments[0] ??
        null;

      const evidence = safeEvidence(
        evidenceByUserSkillId.get(
          userSkill.id,
        ) ?? [],
      );

      const score = Number(
        assessment?.score ??
          userSkill.currentScore,
      );

      const confidence = Number(
        assessment?.confidence ??
          userSkill.confidence,
      );

      const level =
        assessment?.level ?? null;

      return {
        id: userSkill.id,
        userSkillId: userSkill.id,
        skillId: userSkill.skillId,
        userId: userSkill.userId,
        name: userSkill.skill.name,
        skillName: userSkill.skill.name,
        normalizedName:
          userSkill.skill.normalizedName,
        category:
          userSkill.skill.category,
        description:
          userSkill.skill.description,
        currentScore:
          Number(userSkill.currentScore),
        score,
        confidence,
        level,
        proficiency: {
          score,
          level,
          confidence,
          methodologyVersion:
            assessment?.methodologyVersion ??
            null,
        },
        evidence,
        evidenceCount: evidence.length,
        sourceAnalysisRunId:
          userSkill.sourceAnalysisRunId,
        firstDetectedAt:
          userSkill.firstDetectedAt,
        lastEvaluatedAt:
          userSkill.lastEvaluatedAt,
      };
    },
  );

  const proficiencies =
    analysisRun.proficiencyAssessments.map(
      (assessment) => {
        const userSkill =
          assessment.userSkill;

        return {
          id: assessment.id,
          analysisRunId:
            assessment.analysisRunId,
          userSkillId:
            assessment.userSkillId,
          skillId: userSkill.skillId,
          skillName:
            userSkill.skill.name,
          name:
            userSkill.skill.name,
          score:
            Number(assessment.score),
          level: assessment.level,
          confidence:
            Number(assessment.confidence),
          methodologyVersion:
            assessment.methodologyVersion,
          createdAt:
            assessment.createdAt,
          evidence: safeEvidence(
            evidenceByUserSkillId.get(
              userSkill.id,
            ) ?? [],
          ),
        };
      },
    );

  const languages =
    (snapshot?.languages ?? []).map(
      (language) => ({
        id: language.id,
        language: language.language,
        name: language.language,
        bytes: Number(language.bytes),
        percentage:
          Number(language.percentage),
      }),
    );

  const technologies =
    (snapshot?.technologyEvidence ?? []).map(
      (technology) => ({
        id: technology.id,
        name:
          technology.technologyName,
        technologyName:
          technology.technologyName,
        normalizedName:
          technology.normalizedName,
        evidenceType:
          technology.evidenceType,
        evidenceValue:
          technology.evidenceValue,
        confidence:
          Number(technology.confidence),
      }),
    );

  const repository =
    snapshot?.repository
      ? {
          id: snapshot.repository.id,
          name: snapshot.repository.name,
          fullName:
            snapshot.repository.fullName,
          defaultBranch:
            snapshot.repository.defaultBranch,
          description:
            snapshot.repository.description,
        }
      : null;

  let files: Array<
    Record<string, unknown>
  > = [];

  let commits: Array<
    Record<string, unknown>
  > = [];

  /*
   * RepositorySnapshot intentionally stores the exact commit SHA, but the
   * schema does not have separate RepositoryFile / RepositoryCommit tables.
   * Populate the existing Files and Commits UI from that exact GitHub snapshot
   * instead of returning hard-coded empty arrays.
   *
   * Keep this read-only and scoped to the selected analysis run.
   */
  if (snapshot?.repositoryId) {
    try {
      /*
       * Repository is now directly owned by the SkillCompass user through
       * Repository.userId.
       *
       * This is important because githubAccountId can become null after the
       * user disconnects GitHub. The repository and its analysis history must
       * still remain accessible to its original SkillCompass owner.
       */
      const storedRepository =
        await prisma.repository.findFirst({
          where: {
            id: snapshot.repositoryId,
            userId,
          },
          select: {
            ownerLogin: true,
            name: true,
            defaultBranch: true,
            githubAccountId: true,
          },
        });

      /*
       * A disconnected repository can legitimately have no active
       * githubAccountId. In that case we keep the stored analysis result
       * readable and simply skip live GitHub file/commit retrieval.
       */
      if (
        storedRepository &&
        storedRepository.githubAccountId
      ) {
        const githubAccount =
          await prisma.gitHubAccount.findUnique({
            where: {
              id: storedRepository.githubAccountId,
            },
            select: {
              githubInstallationId: true,
            },
          });

        if (
          githubAccount?.githubInstallationId
        ) {
          const { token } =
            await createInstallationAccessToken(
              githubAccount.githubInstallationId,
            );

          const owner =
            encodeURIComponent(
              storedRepository.ownerLogin,
            );

          const repo =
            encodeURIComponent(
              storedRepository.name,
            );

          const ref =
            encodeURIComponent(
              snapshot.commitSha ??
                storedRepository.defaultBranch ??
                "main",
            );

          const githubHeaders = {
            Accept:
              "application/vnd.github+json",
            Authorization:
              `Bearer ${token}`,
            "X-GitHub-Api-Version":
              "2022-11-28",
          };

          const [
            treeResponse,
            commitsResponse,
          ] = await Promise.all([
            fetch(
              `https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`,
              {
                headers: githubHeaders,
              },
            ),
            fetch(
              `https://api.github.com/repos/${owner}/${repo}/commits?sha=${ref}&per_page=25`,
              {
                headers: githubHeaders,
              },
            ),
          ]);

          if (treeResponse.ok) {
            const treePayload =
              (await treeResponse.json()) as {
                tree?: Array<{
                  path?: string;
                  sha?: string;
                  type?: string;
                  size?: number;
                }>;
              };

            files =
              (
                treePayload.tree ??
                []
              )
                .filter(
                  (item) =>
                    item.path &&
                    item.sha,
                )
                .map((item) => {
                  const path =
                    item.path as string;

                  const isTree =
                    item.type === "tree";

                  const extension =
                    isTree
                      ? ""
                      : (() => {
                          const dot =
                            path.lastIndexOf(
                              ".",
                            );

                          return dot >
                            path.lastIndexOf(
                              "/",
                            )
                            ? path.slice(
                                dot,
                              )
                            : "";
                        })();

                  return {
                    path,
                    sha: item.sha,
                    type: isTree
                      ? "tree"
                      : "blob",
                    size: Number(
                      item.size ?? 0,
                    ),
                    extension,
                  };
                });
          } else {
            console.warn(
              "Unable to load GitHub repository tree for analysis result:",
              treeResponse.status,
            );
          }

          if (commitsResponse.ok) {
            const commitPayload =
              (await commitsResponse.json()) as Array<{
                sha?: string;
                html_url?: string;
                commit?: {
                  message?: string;
                  author?: {
                    name?: string;
                    date?: string;
                  } | null;
                  committer?: {
                    name?: string;
                    date?: string;
                  } | null;
                };
              }>;

            commits =
              (
                Array.isArray(
                  commitPayload,
                )
                  ? commitPayload
                  : []
              )
                .filter(
                  (item) =>
                    item.sha,
                )
                .map((item) => {
                  const commit =
                    item.commit ?? {};

                  const author =
                    commit.author ??
                    commit.committer ??
                    {};

                  const sha =
                    item.sha as string;

                  return {
                    sha,
                    shortSha:
                      sha.slice(0, 7),
                    message:
                      commit.message ??
                      "Commit",
                    authorName:
                      author.name ??
                      "Unknown author",
                    authorDate:
                      author.date ??
                      null,
                    htmlUrl:
                      item.html_url ??
                      null,
                  };
                });
          } else {
            console.warn(
              "Unable to load GitHub commit history for analysis result:",
              commitsResponse.status,
            );
          }
        }
      }
    } catch (error) {
      /*
       * Files/commits are supplemental to the analysis result. Do not make a
       * completed analysis unreadable just because GitHub detail retrieval fails.
       */
      console.warn(
        "GitHub detail retrieval skipped for analysis result:",
        error instanceof Error
          ? error.message
          : error,
      );
    }
  }

  return {
    analysisRun: {
      id: analysisRun.id,
      userId: analysisRun.userId,
      repositoryId:
        snapshot?.repositoryId ??
        null,
      status: analysisRun.status,
      startedAt:
        analysisRun.startedAt,
      completedAt:
        analysisRun.completedAt,
      errorMessage:
        analysisRun.errorMessage,
      createdAt:
        analysisRun.createdAt,
    },

    repository,

    snapshot: snapshot
      ? {
          id: snapshot.id,
          repositoryId:
            snapshot.repositoryId,
          analysisRunId:
            snapshot.analysisRunId,
          commitSha:
            snapshot.commitSha,
          capturedAt:
            snapshot.capturedAt,
          repository,
          languages,
          technologies,
        }
      : null,

    snapshots: snapshot
      ? [
          {
            id: snapshot.id,
            repositoryId:
              snapshot.repositoryId,
            analysisRunId:
              snapshot.analysisRunId,
            commitSha:
              snapshot.commitSha,
            capturedAt:
              snapshot.capturedAt,
            repository,
            languages,
            technologies,
          },
        ]
      : [],

    languages,
    technologies,
    skills,
    userSkills: skills,
    proficiencies,
    proficiencyAssessments:
      proficiencies,

    methodologyVersion:
      proficiencies[0]
        ?.methodologyVersion ??
      null,

    skillCount: skills.length,

    fileCount:
      files.filter(
        (item) =>
          item.type === "blob",
      ).length,

    commitCount:
      commits.length,

    files,
    commits,
    activity: [],
  };
};