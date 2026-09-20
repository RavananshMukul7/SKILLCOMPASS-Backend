/*
  Warnings:

  - Made the column `analysisRunId` on table `JobMatch` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "JobMatch" ALTER COLUMN "analysisRunId" SET NOT NULL;
