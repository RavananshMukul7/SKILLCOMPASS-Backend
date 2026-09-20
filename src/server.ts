import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { redisConnection } from "./config/redis.js";
import { analysisWorker } from "./workers/analysis.worker.js";

const server = app.listen(env.PORT, () => {
  console.log(
    `SkillCompass API running on http://localhost:${env.PORT}`
  );

  console.log(
    "SkillCompass analysis worker running inside API process"
  );
});

const shutdown = async (
  signal: string
): Promise<void> => {
  console.log(
    `${signal} received. Shutting down gracefully...`
  );

  server.close(async () => {
    try {
      await analysisWorker.close();

      await redisConnection.quit();

      await prisma.$disconnect();

      console.log(
        "Analysis worker stopped."
      );

      console.log(
        "Redis connection closed."
      );

      console.log(
        "Database connection closed."
      );

      console.log(
        "Server shut down successfully."
      );

      process.exit(0);
    } catch (error) {
      console.error(
        "Error while shutting down:",
        error
      );

      process.exit(1);
    }
  });
};

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});