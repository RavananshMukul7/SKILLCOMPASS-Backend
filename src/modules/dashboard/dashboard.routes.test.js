import { afterAll, beforeEach, describe, expect, it, vi, } from "vitest";
import express from "express";
import { prisma } from "../../config/prisma.js";
import { dashboardRouter } from "./dashboard.routes.js";
vi.mock("../../middleware/requireAuth.js", () => ({
    requireAuth: (req, _res, next) => {
        req.user = {
            id: "user-1",
            email: "test@example.com",
            displayName: "Test User",
        };
        next();
    },
}));
describe("dashboardRouter", () => {
    const app = express();
    let server;
    let baseUrl;
    beforeEach(async () => {
        vi.restoreAllMocks();
        if (!server) {
            app.use(express.json());
            app.use("/api/dashboard", dashboardRouter);
            app.use((error, _req, res, _next) => {
                console.error(error);
                res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            });
            server = app.listen(0);
            await new Promise((resolve) => {
                server.once("listening", () => resolve());
            });
            const address = server.address();
            if (!address ||
                typeof address === "string") {
                throw new Error("Unable to determine test server address");
            }
            baseUrl = `http://127.0.0.1:${address.port}`;
        }
    });
    afterAll(async () => {
        if (server) {
            await new Promise((resolve, reject) => {
                server.close((error) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve();
                });
            });
        }
    });
    describe("GET /summary", () => {
        it("should return the dashboard summary for an authenticated user", async () => {
            const user = {
                id: "user-1",
                email: "test@example.com",
                displayName: "Test User",
            };
            const repositories = [
                {
                    id: "repo-1",
                    name: "skillcompass",
                    fullName: "testuser/skillcompass",
                    ownerLogin: "testuser",
                    defaultBranch: "main",
                    htmlUrl: "https://github.com/testuser/skillcompass",
                    updatedAt: new Date(),
                },
            ];
            const skills = [
                {
                    id: "user-skill-1",
                    userId: "user-1",
                    skillId: "skill-1",
                    currentScore: 85,
                    skill: {
                        id: "skill-1",
                        name: "TypeScript",
                    },
                },
            ];
            const recentRuns = [
                {
                    id: "run-1",
                    repositoryId: "repo-1",
                    status: "COMPLETED",
                    startedAt: new Date(),
                    completedAt: new Date(),
                    createdAt: new Date(),
                },
            ];
            vi.spyOn(prisma.user, "findUnique").mockResolvedValue(user);
            vi.spyOn(prisma.repository, "findMany").mockResolvedValue(repositories);
            vi.spyOn(prisma.userSkill, "findMany").mockResolvedValue(skills);
            vi.spyOn(prisma.analysisRun, "findMany").mockResolvedValue(recentRuns);
            const response = await fetch(`${baseUrl}/api/dashboard/summary`);
            const body = await response.json();
            expect(response.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.user).toEqual(user);
            expect(body.data.repositories).toEqual(repositories.map((repository) => ({
                ...repository,
                updatedAt: repository.updatedAt.toISOString(),
            })));
            expect(body.data.skills).toEqual(skills);
            expect(body.data.recentRuns).toEqual(recentRuns.map((run) => ({
                ...run,
                startedAt: run.startedAt.toISOString(),
                completedAt: run.completedAt.toISOString(),
                createdAt: run.createdAt.toISOString(),
            })));
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: {
                    id: "user-1",
                },
                select: {
                    id: true,
                    email: true,
                    displayName: true,
                },
            });
            expect(prisma.repository.findMany).toHaveBeenCalledWith({
                where: {
                    githubAccount: {
                        userId: "user-1",
                    },
                },
                orderBy: {
                    updatedAt: "desc",
                },
                select: {
                    id: true,
                    name: true,
                    fullName: true,
                    ownerLogin: true,
                    defaultBranch: true,
                    htmlUrl: true,
                    updatedAt: true,
                },
            });
            expect(prisma.userSkill.findMany).toHaveBeenCalledWith({
                where: {
                    userId: "user-1",
                },
                orderBy: {
                    currentScore: "desc",
                },
                include: {
                    skill: true,
                },
            });
            expect(prisma.analysisRun.findMany).toHaveBeenCalledWith({
                where: {
                    userId: "user-1",
                },
                orderBy: {
                    createdAt: "desc",
                },
                take: 5,
                select: {
                    id: true,
                    repositoryId: true,
                    status: true,
                    startedAt: true,
                    completedAt: true,
                    createdAt: true,
                },
            });
        });
        it("should return 404 when the authenticated user does not exist", async () => {
            vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);
            vi.spyOn(prisma.repository, "findMany").mockResolvedValue([]);
            vi.spyOn(prisma.userSkill, "findMany").mockResolvedValue([]);
            vi.spyOn(prisma.analysisRun, "findMany").mockResolvedValue([]);
            const response = await fetch(`${baseUrl}/api/dashboard/summary`);
            const body = await response.json();
            expect(response.status).toBe(404);
            expect(body).toEqual({
                success: false,
                message: "User not found",
            });
        });
        it("should return 500 when a database query fails", async () => {
            vi.spyOn(prisma.user, "findUnique").mockRejectedValue(new Error("Database failure"));
            vi.spyOn(prisma.repository, "findMany").mockResolvedValue([]);
            vi.spyOn(prisma.userSkill, "findMany").mockResolvedValue([]);
            vi.spyOn(prisma.analysisRun, "findMany").mockResolvedValue([]);
            const response = await fetch(`${baseUrl}/api/dashboard/summary`);
            const body = await response.json();
            expect(response.status).toBe(500);
            expect(body).toEqual({
                success: false,
                message: "Internal server error",
            });
        });
    });
});
