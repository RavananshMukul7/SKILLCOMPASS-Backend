-- AlterEnum
ALTER TYPE "AnalysisRunStatus" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "AnalysisRun" ALTER COLUMN "status" SET DEFAULT 'PENDING';
