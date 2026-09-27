import { prisma } from "../config/prisma.js";
import { calculateJobMatch } from "../modules/matching/jobMatching.service.js";

const main = async () => {
  const userId = "315c6202-c65b-44d4-a86c-86f469f14629";
  const jobId = "8483e4aa-074f-49f7-a33b-68aa54b97960";

  const result = await calculateJobMatch(userId, jobId);

  console.log("JOB MATCH RESULT:");
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
