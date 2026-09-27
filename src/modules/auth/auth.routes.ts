import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  login,
  logout,
  logoutAll,
  me,
  register,
  revokeUserSession,
  sessions,
} from "./auth.controller.js";

import {
  loginSchema,
  registerSchema,
  sessionIdSchema,
} from "./auth.validation.js";

import { validate } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/requireAuth.js";

const router = Router();

/*
 * Login-specific rate limiter.
 *
 * This protects the credential endpoint without
 * limiting normal authenticated requests such as
 * /me, /sessions, or /logout.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

/*
 * Registration gets its own limiter so repeated
 * registration attempts do not affect login.
 */
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

/*
 * Logout
 */
router.post(
  "/logout",
  logout,
);

/*
 * Login
 */
router
  .route("/login")
  .post(
    loginLimiter,
    validate(loginSchema),
    login,
  )
  .get((req, res) => {
    res.render("login");
  });

/*
 * Registration
 */
router
  .route("/register")
  .get((req, res) => {
    res.render("register");
  })
  .post(
    registerLimiter,
    validate(registerSchema),
    register,
  );

/*
 * Current authenticated user
 */
router.get(
  "/me",
  requireAuth,
  me,
);

/*
 * Active sessions
 */
router.get(
  "/sessions",
  requireAuth,
  sessions,
);

/*
 * Revoke a specific session
 */
router.delete(
  "/sessions/:sessionId",
  requireAuth,
  validate(sessionIdSchema),
  revokeUserSession,
);

/*
 * Revoke all sessions
 */
router.post(
  "/logout-all",
  requireAuth,
  logoutAll,
);

export default router;