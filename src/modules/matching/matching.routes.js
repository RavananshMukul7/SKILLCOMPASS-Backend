import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { calculateJobMatch } from "./jobMatching.service.js";
export const matchingRouter = Router();
const matchRequestSchema = z.object({
    analysisRunId: z.string().uuid(),
});
matchingRouter.post("/jobs/:jobId/match", requireAuth, async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
            });
            return;
        }
        const { jobId } = req.params;
        if (typeof jobId !== "string") {
            res.status(400).json({
                success: false,
                message: "Invalid job ID",
            });
            return;
        }
        const parsedBody = matchRequestSchema.safeParse(req.body);
        if (!parsedBody.success) {
            res.status(400).json({
                success: false,
                message: "Invalid request body",
                errors: parsedBody.error.flatten(),
            });
            return;
        }
        const { analysisRunId } = parsedBody.data;
        const analysisRun = await prisma.analysisRun.findFirst({
            where: {
                id: analysisRunId,
                userId,
                status: "COMPLETED",
            },
            select: {
                id: true,
            },
        });
        if (!analysisRun) {
            res.status(404).json({
                success: false,
                message: "Completed analysis run not found",
            });
            return;
        }
        const job = await prisma.job.findUnique({
            where: {
                id: jobId,
            },
            select: {
                id: true,
                title: true,
                companyName: true,
            },
        });
        if (!job) {
            res.status(404).json({
                success: false,
                message: "Job not found",
            });
            return;
        }
        const result = await calculateJobMatch(userId, jobId, analysisRunId);
        res.status(200).json({
            success: true,
            data: {
                job,
                analysisRunId,
                match: result,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
matchingRouter.get("/jobs/:jobId/match", requireAuth, async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
            });
            return;
        }
        const { jobId } = req.params;
        if (typeof jobId !== "string") {
            res.status(400).json({
                success: false,
                message: "Invalid job ID",
            });
            return;
        }
        const analysisRunId = req.query.analysisRunId;
        if (typeof analysisRunId !== "string") {
            res.status(400).json({
                success: false,
                message: "analysisRunId query parameter is required",
            });
            return;
        }
        const match = await prisma.jobMatch.findUnique({
            where: {
                userId_jobId_analysisRunId_algorithmVersion: {
                    userId,
                    jobId,
                    analysisRunId,
                    algorithmVersion: "weighted-skill-v1",
                },
            },
            include: {
                job: {
                    select: {
                        id: true,
                        title: true,
                        companyName: true,
                        location: true,
                        employmentType: true,
                        remote: true,
                        url: true,
                    },
                },
            },
        });
        if (!match) {
            res.status(404).json({
                success: false,
                message: "Job match not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: {
                id: match.id,
                userId: match.userId,
                jobId: match.jobId,
                analysisRunId: match.analysisRunId,
                matchScore: Number(match.matchScore),
                skillCoverage: Number(match.skillCoverage),
                skillGapCount: match.skillGapCount,
                explanation: match.explanation,
                algorithmVersion: match.algorithmVersion,
                createdAt: match.createdAt,
                updatedAt: match.updatedAt,
                job: match.job,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
matchingRouter.get("/jobs/:jobId/gaps", requireAuth, async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
            });
            return;
        }
        const { jobId } = req.params;
        if (typeof jobId !== "string") {
            res.status(400).json({
                success: false,
                message: "Invalid job ID",
            });
            return;
        }
        const analysisRunId = req.query.analysisRunId;
        if (typeof analysisRunId !== "string") {
            res.status(400).json({
                success: false,
                message: "analysisRunId query parameter is required",
            });
            return;
        }
        const gaps = await prisma.skillGap.findMany({
            where: {
                userId,
                jobId,
                analysisRunId,
            },
            include: {
                skill: true,
            },
            orderBy: {
                priority: "desc",
            },
        });
        res.status(200).json({
            success: true,
            data: gaps.map((gap) => ({
                id: gap.id,
                skill: {
                    id: gap.skill.id,
                    name: gap.skill.name,
                    normalizedName: gap.skill.normalizedName,
                    category: gap.skill.category,
                },
                currentScore: Number(gap.currentScore),
                requiredImportance: Number(gap.requiredImportance),
                gapScore: Number(gap.gapScore),
                priority: Number(gap.priority),
                analysisRunId: gap.analysisRunId,
            })),
        });
    }
    catch (error) {
        next(error);
    }
});
