import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export const analysisQueue = new Queue(
  "repository-analysis",
  {
    connection: redisConnection,
  }
);