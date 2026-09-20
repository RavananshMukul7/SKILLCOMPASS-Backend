import mongoose from "mongoose";

const skillProfileSchema = new mongoose.Schema(
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

    skill: {
      type: String,
      required: true
    },

    evidence: [
      {
        type: String
      }
    ],

    concepts: [
      {
        type: String
      }
    ],

    occurrences: {
      type: Number,
      default: 0
    },

    averageComplexity: {
      type: Number,
      default: 0
    },

    averageConfidence: {
      type: Number,
      default: 0
    },

    proficiencyScore: {
      type: Number,
      default: 0
    },

    proficiencyLevel: {
      type: String,
      default: "Beginner"
    },

    analysisVersion: {
      type: String,
      required: true,
      default: "v1"
    },

    model: {
      type: String,
      required: true,
      default: "qwen2.5-coder:7b"
    },

    analysisTimestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "SkillProfile",
  skillProfileSchema
);