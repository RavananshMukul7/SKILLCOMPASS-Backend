import { prisma } from "../config/prisma.js";

const main = async () => {
  const skillNames = [
    "c++-programming",
    "javascript-programming",
    "object-oriented-programming",
    "python-programming",
    "functional-programming",
  ];

  const skills = await prisma.skill.findMany({
    where: {
      normalizedName: {
        in: skillNames,
      },
    },
  });

  const skillMap = new Map(
    skills.map((skill) => [skill.normalizedName, skill])
  );

  for (const skillName of skillNames) {
    if (!skillMap.has(skillName)) {
      throw new Error(`Skill not found: ${skillName}`);
    }
  }

  const job = await prisma.job.upsert({
    where: {
      source_externalJobId: {
        source: "SKILLCOMPASS_TEST",
        externalJobId: "test-backend-developer-001",
      },
    },
    update: {
      title: "Backend Developer Intern",
      companyName: "SkillCompass Test Company",
      location: "Remote",
      employmentType: "Internship",
      remote: true,
      url: "http://localhost:3000/test-job/backend-developer",
      description:
        "Test job used to validate the SkillCompass job matching engine.",
    },
    create: {
      source: "SKILLCOMPASS_TEST",
      externalJobId: "test-backend-developer-001",
      title: "Backend Developer Intern",
      companyName: "SkillCompass Test Company",
      location: "Remote",
      employmentType: "Internship",
      remote: true,
      url: "http://localhost:3000/test-job/backend-developer",
      description:
        "Test job used to validate the SkillCompass job matching engine.",
    },
  });

  await prisma.jobSkill.deleteMany({
    where: {
      jobId: job.id,
    },
  });

  await prisma.jobSkill.createMany({
    data: [
      {
        jobId: job.id,
        skillId: skillMap.get("c++-programming")!.id,
        requirementType: "REQUIRED",
        importance: 1.0,
      },
      {
        jobId: job.id,
        skillId: skillMap.get("javascript-programming")!.id,
        requirementType: "REQUIRED",
        importance: 0.9,
      },
      {
        jobId: job.id,
        skillId: skillMap.get("object-oriented-programming")!.id,
        requirementType: "REQUIRED",
        importance: 0.8,
      },
      {
        jobId: job.id,
        skillId: skillMap.get("python-programming")!.id,
        requirementType: "PREFERRED",
        importance: 0.4,
      },
      {
        jobId: job.id,
        skillId: skillMap.get("functional-programming")!.id,
        requirementType: "PREFERRED",
        importance: 0.3,
      },
    ],
  });

  console.log("Test job created:", job.id);

  const result = await prisma.job.findUnique({
    where: {
      id: job.id,
    },
    include: {
      skills: {
        include: {
          skill: true,
        },
      },
    },
  });

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