import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import {
  calculateDetailedJobMatch,
  calculateJobRecommendations,
  matchAlgorithmVersion,
} from "../matching/jobMatching.service.js";

export const jobsRouter = Router();

const jobsQuerySchema = z.object({
  search: z.string().trim().optional(),
  remote: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const recommendationFilterSchema = z
  .object({
    jobProfileId: z.string().uuid().optional(),
    jobProfileSlug: z.string().trim().min(1).optional(),
    minScore: z.coerce.number().min(0).max(100).default(0),
  })
  .refine(
    (value) => Boolean(value.jobProfileId) !== Boolean(value.jobProfileSlug),
    {
      message: "Exactly one of jobProfileId or jobProfileSlug is required",
      path: ["jobProfileId"],
    },
  );

const resolveActiveJobProfile = async (input: {
  jobProfileId?: string;
  jobProfileSlug?: string;
}) => {
  if (input.jobProfileId) {
    return prisma.jobProfile.findFirst({
      where: {
        id: input.jobProfileId,
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        domain: true,
      },
    });
  }

  if (input.jobProfileSlug) {
    return prisma.jobProfile.findFirst({
      where: {
        slug: input.jobProfileSlug,
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        domain: true,
      },
    });
  }

  return null;
};

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

    const parsedRecommendationFilter =
      recommendationFilterSchema.safeParse({
        jobProfileId: req.query.jobProfileId,
        jobProfileSlug: req.query.jobProfileSlug,
        minScore: req.query.minScore,
      });

    if (!parsedRecommendationFilter.success) {
      res.status(400).json({
        success: false,
        message: "Exactly one job profile selector is required",
        errors: parsedRecommendationFilter.error.flatten(),
      });
      return;
    }

    const {
      jobProfileId,
      jobProfileSlug,
      minScore,
    } = parsedRecommendationFilter.data;

    const jobProfile = await resolveActiveJobProfile({
      jobProfileId,
      jobProfileSlug,
    });

    if (!jobProfile) {
      res.status(404).json({
        success: false,
        message: "Active job profile not found",
      });
      return;
    }

    /*
     * Job Recommendations are calculated live from the user's
     * current persisted UserSkill profile.
     *
     * AnalysisRun is historical provenance only and is not used
     * to generate or filter current recommendations.
     */
    const jobs = await prisma.job.findMany({
      where: {
        skills: {
          some: {},
        },
        jobProfiles: {
          some: {
            jobProfileId: jobProfile.id,
          },
        },
      },
      select: {
        id: true,
      },
    });

    const calculatedRecommendations = (
      await calculateJobRecommendations(
        userId,
        jobs.map((job) => job.id),
      )
    )
      .filter(
        (recommendation) => recommendation.matchScore >= minScore,
      )
      .slice(0, 20);

    const recommendedJobIds = calculatedRecommendations.map(
      (recommendation) => recommendation.jobId,
    );

    const recommendedJobs =
      recommendedJobIds.length > 0
        ? await prisma.job.findMany({
            where: {
              id: {
                in: recommendedJobIds,
              },
            },
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
          })
        : [];

    const jobById = new Map(
      recommendedJobs.map((job) => [job.id, job]),
    );

    res.status(200).json({
      success: true,
      data: {
        jobProfile: {
          id: jobProfile.id,
          slug: jobProfile.slug,
          title: jobProfile.title,
          domain: jobProfile.domain,
        },
        jobsEvaluated: jobs.length,
        matchesGenerated: calculatedRecommendations.length,
        recommendations: calculatedRecommendations.map(
          (recommendation) => ({
            jobId: recommendation.jobId,
            matchScore: recommendation.matchScore,
            skillCoverage: recommendation.skillCoverage,
            skillGapCount: recommendation.skillGapCount,
            explanation: recommendation.explanation,
            gaps: recommendation.gaps,
            job: jobById.get(recommendation.jobId) ?? null,
          }),
        ),
      },
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

      const parsedRecommendationFilter =
        recommendationFilterSchema.safeParse({
          jobProfileId: req.body?.jobProfileId,
          jobProfileSlug: req.body?.jobProfileSlug,
          minScore: req.body?.minScore ?? 0,
        });

      if (!parsedRecommendationFilter.success) {
        res.status(400).json({
          success: false,
          message: "Exactly one job profile selector is required",
          errors: parsedRecommendationFilter.error.flatten(),
        });
        return;
      }

      const {
        jobProfileId,
        jobProfileSlug,
        minScore,
      } = parsedRecommendationFilter.data;

      const jobProfile = await resolveActiveJobProfile({
        jobProfileId,
        jobProfileSlug,
      });

      if (!jobProfile) {
        res.status(404).json({
          success: false,
          message: "Active job profile not found",
        });
        return;
      }

      /*
       * Generate also uses the current persisted UserSkill profile.
       * No AnalysisRun or recommendation identifier is required.
       */
      const jobs = await prisma.job.findMany({
        where: {
          skills: {
            some: {},
          },
          jobProfiles: {
            some: {
              jobProfileId: jobProfile.id,
            },
          },
        },
        select: {
          id: true,
        },
      });

      const generatedRecommendations = (
        await calculateJobRecommendations(
          userId,
          jobs.map((job) => job.id),
        )
      )
        .filter(
          (recommendation) => recommendation.matchScore >= minScore,
        )
        .slice(0, 20);

      const recommendedJobIds = generatedRecommendations.map(
        (recommendation) => recommendation.jobId,
      );

      const recommendedJobs =
        recommendedJobIds.length > 0
          ? await prisma.job.findMany({
              where: {
                id: {
                  in: recommendedJobIds,
                },
              },
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
            })
          : [];

      const jobById = new Map(
        recommendedJobs.map((job) => [job.id, job]),
      );

      res.status(200).json({
        success: true,
        data: {
          jobProfile: {
            id: jobProfile.id,
            slug: jobProfile.slug,
            title: jobProfile.title,
            domain: jobProfile.domain,
          },
          jobsEvaluated: jobs.length,
          matchesGenerated: generatedRecommendations.length,
          recommendations: generatedRecommendations.map(
            (recommendation) => ({
              jobId: recommendation.jobId,
              matchScore: recommendation.matchScore,
              skillCoverage: recommendation.skillCoverage,
              skillGapCount: recommendation.skillGapCount,
              explanation: recommendation.explanation,
              gaps: recommendation.gaps,
              job: jobById.get(recommendation.jobId) ?? null,
            }),
          ),
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

    let liveMatch: Awaited<
      ReturnType<typeof calculateDetailedJobMatch>
    > | null = null;

    if (job.skills.length > 0) {
      liveMatch = await calculateDetailedJobMatch(
        userId,
        jobId,
      );
    }

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

        match: liveMatch
          ? {
              matchScore: liveMatch.matchScore,
              skillCoverage: liveMatch.skillCoverage,
              skillGapCount: liveMatch.skillGapCount,
              explanation: liveMatch.explanation,
              algorithmVersion: matchAlgorithmVersion,
            }
          : null,

        gaps:
          liveMatch?.gaps.map((gap) => ({
            id: `${job.id}-${gap.skillId}`,
            skillId: gap.skillId,
            skillName: gap.skillName,
            currentScore: gap.currentScore,
            requiredImportance: gap.importance,
            gapScore: gap.gapScore,
            priority: gap.priority,
          })) ?? [],
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
      },
    });

    const liveMatches = await calculateJobRecommendations(
      userId,
      jobs.map((job) => job.id),
    );

    const liveMatchByJobId = new Map(
      liveMatches.map((match) => [match.jobId, match]),
    );

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

        match: liveMatchByJobId.has(job.id)
          ? {
              matchScore: Number(
                liveMatchByJobId.get(job.id)?.matchScore ?? 0,
              ),
              skillCoverage: Number(
                liveMatchByJobId.get(job.id)?.skillCoverage ?? 0,
              ),
              skillGapCount:
                liveMatchByJobId.get(job.id)?.skillGapCount ?? 0,
              algorithmVersion: matchAlgorithmVersion,
            }
          : null,
      })),
    });
  } catch (error) {
    next(error);
  }
});