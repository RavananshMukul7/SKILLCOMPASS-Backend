import { prisma } from "../config/prisma.js";

const TECH_TERMS = [
  "javascript",
  "typescript",
  "python",
  "java",
  "c++",
  "c#",
  "php",
  "laravel",
  "react",
  "angular",
  "vue",
  "node.js",
  "express",
  "spring",
  "django",
  "flask",
  "sql",
  "mysql",
  "postgresql",
  "mongodb",
  "aws",
  "azure",
  "gcp",
  "docker",
  "kubernetes",
  "git",
  "github",
  "graphql",
  "rest",
  "api",
  "machine learning",
  "artificial intelligence",
  "ai",
  "tensorflow",
  "pytorch",
  "embedded",
  "linux",
];

const main = async () => {
  const jobs = await prisma.job.findMany({
    where: {
      source: "ADZUNA",
      skills: {
        none: {},
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  for (const job of jobs) {
    const text = `${job.title}\n${job.description ?? ""}`;

    const matchedTerms = TECH_TERMS.filter((term) =>
      text.toLowerCase().includes(term.toLowerCase())
    );

    console.log("\n========================================");
    console.log("TITLE:", job.title);
    console.log("COMPANY:", job.companyName);
    console.log("DESCRIPTION LENGTH:", text.length);
    console.log(
      "TECH TERMS FOUND:",
      matchedTerms.length > 0
        ? matchedTerms.join(", ")
        : "NONE"
    );

    if (matchedTerms.length > 0) {
      for (const term of matchedTerms) {
        const index = text
          .toLowerCase()
          .indexOf(term.toLowerCase());

        const start = Math.max(0, index - 100);
        const end = Math.min(
          text.length,
          index + term.length + 150
        );

        console.log(
          `\n[${term}] ...${text.slice(start, end)}...`
        );
      }
    }

    console.log("========================================");
  }
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });