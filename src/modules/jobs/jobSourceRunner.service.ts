import type { JobSource } from "./jobSource.types.js";

import { upsertJob } from "./jobIngestion.service.js";

import { extractJobSkills } from "./jobSkillExtraction.service.js";

export const runJobSource = async (source: JobSource) => {
  const externalJobs = await source.fetchJobs();

  const results = [];

  for (const externalJob of externalJobs) {
    const extractedSkills = extractJobSkills(
      externalJob.title,
      externalJob.description,
    );

    const sourceSkills = externalJob.skills ?? [];

    const skillsByNormalizedName = new Map(
      sourceSkills.map((skill) => [skill.normalizedName, skill]),
    );

    for (const skill of extractedSkills) {
      if (!skillsByNormalizedName.has(skill.normalizedName)) {
        skillsByNormalizedName.set(skill.normalizedName, skill);
      }
    }

    const skills = Array.from(skillsByNormalizedName.values());

    const job = await upsertJob({
      source: source.name,
      externalJobId: externalJob.externalJobId,
      title: externalJob.title,
      companyName: externalJob.companyName,
      location: externalJob.location,
      employmentType: externalJob.employmentType,
      remote: externalJob.remote,
      url: externalJob.url,
      description: externalJob.description,
      postedAt: externalJob.postedAt,
      expiresAt: externalJob.expiresAt,
      skills,
    });

    results.push(job);
  }

  return {
    source: source.name,
    jobsFetched: externalJobs.length,
    jobsUpserted: results.length,
    jobs: results,
  };
};
