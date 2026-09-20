import express from "express";
import crypto from "crypto";

import { exchangeCodeForToken } from "../services/githubAuthService.js";
import { getAuthenticatedUser } from "../services/githubUserService.js";
import { getUserRepositories } from "../services/githubRepoService.js";
import { getSourceFiles } from "../services/githubSourceService.js";
import { collectRepositorySource } from "../services/dataCollectionService.js";

import {
  saveUser,
  saveRepository,
  saveSkillProfiles
} from "../services/databaseService.js";

import { extractSkills } from "../engines/skillExtractionEngine.js";
import { estimateProficiency } from "../engines/proficiencyEngine.js";

import {
  createAnalysisRun,
  completeAnalysisRun,
  failAnalysisRun
} from "../services/analysisRunService.js";

const router = express.Router();

/**
 * Start GitHub OAuth
 */
router.get("/", (req, res) => {
  const state = crypto.randomBytes(32).toString("hex");

  req.session.githubOAuthState = state;

  const githubAuthUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${process.env.GITHUB_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(
      process.env.GITHUB_CALLBACK_URL
    )}` +
    `&scope=read:user` +
    `&state=${state}`;

  res.redirect(githubAuthUrl);
});

/**
 * GitHub OAuth Callback
 */
router.get("/callback", async (req, res) => {
  console.log("CALLBACK RECEIVED");

  const { code, state } = req.query;

  console.log(
    "CODE RECEIVED:",
    code ? "YES" : "NO"
  );

  if (!code) {
    return res.status(400).json({
      error: "Authorization code is missing"
    });
  }

  if (
    !state ||
    state !== req.session.githubOAuthState
  ) {
    return res.status(400).json({
      error: "Invalid OAuth state"
    });
  }

  delete req.session.githubOAuthState;

  try {
    // ----------------------------------------
    // 1. Exchange OAuth code for access token
    // ----------------------------------------

    const tokenData =
      await exchangeCodeForToken(code);

    if (!tokenData.access_token) {
      throw new Error(
        tokenData.error ||
          "GitHub did not return an access token"
      );
    }

    const accessToken =
      tokenData.access_token;

    // ----------------------------------------
    // 2. Fetch GitHub user
    // ----------------------------------------

    const user =
      await getAuthenticatedUser(
        accessToken
      );

    // ----------------------------------------
    // 3. Save / update user
    // ----------------------------------------

    const savedUser =
      await saveUser(user);

    // ----------------------------------------
    // 4. Fetch repositories
    // ----------------------------------------

    const repositories =
      await getUserRepositories(
        accessToken
      );

    const repositorySourceFiles = [];

    // ----------------------------------------
    // 5. Process every repository
    // ----------------------------------------

    for (const repository of repositories) {
      // --------------------------------------
      // 5.1 Find source-code files
      // --------------------------------------

      const sourceFiles =
        await getSourceFiles(
          accessToken,
          repository
        );

      // --------------------------------------
      // 5.2 Collect / download source code
      // --------------------------------------

      const collectedPath =
        await collectRepositorySource(
          accessToken,
          repository,
          sourceFiles
        );

      // --------------------------------------
      // 5.3 Save repository metadata
      // --------------------------------------

      const savedRepository =
        await saveRepository(
          savedUser._id,
          repository,
          sourceFiles
        );

      // --------------------------------------
      // 5.4 Create analysis run
      // --------------------------------------

      const analysisRun =
        await createAnalysisRun(
          savedUser._id,
          savedRepository._id,
          "v1",
          "qwen2.5-coder:7b"
        );

      try {
        // ------------------------------------
        // 5.5 Skill extraction
        // ------------------------------------

        const extractionResult =
          await extractSkills(
            collectedPath
          );

        // ------------------------------------
        // 5.6 Proficiency estimation
        // ------------------------------------

        const proficiencyResults =
          estimateProficiency(
            extractionResult.skills
          );

        // ------------------------------------
        // 5.7 Combine skill + proficiency
        // ------------------------------------

        const skillsWithProficiency =
          extractionResult.skills.map(
            (skill) => {
              const proficiency =
                proficiencyResults.find(
                  (item) =>
                    item.skill === skill.skill
                );

              return {
                ...skill,

                proficiencyScore:
                  proficiency?.score ?? 0,

                proficiencyLevel:
                  proficiency?.level ??
                  "Beginner",

                analysisVersion:
                  extractionResult.analysisVersion,

                model:
                  extractionResult.model,

                analysisTimestamp:
                  extractionResult.analysisTimestamp
              };
            }
          );

        // ------------------------------------
        // 5.8 Save skill profiles
        // ------------------------------------

        await saveSkillProfiles(
          savedUser._id,
          savedRepository._id,
          skillsWithProficiency
        );

        // ------------------------------------
        // 5.9 Mark analysis completed
        // ------------------------------------

        await completeAnalysisRun(
          analysisRun._id
        );
      } catch (error) {
        // ------------------------------------
        // 5.10 Mark analysis failed
        // ------------------------------------

        await failAnalysisRun(
          analysisRun._id
        );

        throw error;
      }

      repositorySourceFiles.push({
        repository: repository.name,
        files: sourceFiles,
        collectedPath
      });
    }

    // ----------------------------------------
    // 6. Final response
    // ----------------------------------------

    res.json({
      message:
        "GitHub authentication successful",

      user,

      repositories:
        repositorySourceFiles
    });
  } catch (error) {
    console.error(
      error.response?.data ||
        error.message
    );

    res.status(500).json({
      error:
        "GitHub authentication failed"
    });
  }
});

export default router;