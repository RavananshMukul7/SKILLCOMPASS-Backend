import { prisma } from "../../config/prisma.js";
import { analysisQueue } from "../../queues/analysis.queue.js";
import { AppError } from "../../utils/AppError.js";

export const startRepositoryAnalysis = async (
  userId: string,
  repositoryId: string,
) => {
  /**
   * Authorization:
   *
   * A repository belongs to a SkillCompass user through Repository.userId.
   *
   * We must authorize using both:
   *   - repositoryId
   *   - userId
   *
   * Do not rely on githubAccount.userId because githubAccountId
   * is nullable and repositories are intentionally preserved after
   * a GitHub account is disconnected.
   */
  const repository = await prisma.repository.findFirst({
    where: {
      id: repositoryId,
      userId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!repository) {
    throw new AppError("Repository not found", 404);
  }

  /**
   * Prevent multiple active analyses for the same repository
   * belonging to the authenticated user.
   */
  const existingRun = await prisma.analysisRun.findFirst({
    where: {
      repositoryId: repository.id,
      userId,
      status: {
        in: ["PENDING", "QUEUED", "RUNNING"],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (existingRun) {
    throw new AppError(
      "An analysis is already running for this repository",
      409,
    );
  }

  /**
   * Create the analysis run under the authenticated user.
   */
  const analysisRun = await prisma.analysisRun.create({
    data: {
      userId,
      repositoryId: repository.id,
      status: "PENDING",
    },
  });

  try {
    /**
     * Queue the analysis job with the authenticated user's
     * identity and the authorized SkillCompass repository ID.
     */
    await analysisQueue.add(
      "analyze-repository",
      {
        analysisRunId: analysisRun.id,
        repositoryId: repository.id,
        userId,
      },
      {
        jobId: analysisRun.id,
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    );

    await prisma.analysisRun.update({
      where: {
        id: analysisRun.id,
      },
      data: {
        status: "QUEUED",
      },
    });
  } catch (error) {
    await prisma.analysisRun.update({
      where: {
        id: analysisRun.id,
      },
      data: {
        status: "FAILED",
        errorMessage:
          error instanceof Error
            ? error.message
            : "Unable to queue analysis",
      },
    });

    throw error;
  }

  return {
    analysisRunId: analysisRun.id,
    repositoryId: repository.id,
    repositoryName: repository.name,
    status: "QUEUED",
  };
};