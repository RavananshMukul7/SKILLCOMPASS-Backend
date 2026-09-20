import { TestJobSource } from "../modules/jobs/testJobSource.js";
const main = async () => {
    const source = new TestJobSource();
    console.log("SOURCE:", source.name);
    const jobs = await source.fetchJobs();
    console.dir(jobs, { depth: null });
};
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
