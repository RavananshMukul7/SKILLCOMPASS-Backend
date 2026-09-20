import { analysisWorker } from "./workers/analysis.worker.js";
import { redisConnection } from "./config/redis.js";
import { prisma } from "./config/prisma.js";

console.log(
  "SkillCompass analysis worker started"
);

let shuttingDown = false;

const shutdown = async (
  signal: string
): Promise<void> => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  console.log(
    `${signal} received. Shutting down analysis worker...`
  );

  try {
    await analysisWorker.close();

    await redisConnection.quit();

    await prisma.$disconnect();

    console.log(
      "Analysis worker shut down successfully."
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "Error while shutting down analysis worker:",
      error
    );

    process.exit(1);
  }
};

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});