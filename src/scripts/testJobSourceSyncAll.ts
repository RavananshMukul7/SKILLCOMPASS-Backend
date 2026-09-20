import { prisma } from "../config/prisma.js";
import { syncAllJobSources } from "../modules/jobs/jobSourceSyncAll.service.js";

const main = async () => {
  const result = await syncAllJobSources();

  console.log("ALL JOB SOURCES SYNC RESULT:");

  console.dir(
    {
      sourcesProcessed: result.sourcesProcessed,
      results: result.results.map((source) => ({
        source: source.source,
        jobsFetched: source.jobsFetched,
        jobsUpserted: source.jobsUpserted,
        jobs: source.jobs.map((job) => ({
          id: job.id,
          title: job.title,
          companyName: job.companyName,
          skillCount: job.skills.length,
        })),
      })),
    },
    { depth: null }
  );
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });