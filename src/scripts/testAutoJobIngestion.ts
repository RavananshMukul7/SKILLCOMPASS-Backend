import { prisma } from "../config/prisma.js";
import type {
  ExternalJobRecord,
  JobSource,
} from "../modules/jobs/jobSource.types.js";
import { runJobSource } from "../modules/jobs/jobSourceRunner.service.js";

class RawTestJobSource implements JobSource {
  name = "SKILLCOMPASS_RAW_TEST_SOURCE";

  async fetchJobs(): Promise<ExternalJobRecord[]> {
    return [
      {
        externalJobId: "raw-source-001",
        title: "Node.js Backend Developer Intern",
        companyName: "SkillCompass Raw Source Test",
        location: "Remote",
        employmentType: "Internship",
        remote: true,
        url: "http://localhost:3000/test-job/raw-node",
        description: `
          We are looking for a backend developer intern.

          Required:
          - JavaScript
          - Node.js
          - REST APIs
          - Object-oriented programming

          Preferred:
          - Python
          - PostgreSQL
          - Docker

          Experience with asynchronous programming is a plus.
        `,
      },
    ];
  }
}

const main = async () => {
  const source = new RawTestJobSource();

  const result = await runJobSource(source);

  console.log("AUTO INGESTION RESULT:");

  console.dir(
    result.jobs.map((job) => ({
      id: job.id,
      title: job.title,
      companyName: job.companyName,
      skills: job.skills.map((skill) => ({
        name: skill.skill.name,
        requirementType: skill.requirementType,
        importance: Number(skill.importance),
      })),
    })),
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