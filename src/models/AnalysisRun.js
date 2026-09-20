import mongoose from "mongoose";

const analysisRunSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    repositoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repository",
      required: true
    },

    analysisVersion: {
      type: String,
      required: true
    },

    model: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["started", "completed", "failed"],
      default: "started"
    },

    startedAt: {
      type: Date,
      default: Date.now
    },

    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "AnalysisRun",
  analysisRunSchema
);