import "dotenv/config";
import { prisma } from "../config/prisma.js";
import { AdzunaJobSource } from "../modules/jobs/adzunaJobSource.js";
import { runJobSource } from "../modules/jobs/jobSourceRunner.service.js";
const main = async () => {
    const source = new AdzunaJobSource();
    const result = await runJobSource(source);
    console.log("ADZUNA INGESTION RESULT:");
    console.log("Source:", result.source);
    console.log("Jobs fetched:", result.jobsFetched);
    console.log("Jobs upserted:", result.jobsUpserted);
    console.table(result.jobs.map((job) => ({
        id: job.id,
        title: job.title,
        companyName: job.companyName,
        skillCount: job.skills.length,
        skills: job.skills
            .map((skill) => `${skill.skill.name} [${skill.requirementType}]`)
            .join(", "),
    })));
};
main()
    .catch((error) => {
    console.error("ADZUNA INGESTION FAILED:");
    console.error(error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
