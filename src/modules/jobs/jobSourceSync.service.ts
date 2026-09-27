import { getJobSource } from "./jobSourceRegistry.js";
import { runJobSource } from "./jobSourceRunner.service.js";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";

/**
 * Remove the existing job catalog for one source.
 *
 * JobSkill, JobJobProfile, JobMatch, and SkillGap records connected
 * to these jobs are removed automatically through the cascade
 * relationships defined in the Prisma schema.
 */
export const clearJobSourceCatalog = async (
  sourceName: string,
): Promise<number> => {
  const result = await prisma.job.deleteMany({
    where: {
      source: sourceName,
    },
  });

  return result.count;
};

/**
 * Synchronize one registered job source.
 *
 * The source's previous jobs are removed first so the database
 * represents the latest catalog returned by that source.
 */
export const syncJobSource = async (
  sourceName: string,
) => {
  const source = getJobSource(sourceName);

  if (!source) {
    throw new AppError(
      `Job source not found: ${sourceName}`,
      404,
    );
  }

  const deletedJobs = await clearJobSourceCatalog(source.name);

  const result = await runJobSource(source);

  return {
    ...result,
    deletedJobs,
  };
};