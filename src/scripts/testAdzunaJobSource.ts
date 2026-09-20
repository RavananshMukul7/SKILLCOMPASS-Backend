import { AdzunaJobSource } from "../modules/jobs/adzunaJobSource.js";
import "dotenv/config";
const main = async () => {
  const source = new AdzunaJobSource();

  console.log("SOURCE:", source.name);

  const jobs = await source.fetchJobs();

  console.log("JOBS FETCHED:", jobs.length);

  console.dir(
    jobs.slice(0, 3).map((job) => ({
      externalJobId: job.externalJobId,
      title: job.title,
      companyName: job.companyName,
      location: job.location,
      employmentType: job.employmentType,
      remote: job.remote,
      url: job.url,
      descriptionPreview: job.description?.slice(0, 150) ?? null,
      skillsProvided: job.skills ?? [],
    })),
    { depth: null }
  );
};

main()
  .catch((error) => {
    console.error("ADZUNA TEST FAILED:");
    console.error(error);
    process.exitCode = 1;
  });