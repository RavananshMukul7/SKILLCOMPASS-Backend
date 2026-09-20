import type { JobSource } from "./jobSource.types.js";
import { AdzunaJobSource } from "./adzunaJobSource.js";
import { TestJobSource } from "./testJobSource.js";

const sources: JobSource[] = [
  new TestJobSource(),
  new AdzunaJobSource(),
];

export const getJobSources = (): JobSource[] => {
  return sources;
};

export const getJobSource = (
  sourceName: string
): JobSource | undefined => {
  return sources.find(
    (source) => source.name === sourceName
  );
};