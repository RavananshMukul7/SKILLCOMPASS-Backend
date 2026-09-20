import "dotenv/config";
import { analysisQueue } from "./queues/analysis.queue.js";
const job = await analysisQueue.add("test-analysis", {
    repositoryId: "test-repository",
});
console.log("Created job:", job.id);
await analysisQueue.close();
