import { Router } from "express";

import { prisma } from "../../config/prisma.js";

import { requireAuth } from "../../middleware/requireAuth.js";

import {
  calculateDetailedJobMatch,
  calculateJobMatch,
  matchAlgorithmVersion,
} from "./jobMatching.service.js";

export const matchingRouter = Router();

matchingRouter.post(
  "/jobs/:jobId/match",
  requireAuth,
  async (req, res, next) => {
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

      const job = await prisma.job.findUnique({
        where: {
          id: jobId,
        },
        select: {
          id: true,
          title: true,
          companyName: true,
          location: true,
          employmentType: true,
          remote: true,
          url: true,
        },
      });

      if (!job) {
        res.status(404).json({
          success: false,
          message: "Job not found",
        });
        return;
      }

      const result = await calculateJobMatch(userId, jobId);

      res.status(200).json({
        success: true,
        data: {
          job,
          match: result,
          algorithmVersion: matchAlgorithmVersion,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

matchingRouter.get(
  "/jobs/:jobId/match",
  requireAuth,
  async (req, res, next) => {
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

      const job = await prisma.job.findUnique({
        where: {
          id: jobId,
        },
        select: {
          id: true,
          title: true,
          companyName: true,
          location: true,
          employmentType: true,
          remote: true,
          url: true,
        },
      });

      if (!job) {
        res.status(404).json({
          success: false,
          message: "Job not found",
        });
        return;
      }

      const match = await calculateJobMatch(userId, jobId);

      res.status(200).json({
        success: true,
        data: {
          job,
          match,
          algorithmVersion: matchAlgorithmVersion,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

matchingRouter.get(
  "/jobs/:jobId/gaps",
  requireAuth,
  async (req, res, next) => {
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

      const job = await prisma.job.findUnique({
        where: {
          id: jobId,
        },
        select: {
          id: true,
        },
      });

      if (!job) {
        res.status(404).json({
          success: false,
          message: "Job not found",
        });
        return;
      }

      const result = await calculateDetailedJobMatch(
        userId,
        jobId,
      );

      res.status(200).json({
        success: true,
        data: result.gaps.map((gap) => ({
          skill: {
            id: gap.skillId,
            name: gap.skillName,
          },
          currentScore: gap.currentScore,
          requiredImportance: gap.importance,
          gapScore: gap.gapScore,
          priority: gap.priority,
        })),
        algorithmVersion: matchAlgorithmVersion,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Job not found."
      ) {
        res.status(404).json({
          success: false,
          message: "Job not found",
        });
        return;
      }

      next(error);
    }
  },
);