import { prisma } from "../config/prisma.js";

const main = async () => {
  const updated = await prisma.$executeRawUnsafe(`
    UPDATE "JobMatch" jm
    SET "analysisRunId" = (
      SELECT ar.id
      FROM "AnalysisRun" ar
      WHERE ar."userId" = jm."userId"
        AND ar.status = 'COMPLETED'
      ORDER BY ar."completedAt" DESC NULLS LAST,
               ar."createdAt" DESC
      LIMIT 1
    )
    WHERE jm."analysisRunId" IS NULL;
  `);

  const remaining = await prisma.$queryRawUnsafe<
    Array<{ count: bigint }>
  >(
    `SELECT COUNT(*)::bigint AS count
     FROM "JobMatch"
     WHERE "analysisRunId" IS NULL;`
  );

  console.log("JobMatch rows updated:", updated);
  console.log("Remaining NULL analysisRunId:", String(remaining[0]?.count ?? 0));
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });