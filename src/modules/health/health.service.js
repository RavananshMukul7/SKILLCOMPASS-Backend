import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
export const getHealthStatus = async () => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        return {
            status: "ok",
            service: "SkillCompass API",
            database: "connected",
            timestamp: new Date().toISOString(),
        };
    }
    catch (error) {
        throw new AppError("Database unavailable", 503);
    }
};
