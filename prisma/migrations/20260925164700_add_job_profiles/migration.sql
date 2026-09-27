-- CreateEnum
CREATE TYPE "JobProfileRequirementType" AS ENUM ('CORE', 'IMPORTANT', 'PREFERRED');

-- CreateTable
CREATE TABLE "JobProfile" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "domain" VARCHAR(120) NOT NULL,
    "description" TEXT NOT NULL,
    "responsibilities" JSONB NOT NULL,
    "aliases" TEXT[],
    "source" VARCHAR(50) NOT NULL DEFAULT 'DATABASE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobProfileSkill" (
    "id" UUID NOT NULL,
    "jobProfileId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "requirementType" "JobProfileRequirementType" NOT NULL DEFAULT 'IMPORTANT',
    "requiredLevel" DECIMAL(6,3) NOT NULL,
    "importance" DECIMAL(5,4) NOT NULL,
    "aliases" TEXT[],

    CONSTRAINT "JobProfileSkill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobProfile_slug_key" ON "JobProfile"("slug");

-- CreateIndex
CREATE INDEX "JobProfile_domain_isActive_idx" ON "JobProfile"("domain", "isActive");

-- CreateIndex
CREATE INDEX "JobProfile_title_idx" ON "JobProfile"("title");

-- CreateIndex
CREATE INDEX "JobProfileSkill_jobProfileId_importance_idx" ON "JobProfileSkill"("jobProfileId", "importance");

-- CreateIndex
CREATE INDEX "JobProfileSkill_skillId_idx" ON "JobProfileSkill"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "JobProfileSkill_jobProfileId_skillId_key" ON "JobProfileSkill"("jobProfileId", "skillId");

-- AddForeignKey
ALTER TABLE "JobProfileSkill" ADD CONSTRAINT "JobProfileSkill_jobProfileId_fkey" FOREIGN KEY ("jobProfileId") REFERENCES "JobProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobProfileSkill" ADD CONSTRAINT "JobProfileSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
