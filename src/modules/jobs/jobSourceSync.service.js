import { getJobSource, } from "./jobSourceRegistry.js";
import { runJobSource } from "./jobSourceRunner.service.js";
import { AppError } from "../../utils/AppError.js";
export const syncJobSource = async (sourceName) => {
    const source = getJobSource(sourceName);
    if (!source) {
        throw new AppError(`Job source not found: ${sourceName}`, 404);
    }
    return runJobSource(source);
};
