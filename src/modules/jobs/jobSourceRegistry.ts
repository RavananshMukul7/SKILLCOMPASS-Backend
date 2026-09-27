import type { JobSource } from "./jobSource.types.js";

import { AdzunaJobSource } from "./adzunaJobSource.js";

import { TestJobSource } from "./testJobSource.js";

const productionSources: JobSource[] = [
  new AdzunaJobSource(),
];

const testSource: JobSource = new TestJobSource();

const shouldIncludeTestSource = (): boolean => {
  return (
    process.env.NODE_ENV === "test" ||
    process.env.INCLUDE_TEST_JOB_SOURCE === "true"
  );
};

export const getJobSources = (): JobSource[] => {
  if (shouldIncludeTestSource()) {
    return [testSource, ...productionSources];
  }

  return [...productionSources];
};

export const getJobSource = (
  sourceName: string,
): JobSource | undefined => {
  return getJobSources().find(
    (source) => source.name === sourceName,
  );
};
