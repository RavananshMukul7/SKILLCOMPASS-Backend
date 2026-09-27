import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import { z } from "zod";

import { prisma } from "../../config/prisma.js";

import { requireAuth } from "../../middleware/requireAuth.js";

export const jobProfilesRouter = Router();

const jobProfilesQuerySchema = z.object({
  search: z.string().trim().optional(),
  domain: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(200),
});

const jobProfileSlugSchema = z.object({
  slug: z.string().trim().min(1),
});

/*
 * ============================================================
 * GET /api/job-profiles
 *
 * Returns the active Job Profile catalog.
 * Job Profiles describe career directions and role-level skill
 * requirements. They are intentionally separate from the
 * actual Job / JobMatch system.
 * ============================================================
 */

jobProfilesRouter.get(
  "/",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedQuery = jobProfilesQuerySchema.safeParse(req.query);

      if (!parsedQuery.success) {
        res.status(400).json({
          success: false,
          message: "Invalid job profile query",
          errors: parsedQuery.error.flatten(),
        });
        return;
      }

      const { search, domain, limit } = parsedQuery.data;

      const profiles = await prisma.jobProfile.findMany({
        where: {
          isActive: true,
          ...(domain
            ? {
                domain: {
                  equals: domain,
                  mode: "insensitive",
                },
              }
            : {}),
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
                    slug: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                  {
                    domain: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                ],
              }
            : {}),
        },
        include: {
          skills: {
            include: {
              skill: true,
            },
            orderBy: {
              importance: "desc",
            },
          },
        },
        orderBy: [
          {
            domain: "asc",
          },
          {
            title: "asc",
          },
        ],
        take: limit,
      });

      res.status(200).json({
        success: true,
        data: {
          profiles: profiles.map((profile) => ({
            id: profile.id,
            slug: profile.slug,
            title: profile.title,
            domain: profile.domain,
            description: profile.description,
            responsibilities: profile.responsibilities,
            aliases: profile.aliases,
            source: profile.source,
            isActive: profile.isActive,
            skills: profile.skills.map((profileSkill) => ({
              id: profileSkill.id,
              skillId: profileSkill.skillId,
              name: profileSkill.skill.name,
              normalizedName: profileSkill.skill.normalizedName,
              category: profileSkill.skill.category,
              description: profileSkill.skill.description,
              requiredLevel: Number(profileSkill.requiredLevel),
              importance: Number(profileSkill.importance),
              requirementType: profileSkill.requirementType,
              aliases: profileSkill.aliases,
            })),
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/*
 * ============================================================
 * GET /api/job-profiles/current-skills
 *
 * Returns the authenticated user's current cumulative skill
 * profile from UserSkill.
 *
 * IMPORTANT:
 * - This endpoint does NOT depend on AnalysisRun.
 * - currentScore is the persisted current proficiency score.
 * - confidence is the persisted current confidence value.
 * - AnalysisRun remains historical/provenance data.
 * ============================================================
 */

jobProfilesRouter.get(
  "/current-skills",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const userSkills = await prisma.userSkill.findMany({
        where: {
          userId,
        },
        orderBy: [
          {
            currentScore: "desc",
          },
          {
            lastEvaluatedAt: "desc",
          },
        ],
        include: {
          skill: true,
        },
      });

      res.status(200).json({
        success: true,
        data: {
          skills: userSkills.map((userSkill) => ({
            id: userSkill.id,
            skillId: userSkill.skillId,
            name: userSkill.skill.name,
            normalizedName: userSkill.skill.normalizedName,
            category: userSkill.skill.category,
            description: userSkill.skill.description,
            score: Number(userSkill.currentScore),
            currentScore: Number(userSkill.currentScore),
            confidence: Number(userSkill.confidence),
            firstDetectedAt: userSkill.firstDetectedAt,
            lastEvaluatedAt: userSkill.lastEvaluatedAt,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/*
 * ============================================================
 * GET /api/job-profiles/:slug
 *
 * Returns one active Job Profile with its role-level skill
 * requirements.
 * ============================================================
 */

jobProfilesRouter.get(
  "/:slug",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedParams = jobProfileSlugSchema.safeParse(req.params);

      if (!parsedParams.success) {
        res.status(400).json({
          success: false,
          message: "Invalid job profile slug",
          errors: parsedParams.error.flatten(),
        });
        return;
      }

      const { slug } = parsedParams.data;

      const profile = await prisma.jobProfile.findFirst({
        where: {
          slug,
          isActive: true,
        },
        include: {
          skills: {
            include: {
              skill: true,
            },
            orderBy: {
              importance: "desc",
            },
          },
        },
      });

      if (!profile) {
        res.status(404).json({
          success: false,
          message: "Job profile not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          profile: {
            id: profile.id,
            slug: profile.slug,
            title: profile.title,
            domain: profile.domain,
            description: profile.description,
            responsibilities: profile.responsibilities,
            aliases: profile.aliases,
            source: profile.source,
            isActive: profile.isActive,
            skills: profile.skills.map((profileSkill) => ({
              id: profileSkill.id,
              skillId: profileSkill.skillId,
              name: profileSkill.skill.name,
              normalizedName: profileSkill.skill.normalizedName,
              category: profileSkill.skill.category,
              description: profileSkill.skill.description,
              requiredLevel: Number(profileSkill.requiredLevel),
              importance: Number(profileSkill.importance),
              requirementType: profileSkill.requirementType,
              aliases: profileSkill.aliases,
            })),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

export default jobProfilesRouter;