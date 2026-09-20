import { getJobSource, getJobSources, } from "../modules/jobs/jobSourceRegistry.js";
const main = () => {
    const sources = getJobSources();
    console.log("REGISTERED SOURCES:", sources.map((source) => source.name));
    const testSource = getJobSource("SKILLCOMPASS_TEST_SOURCE");
    console.log("FOUND TEST SOURCE:", testSource?.name ?? "NOT FOUND");
    const missingSource = getJobSource("DOES_NOT_EXIST");
    console.log("MISSING SOURCE:", missingSource ?? "NOT FOUND");
};
main();
