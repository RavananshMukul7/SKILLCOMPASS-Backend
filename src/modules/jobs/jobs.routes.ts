import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { calculateJobMatch } from "../matching/jobMatching.service.js";

export const jobsRouter = Router();

const jobsQuerySchema = z.object({
  search: z.string().trim().optional(),
  remote: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/* =========================================================
   POST /api/jobs/sources/:sourceName/sync
   ========================================================= */

jobsRouter.post(
  "/sources/:sourceName/sync",
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

      const { sourceName } = req.params;

      if (typeof sourceName !== "string") {
        res.status(400).json({
          success: false,
          message: "Invalid source name",
        });
        return;
      }

      const { syncJobSource } = await import("./jobSourceSync.service.js");

      const result = await syncJobSource(sourceName);

      res.status(200).json({
        success: true,
        data: {
          source: result.source,
          jobsFetched: result.jobsFetched,
          jobsUpserted: result.jobsUpserted,
          jobs: result.jobs.map((job) => ({
            id: job.id,
            title: job.title,
            companyName: job.companyName,
            source: job.source,
            externalJobId: job.externalJobId,
            skillCount: job.skills.length,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   POST /api/jobs/sources/sync-all
   ========================================================= */

jobsRouter.post("/sources/sync-all", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { syncAllJobSources } = await import("./jobSourceSyncAll.service.js");

    const result = await syncAllJobSources();

    res.status(200).json({
      success: true,
      data: {
        sourcesProcessed: result.sourcesProcessed,
        results: result.results.map((source) => ({
          source: source.source,
          jobsFetched: source.jobsFetched,
          jobsUpserted: source.jobsUpserted,
          jobs: source.jobs.map((job) => ({
            id: job.id,
            title: job.title,
            companyName: job.companyName,
            source: job.source,
            externalJobId: job.externalJobId,
            skillCount: job.skills.length,
          })),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   GET /api/jobs/recommended
   ========================================================= */

jobsRouter.get("/recommended", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
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

    const minScoreParam = req.query.minScore;

    const minScore =
      typeof minScoreParam === "string" ? Number(minScoreParam) : 0;

    if (!Number.isFinite(minScore) || minScore < 0 || minScore > 100) {
      res.status(400).json({
        success: false,
        message: "minScore must be a number between 0 and 100",
      });
      return;
    }

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

    const matches = await prisma.jobMatch.findMany({
      where: {
        userId,
        analysisRunId,
        algorithmVersion: "weighted-skill-v1",
        matchScore: {
          gte: minScore,
        },
      },
      orderBy: {
        matchScore: "desc",
      },
      take: 20,
      include: {
        job: {
          select: {
            id: true,
            source: true,
            externalJobId: true,
            title: true,
            companyName: true,
            location: true,
            employmentType: true,
            remote: true,
            url: true,
            description: true,
            postedAt: true,
            expiresAt: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: matches.map((match) => ({
        id: match.id,
        analysisRunId,
        matchScore: Number(match.matchScore),
        skillCoverage: Number(match.skillCoverage),
        skillGapCount: match.skillGapCount,
        explanation: match.explanation,
        algorithmVersion: match.algorithmVersion,
        updatedAt: match.updatedAt,
        job: match.job,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   POST /api/jobs/recommended/generate
   ========================================================= */

jobsRouter.post(
  "/recommended/generate",
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

      const analysisRunId = req.body?.analysisRunId;

      if (
        typeof analysisRunId !== "string" ||
        !/^[0-9a-fA-F-]{36}$/.test(analysisRunId)
      ) {
        res.status(400).json({
          success: false,
          message: "A valid analysisRunId is required",
        });
        return;
      }

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

      const jobs = await prisma.job.findMany({
        where: {
          skills: {
            some: {},
          },
        },
        select: {
          id: true,
        },
      });

      const generatedMatches = [];

      for (const job of jobs) {
        await calculateJobMatch(userId, job.id, analysisRunId);

        const savedMatch = await prisma.jobMatch.findUnique({
          where: {
            userId_jobId_analysisRunId_algorithmVersion: {
              userId,
              jobId: job.id,
              analysisRunId,
              algorithmVersion: "weighted-skill-v1",
            },
          },
          select: {
            jobId: true,
            analysisRunId: true,
            matchScore: true,
            skillCoverage: true,
            skillGapCount: true,
            explanation: true,
            algorithmVersion: true,
            updatedAt: true,
          },
        });

        if (savedMatch) {
          generatedMatches.push({
            jobId: savedMatch.jobId,
            analysisRunId: savedMatch.analysisRunId,
            matchScore: Number(savedMatch.matchScore),
            skillCoverage: Number(savedMatch.skillCoverage),
            skillGapCount: savedMatch.skillGapCount,
            explanation: savedMatch.explanation,
            algorithmVersion: savedMatch.algorithmVersion,
            updatedAt: savedMatch.updatedAt,
          });
        }
      }

      generatedMatches.sort((a, b) => b.matchScore - a.matchScore);

      res.status(200).json({
        success: true,
        data: {
          analysisRunId,
          jobsEvaluated: jobs.length,
          matchesGenerated: generatedMatches.length,
          recommendations: generatedMatches,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   GET /api/jobs/:jobId
   ========================================================= */

jobsRouter.get("/:jobId", requireAuth, async (req, res, next) => {
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

    const job = await prisma.job.findUnique({
      where: {
        id: jobId,
      },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!job) {
      res.status(404).json({
        success: false,
        message: "Job not found",
      });
      return;
    }

    const match = await prisma.jobMatch.findFirst({
      where: {
        userId,
        jobId,
        algorithmVersion: "weighted-skill-v1",
        ...(typeof analysisRunId === "string" ? { analysisRunId } : {}),
      },
    });

    const gaps =
      typeof analysisRunId === "string"
        ? await prisma.skillGap.findMany({
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
          })
        : [];

    res.status(200).json({
      success: true,
      data: {
        job: {
          id: job.id,
          source: job.source,
          externalJobId: job.externalJobId,
          title: job.title,
          companyName: job.companyName,
          location: job.location,
          employmentType: job.employmentType,
          remote: job.remote,
          url: job.url,
          description: job.description,
          postedAt: job.postedAt,
          expiresAt: job.expiresAt,
        },

        skills: job.skills.map((jobSkill) => ({
          skillId: jobSkill.skillId,
          name: jobSkill.skill.name,
          normalizedName: jobSkill.skill.normalizedName,
          category: jobSkill.skill.category,
          requirementType: jobSkill.requirementType,
          importance: Number(jobSkill.importance),
        })),

        match: match
          ? {
              id: match.id,
              matchScore: Number(match.matchScore),
              skillCoverage: Number(match.skillCoverage),
              skillGapCount: match.skillGapCount,
              explanation: match.explanation,
              algorithmVersion: match.algorithmVersion,
              analysisRunId: match.analysisRunId,
            }
          : null,

        gaps: gaps.map((gap) => ({
          id: gap.id,
          skillId: gap.skillId,
          skillName: gap.skill.name,
          currentScore: Number(gap.currentScore),
          requiredImportance: Number(gap.requiredImportance),
          gapScore: Number(gap.gapScore),
          priority: Number(gap.priority),
          analysisRunId: gap.analysisRunId,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   GET /api/jobs
   ========================================================= */

jobsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const parsedQuery = jobsQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: parsedQuery.error.flatten(),
      });
      return;
    }

    const { search, remote, limit } = parsedQuery.data;

    const jobs = await prisma.job.findMany({
      where: {
        ...(search
          ? {
              OR: [
                {
                  title: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  companyName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
        ...(remote !== undefined ? { remote } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
        matches: {
          where: {
            userId,
            algorithmVersion: "weighted-skill-v1",
          },
          select: {
            matchScore: true,
            skillCoverage: true,
            skillGapCount: true,
            algorithmVersion: true,
            analysisRunId: true,
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 1,
        },
      },
    });

    res.status(200).json({
      success: true,
      data: jobs.map((job) => ({
        id: job.id,
        source: job.source,
        externalJobId: job.externalJobId,
        title: job.title,
        companyName: job.companyName,
        location: job.location,
        employmentType: job.employmentType,
        remote: job.remote,
        url: job.url,
        description: job.description,
        postedAt: job.postedAt,
        expiresAt: job.expiresAt,

        skills: job.skills.map((jobSkill) => ({
          skillId: jobSkill.skillId,
          name: jobSkill.skill.name,
          category: jobSkill.skill.category,
          requirementType: jobSkill.requirementType,
          importance: Number(jobSkill.importance),
        })),

        match: job.matches[0]
          ? {
              matchScore: Number(job.matches[0].matchScore),
              skillCoverage: Number(job.matches[0].skillCoverage),
              skillGapCount: job.matches[0].skillGapCount,
              algorithmVersion: job.matches[0].algorithmVersion,
              analysisRunId: job.matches[0].analysisRunId,
            }
          : null,
      })),
    });
  } catch (error) {
    next(error);
  }
});
