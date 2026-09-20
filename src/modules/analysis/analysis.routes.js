import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validate } from "../../middleware/validate.js";
import { analyzeRepositorySchema } from "./analysis.validation.js";
import { analyzeRepository } from "./analysis.controller.js";
import { getAnalysisResult } from "./analysisResult.service.js";
import { prisma } from "../../config/prisma.js";
const router = Router();
router.post("/repositories/:repositoryId/analyze", requireAuth, validate(analyzeRepositorySchema), analyzeRepository);
router.get("/latest", requireAuth, async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
            });
            return;
        }
        const latestRun = await prisma.analysisRun.findFirst({
            where: {
                userId,
                status: "COMPLETED",
            },
            orderBy: {
                completedAt: "desc",
            },
            select: {
                id: true,
                repositoryId: true,
                status: true,
                startedAt: true,
                completedAt: true,
                createdAt: true,
            },
        });
        if (!latestRun) {
            res.status(404).json({
                success: false,
                message: "No completed analysis found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: latestRun,
        });
    }
    catch (error) {
        next(error);
    }
});
router.get("/repositories/:repositoryId/runs", requireAuth, async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
            });
            return;
        }
        const { repositoryId } = req.params;
        if (typeof repositoryId !== "string") {
            res.status(400).json({
                success: false,
                message: "Invalid repository ID",
            });
            return;
        }
        const repository = await prisma.repository.findFirst({
            where: {
                id: repositoryId,
                githubAccount: {
                    userId,
                },
            },
            select: {
                id: true,
                name: true,
                fullName: true,
            },
        });
        if (!repository) {
            res.status(404).json({
                success: false,
                message: "Repository not found",
            });
            return;
        }
        const runs = await prisma.analysisRun.findMany({
            where: {
                repositoryId,
                userId,
            },
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                status: true,
                startedAt: true,
                completedAt: true,
                errorMessage: true,
                createdAt: true,
            },
        });
        res.status(200).json({
            success: true,
            data: {
                repository,
                runs,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
router.get("/runs/:analysisRunId/status", requireAuth, async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
            });
            return;
        }
        const { analysisRunId } = req.params;
        if (typeof analysisRunId !== "string") {
            res.status(400).json({
                success: false,
                message: "Invalid analysis run ID",
            });
            return;
        }
        const analysisRun = await prisma.analysisRun.findFirst({
            where: {
                id: analysisRunId,
                userId,
            },
            select: {
                id: true,
                repositoryId: true,
                status: true,
                startedAt: true,
                completedAt: true,
                errorMessage: true,
                createdAt: true,
            },
        });
        if (!analysisRun) {
            res.status(404).json({
                success: false,
                message: "Analysis run not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: analysisRun,
        });
    }
    catch (error) {
        next(error);
    }
});
router.get("/runs/:analysisRunId", requireAuth, async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
            });
            return;
        }
        const { analysisRunId } = req.params;
        if (typeof analysisRunId !== "string") {
            res.status(400).json({
                success: false,
                message: "Invalid analysis run ID",
            });
            return;
        }
        const result = await getAnalysisResult(userId, analysisRunId);
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
export default router;
