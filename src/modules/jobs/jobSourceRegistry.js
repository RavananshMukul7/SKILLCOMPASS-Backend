import { AdzunaJobSource } from "./adzunaJobSource.js";
import { TestJobSource } from "./testJobSource.js";
const sources = [
    new TestJobSource(),
    new AdzunaJobSource(),
];
export const getJobSources = () => {
    return sources;
};
export const getJobSource = (sourceName) => {
    return sources.find((source) => source.name === sourceName);
};
