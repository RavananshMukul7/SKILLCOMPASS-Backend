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

-- CreateIndex
CREATE INDEX "JobJobProfile_jobId_classificationScore_idx" ON "JobJobProfile"("jobId", "classificationScore");

-- CreateIndex
CREATE INDEX "JobJobProfile_jobProfileId_classificationScore_idx" ON "JobJobProfile"("jobProfileId", "classificationScore");

-- CreateIndex
CREATE UNIQUE INDEX "JobJobProfile_jobId_jobProfileId_key" ON "JobJobProfile"("jobId", "jobProfileId");

-- AddForeignKey
ALTER TABLE "JobJobProfile" ADD CONSTRAINT "JobJobProfile_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobJobProfile" ADD CONSTRAINT "JobJobProfile_jobProfileId_fkey" FOREIGN KEY ("jobProfileId") REFERENCES "JobProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
