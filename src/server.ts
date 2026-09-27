import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { redisConnection } from "./config/redis.js";
import { analysisWorker } from "./workers/analysis.worker.js";
import { seedJobProfiles } from "./scripts/seedJobProfiles.js";

let server: ReturnType<typeof app.listen> | undefined;

const startServer = async (): Promise<void> => {
  try {
    console.log(
      "[Startup] Initializing SkillCompass..."
    );

    /*
     * Seed the canonical job-profile catalog.
     *
     * The seed uses upserts, so running it during application
     * startup is safe and does not create duplicate profiles.
     */
    await seedJobProfiles();

    server = app.listen(env.PORT, () => {
      console.log(
        `SkillCompass API running on http://localhost:${env.PORT}`
      );

      console.log(
        "SkillCompass analysis worker running inside API process"
      );
    });
  } catch (error) {
    console.error(
      "[Startup] Failed to start SkillCompass:",
      error
    );

    await prisma.$disconnect();

    process.exit(1);
  }
};

const shutdown = async (
  signal: string
): Promise<void> => {
  console.log(
    `${signal} received. Shutting down gracefully...`
  );

  if (!server) {
    try {
      await analysisWorker.close();
      await redisConnection.quit();
      await prisma.$disconnect();
    } catch (error) {
      console.error(
        "Error while shutting down:",
        error
      );
    }

    process.exit(0);
  }

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

void startServer();