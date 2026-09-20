/*
  Warnings:

  - A unique constraint covering the columns `[userId,jobId,analysisRunId,algorithmVersion]` on the table `JobMatch` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "JobMatch_userId_jobId_algorithmVersion_key";

-- AlterTable
ALTER TABLE "JobMatch" ADD COLUMN     "analysisRunId" UUID;

-- CreateIndex
CREATE INDEX "JobMatch_analysisRunId_idx" ON "JobMatch"("analysisRunId");

-- CreateIndex
CREATE UNIQUE INDEX "JobMatch_userId_jobId_analysisRunId_algorithmVersion_key" ON "JobMatch"("userId", "jobId", "analysisRunId", "algorithmVersion");

-- AddForeignKey
ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "AnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
