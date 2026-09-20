import { prisma } from "../config/prisma.js";

const USER_ID = "315c6202-c65b-44d4-a86c-86f469f14629";
const ANALYSIS_RUN_ID =
  "34c19e97-3218-4e7c-960d-11d531ea29a6";
const ALGORITHM_VERSION = "weighted-skill-v1";

const main = async () => {
  const rows = await prisma.jobMatch.groupBy({
    by: ["jobId"],
    where: {
      userId: USER_ID,
      analysisRunId: ANALYSIS_RUN_ID,
      algorithmVersion: ALGORITHM_VERSION,
    },
    _count: {
      _all: true,
    },
  });

  console.log(
    "TOTAL JOBMATCH ROWS:",
    rows.reduce(
      (sum, row) => sum + row._count._all,
      0
    )
  );

  console.log("DISTINCT JOBS:", rows.length);

  console.log(
    "DUPLICATES:",
    rows.filter((row) => row._count._all > 1)
  );

  await prisma.$disconnect();
};

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
