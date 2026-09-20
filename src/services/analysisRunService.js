import AnalysisRun from "../models/AnalysisRun.js";

export async function createAnalysisRun(
  userId,
  repositoryId,
  analysisVersion,
  model
) {
  return AnalysisRun.create({
    userId,
    repositoryId,
    analysisVersion,
    model,
    status: "started"
  });
}

export async function completeAnalysisRun(
  analysisRunId
) {
  return AnalysisRun.findByIdAndUpdate(
    analysisRunId,
    {
      status: "completed",
      completedAt: new Date()
    },
    {
      returnDocument: "after"
    }
  );
}

export async function failAnalysisRun(
  analysisRunId
) {
  return AnalysisRun.findByIdAndUpdate(
    analysisRunId,
    {
      status: "failed",
      completedAt: new Date()
    },
    {
      returnDocument: "after"
    }
  );
}