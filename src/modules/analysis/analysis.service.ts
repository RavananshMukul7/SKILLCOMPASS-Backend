import { prisma } from "../../config/prisma.js";
import { analysisQueue } from "../../queues/analysis.queue.js";
import { AppError } from "../../utils/AppError.js";

export const startRepositoryAnalysis = async (
  userId: string,
  repositoryId: string
) => {
  const repository = await prisma.repository.findFirst({
    where: {
      id: repositoryId,
      githubAccount: {
        userId,
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!repository) {
    throw new AppError("Repository not found", 404);
  }

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
      409
    );
  }

  const analysisRun = await prisma.analysisRun.create({
    data: {
      userId,
      repositoryId: repository.id,
      status: "PENDING",
    },
  });

  try {
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
      }
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