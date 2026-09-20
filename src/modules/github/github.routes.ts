import { Router } from "express";

import {
  connectGitHub,
  githubCallback,
  syncRepositories,
} from "./github.controller.js";

import { requireAuth } from "../../middleware/requireAuth.js";

const router = Router();

/*
 * User must be authenticated in SkillCompass
 * before starting the GitHub connection flow.
 */
router.get(
  "/connect",
  requireAuth,
  connectGitHub
);

/*
 * DO NOT attach requireAuth here.
 *
 * GitHub redirects the browser to this endpoint.
 * The callback identifies the SkillCompass user
 * through the validated, one-time OAuth state stored
 * in GitHubOAuthState.
 */
router.get(
  "/callback",
  githubCallback
);

router.post(
  "/repositories/sync",
  requireAuth,
  syncRepositories
);

export default router;