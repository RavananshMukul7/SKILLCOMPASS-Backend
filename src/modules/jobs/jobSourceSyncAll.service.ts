import { prisma } from "../../config/prisma.js";
import { getJobSources } from "./jobSourceRegistry.js";
import { runJobSource } from "./jobSourceRunner.service.js";

export const syncAllJobSources = async () => {
  const sources = getJobSources();

  /**
   * The sync-all operation represents a complete refresh of the
   * current job catalog.
   *
   * Deleting Job records also removes their dependent JobSkill,
   * JobJobProfile, JobMatch, and SkillGap records through the
   * cascade relations defined in the Prisma schema.
   */
  const deletedJobsResult = await prisma.job.deleteMany();

  const results = [];

  for (const source of sources) {
    const result = await runJobSource(source);

    results.push({
      source: result.source,
      jobsFetched: result.jobsFetched,
      jobsUpserted: result.jobsUpserted,
      jobs: result.jobs,
    });
  }

  return {
    sourcesProcessed: sources.length,
    deletedJobs: deletedJobsResult.count,
    results,
  };
};