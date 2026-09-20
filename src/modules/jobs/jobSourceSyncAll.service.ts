import { getJobSources } from "./jobSourceRegistry.js";
import { runJobSource } from "./jobSourceRunner.service.js";

export const syncAllJobSources = async () => {
  const sources = getJobSources();

  const results = [];

  for (const source of sources) {
    const result = await runJobSource(source);

    results.push({
      source: result.source,
      jobsFetched: result.jobsFetched,
      jobsUpserted: result.jobsUpserted,
      jobs: result.jobs,
    });
  }

  return {
    sourcesProcessed: sources.length,
    results,
  };
};