import type { Request, Response } from "express";

import {
  createGitHubAuthorizationUrl,
  handleGitHubCallback,
} from "./github.service.js";
import { syncUserRepositories } from "./githubRepository.service.js";

import { AppError } from "../../utils/AppError.js";

export const connectGitHub = async (
  req: Request,
  res: Response
) => {
  if (!req.user) {
    throw new AppError(
      "Authentication required",
      401
    );
  }

  const authorizationUrl =
    await createGitHubAuthorizationUrl(
      req.user.id
    );

  res.redirect(authorizationUrl);
};

export const githubCallback = async (
  req: Request,
  res: Response
) => {
  /*
   * Express should normally populate req.query,
   * but we parse the original URL explicitly here.
   * This also lets us see exactly what GitHub sent.
   */
  const callbackUrl = new URL(
    req.originalUrl,
    "http://localhost"
  );

  const code =
    callbackUrl.searchParams.get("code");

  const state =
    callbackUrl.searchParams.get("state");

  const error =
    callbackUrl.searchParams.get("error");

  const errorDescription =
    callbackUrl.searchParams.get(
      "error_description"
    );

  console.log(
    "GitHub callback URL:",
    req.originalUrl
  );

  console.log("GitHub callback parameters:", {
    hasCode: Boolean(code),
    hasState: Boolean(state),
    error,
  });

  if (error) {
    throw new AppError(
      `GitHub authorization failed: ${
        errorDescription ??
        error
      }`,
      400
    );
  }

  if (!code || !state) {
    throw new AppError(
      "Missing GitHub authorization parameters",
      400
    );
  }

  await handleGitHubCallback(
    code,
    state
  );

  /*
   * Temporary redirect until we build
   * the actual frontend GitHub settings page.
   */
  res.redirect(
    "http://localhost:3000/settings/github"
  );
};

export const syncRepositories = async (
  req: Request,
  res: Response
) => {
  if (!req.user) {
    throw new AppError(
      "Authentication required",
      401
    );
  }

  const result =
    await syncUserRepositories(
      req.user.id
    );

  res.status(200).json({
    success: true,
    data: result,
  });
};