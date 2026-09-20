import { prisma } from "../config/prisma.js";
import { upsertJob } from "../modules/jobs/jobIngestion.service.js";
const main = async () => {
    const result = await upsertJob({
        source: "SKILLCOMPASS_TEST",
        externalJobId: "ingestion-test-001",
        title: "Full Stack Developer Intern",
        companyName: "SkillCompass Ingestion Test",
        location: "Remote",
        employmentType: "Internship",
        remote: true,
        url: "http://localhost:3000/test-job/full-stack-developer",
        description: "Test job for the job ingestion service.",
        skills: [
            {
                skillName: "JavaScript Programming",
                normalizedName: "javascript-programming",
                category: "PROGRAMMING",
                requirementType: "REQUIRED",
                importance: 1.0,
            },
            {
                skillName: "Object-Oriented Programming",
                normalizedName: "object-oriented-programming",
                category: "PROGRAMMING_PARADIGM",
                requirementType: "REQUIRED",
                importance: 0.8,
            },
            {
                skillName: "Python Programming",
                normalizedName: "python-programming",
                category: "PROGRAMMING",
                requirementType: "PREFERRED",
                importance: 0.4,
            },
        ],
    });
    console.log("INGESTED JOB:");
    console.dir(result, { depth: null });
};
main()
    .catch((error) => {
    console.error(error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
