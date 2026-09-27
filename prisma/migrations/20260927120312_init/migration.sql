-- CreateEnum
CREATE TYPE "AnalysisRunStatus" AS ENUM ('PENDING', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProficiencyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "JobRequirementType" AS ENUM ('REQUIRED', 'PREFERRED');

-- CreateEnum
CREATE TYPE "JobProfileRequirementType" AS ENUM ('CORE', 'IMPORTANT', 'PREFERRED');

-- CreateEnum
CREATE TYPE "ProcessingJobType" AS ENUM ('GITHUB_SYNC', 'REPOSITORY_ANALYSIS', 'PROFICIENCY_ANALYSIS', 'JOB_SYNC', 'MATCHING', 'SKILL_GAP_ANALYSIS');

-- CreateEnum
CREATE TYPE "ProcessingJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" VARCHAR(120),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "userAgent" TEXT,
    "ipAddress" VARCHAR(100),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubAccount" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "githubUserId" BIGINT NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "avatarUrl" TEXT,
    "githubInstallationId" BIGINT,
    "accessTokenEncrypted" TEXT NOT NULL,
    "refreshTokenEncrypted" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubOAuthState" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "stateHash" VARCHAR(128) NOT NULL,
    "codeVerifierEncrypted" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GitHubOAuthState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repository" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "githubRepoId" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(500) NOT NULL,
    "ownerLogin" VARCHAR(255) NOT NULL,
    "defaultBranch" VARCHAR(255),
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "htmlUrl" TEXT NOT NULL,
    "description" TEXT,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "forks" INTEGER NOT NULL DEFAULT 0,
    "pushedAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisRun" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "repositoryId" UUID NOT NULL,
    "status" "AnalysisRunStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalysisRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepositorySnapshot" (
    "id" UUID NOT NULL,
    "repositoryId" UUID NOT NULL,
    "analysisRunId" UUID NOT NULL,
    "commitSha" VARCHAR(64) NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepositorySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepositoryLanguage" (
    "id" UUID NOT NULL,
    "snapshotId" UUID NOT NULL,
    "language" VARCHAR(120) NOT NULL,
    "bytes" BIGINT NOT NULL,
    "percentage" DECIMAL(7,4) NOT NULL,

    CONSTRAINT "RepositoryLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnologyEvidence" (
    "id" UUID NOT NULL,
    "snapshotId" UUID NOT NULL,
    "technologyName" VARCHAR(255) NOT NULL,
    "normalizedName" VARCHAR(255) NOT NULL,
    "evidenceType" VARCHAR(80) NOT NULL,
    "evidenceValue" TEXT,
    "confidence" DECIMAL(5,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechnologyEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "normalizedName" VARCHAR(255) NOT NULL,
    "category" VARCHAR(120),
    "description" TEXT,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "UserSkill" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "currentScore" DECIMAL(6,3) NOT NULL,
    "confidence" DECIMAL(5,4) NOT NULL,
    "firstDetectedAt" TIMESTAMP(3) NOT NULL,
    "lastEvaluatedAt" TIMESTAMP(3) NOT NULL,
    "sourceAnalysisRunId" UUID,

    CONSTRAINT "UserSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillEvidence" (
    "id" UUID NOT NULL,
    "userSkillId" UUID NOT NULL,
    "technologyEvidenceId" UUID NOT NULL,
    "weight" DECIMAL(6,3) NOT NULL,
    "reasoning" TEXT,

    CONSTRAINT "SkillEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProficiencyAssessment" (
    "id" UUID NOT NULL,
    "userSkillId" UUID NOT NULL,
    "analysisRunId" UUID NOT NULL,
    "score" DECIMAL(6,3) NOT NULL,
    "level" "ProficiencyLevel" NOT NULL,
    "confidence" DECIMAL(5,4) NOT NULL,
    "methodologyVersion" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProficiencyAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" UUID NOT NULL,
    "source" VARCHAR(100) NOT NULL,
    "externalJobId" VARCHAR(255) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "companyName" VARCHAR(255) NOT NULL,
    "location" VARCHAR(500),
    "employmentType" VARCHAR(100),
    "remote" BOOLEAN NOT NULL DEFAULT false,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "postedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobSkill" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "requirementType" "JobRequirementType" NOT NULL,
    "importance" DECIMAL(5,4) NOT NULL,

    CONSTRAINT "JobSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobJobProfile" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "jobProfileId" UUID NOT NULL,
    "classificationScore" DECIMAL(6,3) NOT NULL,
    "classificationMethod" VARCHAR(50) NOT NULL DEFAULT 'RULE_BASED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobJobProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobMatch" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "analysisRunId" UUID NOT NULL,
    "matchScore" DECIMAL(6,3) NOT NULL,
    "skillCoverage" DECIMAL(5,4) NOT NULL,
    "skillGapCount" INTEGER NOT NULL,
    "explanation" TEXT,
    "algorithmVersion" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillGap" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "jobId" UUID,
    "currentScore" DECIMAL(6,3) NOT NULL,
    "requiredImportance" DECIMAL(5,4) NOT NULL,
    "gapScore" DECIMAL(6,3) NOT NULL,
    "priority" DECIMAL(6,3) NOT NULL,
    "analysisRunId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillGap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingJob" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "analysisRunId" UUID,
    "type" "ProcessingJobType" NOT NULL,
    "status" "ProcessingJobStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessingJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Session_revokedAt_idx" ON "Session"("revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubAccount_userId_key" ON "GitHubAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubAccount_githubUserId_key" ON "GitHubAccount"("githubUserId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubAccount_githubInstallationId_key" ON "GitHubAccount"("githubInstallationId");

-- CreateIndex
CREATE INDEX "GitHubAccount_githubUserId_idx" ON "GitHubAccount"("githubUserId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubOAuthState_stateHash_key" ON "GitHubOAuthState"("stateHash");

-- CreateIndex
CREATE INDEX "GitHubOAuthState_userId_idx" ON "GitHubOAuthState"("userId");

-- CreateIndex
CREATE INDEX "GitHubOAuthState_expiresAt_idx" ON "GitHubOAuthState"("expiresAt");

-- CreateIndex
CREATE INDEX "Repository_userId_idx" ON "Repository"("userId");

-- CreateIndex
CREATE INDEX "Repository_fullName_idx" ON "Repository"("fullName");

-- CreateIndex
CREATE INDEX "Repository_lastSyncedAt_idx" ON "Repository"("lastSyncedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Repository_userId_githubRepoId_key" ON "Repository"("userId", "githubRepoId");

-- CreateIndex
CREATE INDEX "AnalysisRun_userId_createdAt_idx" ON "AnalysisRun"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalysisRun_repositoryId_createdAt_idx" ON "AnalysisRun"("repositoryId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalysisRun_status_createdAt_idx" ON "AnalysisRun"("status", "createdAt");

-- CreateIndex
CREATE INDEX "RepositorySnapshot_repositoryId_capturedAt_idx" ON "RepositorySnapshot"("repositoryId", "capturedAt");

-- CreateIndex
CREATE INDEX "RepositorySnapshot_analysisRunId_idx" ON "RepositorySnapshot"("analysisRunId");

-- CreateIndex
CREATE UNIQUE INDEX "RepositorySnapshot_repositoryId_analysisRunId_key" ON "RepositorySnapshot"("repositoryId", "analysisRunId");

-- CreateIndex
CREATE INDEX "RepositoryLanguage_snapshotId_idx" ON "RepositoryLanguage"("snapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "RepositoryLanguage_snapshotId_language_key" ON "RepositoryLanguage"("snapshotId", "language");

-- CreateIndex
CREATE INDEX "TechnologyEvidence_snapshotId_normalizedName_idx" ON "TechnologyEvidence"("snapshotId", "normalizedName");

-- CreateIndex
CREATE INDEX "TechnologyEvidence_normalizedName_idx" ON "TechnologyEvidence"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_normalizedName_key" ON "Skill"("normalizedName");

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

-- CreateIndex
CREATE INDEX "UserSkill_userId_skillId_idx" ON "UserSkill"("userId", "skillId");

-- CreateIndex
CREATE INDEX "UserSkill_userId_currentScore_idx" ON "UserSkill"("userId", "currentScore");

-- CreateIndex
CREATE UNIQUE INDEX "UserSkill_userId_skillId_key" ON "UserSkill"("userId", "skillId");

-- CreateIndex
CREATE INDEX "SkillEvidence_userSkillId_idx" ON "SkillEvidence"("userSkillId");

-- CreateIndex
CREATE INDEX "SkillEvidence_technologyEvidenceId_idx" ON "SkillEvidence"("technologyEvidenceId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillEvidence_userSkillId_technologyEvidenceId_key" ON "SkillEvidence"("userSkillId", "technologyEvidenceId");

-- CreateIndex
CREATE INDEX "ProficiencyAssessment_userSkillId_createdAt_idx" ON "ProficiencyAssessment"("userSkillId", "createdAt");

-- CreateIndex
CREATE INDEX "ProficiencyAssessment_analysisRunId_idx" ON "ProficiencyAssessment"("analysisRunId");

-- CreateIndex
CREATE INDEX "Job_source_idx" ON "Job"("source");

-- CreateIndex
CREATE INDEX "Job_postedAt_idx" ON "Job"("postedAt");

-- CreateIndex
CREATE INDEX "Job_expiresAt_idx" ON "Job"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Job_source_externalJobId_key" ON "Job"("source", "externalJobId");

-- CreateIndex
CREATE INDEX "JobSkill_jobId_skillId_idx" ON "JobSkill"("jobId", "skillId");

-- CreateIndex
CREATE INDEX "JobSkill_skillId_idx" ON "JobSkill"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "JobSkill_jobId_skillId_key" ON "JobSkill"("jobId", "skillId");

-- CreateIndex
CREATE INDEX "JobJobProfile_jobId_classificationScore_idx" ON "JobJobProfile"("jobId", "classificationScore");

-- CreateIndex
CREATE INDEX "JobJobProfile_jobProfileId_classificationScore_idx" ON "JobJobProfile"("jobProfileId", "classificationScore");

-- CreateIndex
CREATE UNIQUE INDEX "JobJobProfile_jobId_jobProfileId_key" ON "JobJobProfile"("jobId", "jobProfileId");

-- CreateIndex
CREATE INDEX "JobMatch_userId_matchScore_idx" ON "JobMatch"("userId", "matchScore");

-- CreateIndex
CREATE INDEX "JobMatch_jobId_idx" ON "JobMatch"("jobId");

-- CreateIndex
CREATE INDEX "JobMatch_analysisRunId_idx" ON "JobMatch"("analysisRunId");

-- CreateIndex
CREATE UNIQUE INDEX "JobMatch_userId_jobId_analysisRunId_algorithmVersion_key" ON "JobMatch"("userId", "jobId", "analysisRunId", "algorithmVersion");

-- CreateIndex
CREATE INDEX "SkillGap_userId_priority_idx" ON "SkillGap"("userId", "priority");

-- CreateIndex
CREATE INDEX "SkillGap_skillId_idx" ON "SkillGap"("skillId");

-- CreateIndex
CREATE INDEX "SkillGap_jobId_idx" ON "SkillGap"("jobId");

-- CreateIndex
CREATE INDEX "SkillGap_analysisRunId_idx" ON "SkillGap"("analysisRunId");

-- CreateIndex
CREATE INDEX "ProcessingJob_status_createdAt_idx" ON "ProcessingJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ProcessingJob_userId_createdAt_idx" ON "ProcessingJob"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ProcessingJob_analysisRunId_idx" ON "ProcessingJob"("analysisRunId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubAccount" ADD CONSTRAINT "GitHubAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubOAuthState" ADD CONSTRAINT "GitHubOAuthState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repository" ADD CONSTRAINT "Repository_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisRun" ADD CONSTRAINT "AnalysisRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisRun" ADD CONSTRAINT "AnalysisRun_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepositorySnapshot" ADD CONSTRAINT "RepositorySnapshot_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepositorySnapshot" ADD CONSTRAINT "RepositorySnapshot_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "AnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepositoryLanguage" ADD CONSTRAINT "RepositoryLanguage_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "RepositorySnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnologyEvidence" ADD CONSTRAINT "TechnologyEvidence_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "RepositorySnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobProfileSkill" ADD CONSTRAINT "JobProfileSkill_jobProfileId_fkey" FOREIGN KEY ("jobProfileId") REFERENCES "JobProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobProfileSkill" ADD CONSTRAINT "JobProfileSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkill" ADD CONSTRAINT "UserSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkill" ADD CONSTRAINT "UserSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkill" ADD CONSTRAINT "UserSkill_sourceAnalysisRunId_fkey" FOREIGN KEY ("sourceAnalysisRunId") REFERENCES "AnalysisRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillEvidence" ADD CONSTRAINT "SkillEvidence_userSkillId_fkey" FOREIGN KEY ("userSkillId") REFERENCES "UserSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillEvidence" ADD CONSTRAINT "SkillEvidence_technologyEvidenceId_fkey" FOREIGN KEY ("technologyEvidenceId") REFERENCES "TechnologyEvidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProficiencyAssessment" ADD CONSTRAINT "ProficiencyAssessment_userSkillId_fkey" FOREIGN KEY ("userSkillId") REFERENCES "UserSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProficiencyAssessment" ADD CONSTRAINT "ProficiencyAssessment_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "AnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSkill" ADD CONSTRAINT "JobSkill_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSkill" ADD CONSTRAINT "JobSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobJobProfile" ADD CONSTRAINT "JobJobProfile_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobJobProfile" ADD CONSTRAINT "JobJobProfile_jobProfileId_fkey" FOREIGN KEY ("jobProfileId") REFERENCES "JobProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "AnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillGap" ADD CONSTRAINT "SkillGap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillGap" ADD CONSTRAINT "SkillGap_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillGap" ADD CONSTRAINT "SkillGap_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillGap" ADD CONSTRAINT "SkillGap_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "AnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingJob" ADD CONSTRAINT "ProcessingJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingJob" ADD CONSTRAINT "ProcessingJob_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "AnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
