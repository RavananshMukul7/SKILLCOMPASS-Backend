import { describe, expect, it, vi, beforeEach, } from "vitest";
import { getHealthStatus } from "./health.service.js";
import { prisma } from "../../config/prisma.js";
describe("getHealthStatus", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });
    it("should return a healthy status when the database is available", async () => {
        vi.spyOn(prisma, "$queryRaw")
            .mockResolvedValue([]);
        const result = await getHealthStatus();
        expect(result.status).toBe("ok");
        expect(result.service).toBe("SkillCompass API");
        expect(result.database).toBe("connected");
        expect(result.timestamp).toEqual(expect.any(String));
    });
    it("should throw AppError with 503 when the database is unavailable", async () => {
        vi.spyOn(prisma, "$queryRaw")
            .mockRejectedValue(new Error("Database connection failed"));
        await expect(getHealthStatus()).rejects.toMatchObject({
            message: "Database unavailable",
            statusCode: 503,
        });
    });
});
