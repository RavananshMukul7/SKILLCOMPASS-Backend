import { prisma } from "../../config/prisma.js";

export interface JobSkillInput {
  skillName: string;
  normalizedName: string;
  category: string;
  requirementType: "REQUIRED" | "PREFERRED";
  importance: number;
}

export interface JobInput {
  source: string;
  externalJobId: string;
  title: string;
  companyName: string;
  location?: string | null;
  employmentType?: string | null;
  remote?: boolean;
  url: string;
  description?: string | null;
  postedAt?: Date | null;
  expiresAt?: Date | null;
  skills: JobSkillInput[];
}

export const upsertJob = async (input: JobInput) => {
  const job = await prisma.job.upsert({
    where: {
      source_externalJobId: {
        source: input.source,
        externalJobId: input.externalJobId,
      },
    },
    update: {
      title: input.title,
      companyName: input.companyName,
      location: input.location ?? null,
      employmentType: input.employmentType ?? null,
      remote: input.remote ?? false,
      url: input.url,
      description: input.description ?? null,
      postedAt: input.postedAt ?? null,
      expiresAt: input.expiresAt ?? null,
    },
    create: {
      source: input.source,
      externalJobId: input.externalJobId,
      title: input.title,
      companyName: input.companyName,
      location: input.location ?? null,
      employmentType: input.employmentType ?? null,
      remote: input.remote ?? false,
      url: input.url,
      description: input.description ?? null,
      postedAt: input.postedAt ?? null,
      expiresAt: input.expiresAt ?? null,
    },
  });

  await prisma.$transaction(async (tx) => {
    await tx.jobSkill.deleteMany({
      where: {
        jobId: job.id,
      },
    });

    for (const jobSkill of input.skills) {
      const skill = await tx.skill.upsert({
        where: {
          normalizedName: jobSkill.normalizedName,
        },
        update: {
          name: jobSkill.skillName,
          category: jobSkill.category,
        },
        create: {
          name: jobSkill.skillName,
          normalizedName: jobSkill.normalizedName,
          category: jobSkill.category,
        },
      });

      await tx.jobSkill.create({
        data: {
          jobId: job.id,
          skillId: skill.id,
          requirementType: jobSkill.requirementType,
          importance: jobSkill.importance,
        },
      });
    }
  });

  return prisma.job.findUniqueOrThrow({
    where: {
      id: job.id,
    },
    include: {
      skills: {
        include: {
          skill: true,
        },
      },
    },
  });
};