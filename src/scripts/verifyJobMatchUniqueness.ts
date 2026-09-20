import { prisma } from "../config/prisma.js";

const main = async () => {
  const grouped = await prisma.jobMatch.groupBy({
    by: ["userId", "jobId", "analysisRunId", "algorithmVersion"],
    _count: {
      _all: true,
    },
    where: {
      userId: "315c6202-c65b-44d4-a86c-86f469f14629",
      analysisRunId: "7d9eafd0-dd46-486f-9092-e1ac1a272825",
    },
  });

  console.table(
    grouped.map((row) => ({
      jobId: row.jobId,
      analysisRunId: row.analysisRunId,
      algorithmVersion: row.algorithmVersion,
      count: row._count._all,
    }))
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