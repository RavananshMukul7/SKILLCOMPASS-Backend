import app from "./app.js";

import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";

const server = app.listen(env.PORT, () => {
  console.log(
    `SkillCompass API running on http://localhost:${env.PORT}`
  );
});

const shutdown = async (signal: string) => {
  console.log(`${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    try {
      await prisma.$disconnect();

      console.log("Database connection closed.");
      console.log("Server shut down successfully.");

      process.exit(0);
    } catch (error) {
      console.error(
        "Error while closing database connection:",
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