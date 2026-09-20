import { upsertJob } from "./jobIngestion.service.js";
import { extractJobSkills } from "./jobSkillExtraction.service.js";
export const runJobSource = async (source) => {
    const externalJobs = await source.fetchJobs();
    const results = [];
    for (const externalJob of externalJobs) {
        const skills = externalJob.skills && externalJob.skills.length > 0
            ? externalJob.skills
            : extractJobSkills(externalJob.title, externalJob.description);
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
