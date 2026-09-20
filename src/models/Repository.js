import mongoose from "mongoose";

const repositorySchema = new mongoose.Schema(
  {
    githubId: {
      type: Number,
      required: true,
      unique: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    name: {
      type: String,
      required: true
    },

    fullName: {
      type: String,
      required: true
    },

    defaultBranch: {
      type: String,
      default: "main"
    },

    sourceFiles: [
      {
        path: String,
        sha: String,
        size: Number
      }
    ]
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Repository", repositorySchema);