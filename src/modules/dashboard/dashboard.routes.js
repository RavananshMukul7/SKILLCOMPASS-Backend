import { Router } from "express";
import { prisma } from "../../config/prisma.js";
import { requireAuth } from "../../middleware/requireAuth.js";
export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);
dashboardRouter.get("/summary", async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
            });
            return;
        }
        const [user, repositories, skills, recentRuns] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    displayName: true,
                },
            }),
            prisma.repository.findMany({
                where: {
                    githubAccount: {
                        userId,
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
            }),
            prisma.userSkill.findMany({
                where: { userId },
                orderBy: {
                    currentScore: "desc",
                },
                include: {
                    skill: true,
                },
            }),
            prisma.analysisRun.findMany({
                where: { userId },
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
            }),
        ]);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: {
                user,
                repositories,
                skills,
                recentRuns,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
