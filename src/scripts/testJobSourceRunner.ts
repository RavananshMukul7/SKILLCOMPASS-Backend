import { prisma } from "../config/prisma.js";
import { TestJobSource } from "../modules/jobs/testJobSource.js";
import { runJobSource } from "../modules/jobs/jobSourceRunner.service.js";

const main = async () => {
  const source = new TestJobSource();

  const result = await runJobSource(source);

  console.log("JOB SOURCE RUN RESULT:");
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