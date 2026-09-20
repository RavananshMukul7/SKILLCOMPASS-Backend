import { prisma } from "../config/prisma.js";
import { syncJobSource } from "../modules/jobs/jobSourceSync.service.js";

const main = async () => {
  const result = await syncJobSource(
    "SKILLCOMPASS_TEST_SOURCE"
  );

  console.log("JOB SOURCE SYNC RESULT:");

  console.dir(
    {
      source: result.source,
      jobsFetched: result.jobsFetched,
      jobsUpserted: result.jobsUpserted,
      jobs: result.jobs.map((job) => ({
        id: job.id,
        title: job.title,
        companyName: job.companyName,
        skillCount: job.skills.length,
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