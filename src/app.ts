import express from "express";
import helmet from "helmet";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";

import swaggerDocument from "./config/swagger.js";
import { env } from "./config/env.js";

import healthRoutes from "./modules/health/health.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import githubRoutes from "./modules/github/github.routes.js";
import analysisRoutes from "./modules/analysis/analysis.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { matchingRouter } from "./modules/matching/matching.routes.js";
import { jobsRouter } from "./modules/jobs/jobs.routes.js";
import jobProfilesRouter from "./modules/jobProfiles/jobProfiles.routes.js";

import { notFoundHandler } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.disable("x-powered-by");

/* ============================================================
   SECURITY
   ============================================================ */

app.use(helmet());

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(cookieParser());

/* ============================================================
   REQUEST BODY PARSING
   ============================================================ */

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  }),
);

/* ============================================================
   REQUEST LOGGER
   ============================================================ */

app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`,
    );
  });

  next();
});

/* ============================================================
   RATE LIMITING
   ============================================================ */

/*
 * General API limiter.
 *
 * This continues to protect high-volume API modules,
 * but authentication now has its own route-specific
 * limiters inside auth.routes.ts.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

/* ============================================================
   SWAGGER / OPENAPI
   ============================================================ */

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument),
);

app.set("view engine", "ejs");

/* ============================================================
   API ROUTES
   ============================================================ */

app.use(
  "/api/health",
  healthRoutes,
);

/*
 * Authentication routes intentionally do NOT use
 * the general auth-wide rate limiter.
 *
 * login and register have their own limiters in
 * auth.routes.ts, while /me, /logout, /sessions,
 * etc. remain freely usable during normal application
 * operation.
 */
app.use(
  "/api/auth",
  authRoutes,
);

app.use(
  "/api/github",
  apiLimiter,
  githubRoutes,
);

app.use(
  "/api/analysis",
  apiLimiter,
  analysisRoutes,
);

app.use(
  "/api/dashboard",
  apiLimiter,
  dashboardRouter,
);

app.use(
  "/api/matching",
  apiLimiter,
  matchingRouter,
);

app.use(
  "/api/jobs",
  apiLimiter,
  jobsRouter,
);

app.use(
  "/api/job-profiles",
  apiLimiter,
  jobProfilesRouter,
);

/* ============================================================
   TEST JOB PAGE
   ============================================================ */

app.get(
  "/test-job/node-developer",
  (req, res) => {
    res
      .status(200)
      .type("html")
      .send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1"
    />
    <title>
      Node.js Developer Intern — SkillCompass Test Job
    </title>
  </head>

  <body
    style="
      margin:0;
      font-family:Arial,sans-serif;
      background:#0b1020;
      color:#f5f7ff;
    "
  >
    <main
      style="
        max-width:760px;
        margin:60px auto;
        padding:32px;
        border-radius:24px;
        background:#141b31;
        box-shadow:0 20px 60px rgba(0,0,0,.35);
      "
    >
      <p
        style="
          margin:0 0 10px;
          color:#66e3ff;
          font-size:14px;
          font-weight:700;
          letter-spacing:.08em;
        "
      >
        SKILLCOMPASS SOURCE TEST
      </p>

      <h1
        style="
          margin:0 0 12px;
          font-size:32px;
        "
      >
        Node.js Developer Intern
      </h1>

      <h2
        style="
          margin:0 0 20px;
          font-size:20px;
          color:#b8c5e6;
        "
      >
        SkillCompass Source Test
      </h2>

      <p
        style="
          font-size:16px;
          line-height:1.7;
          color:#dce4ff;
        "
      >
        This is a test opening returned by the
        SkillCompass job-source abstraction.
        It exists only to verify that the stored
        job URL can be opened successfully.
      </p>

      <div
        style="
          display:flex;
          flex-wrap:wrap;
          gap:10px;
          margin-top:24px;
        "
      >
        <span
          style="
            padding:10px 14px;
            border-radius:999px;
            background:#1e2b4c;
          "
        >
          Remote
        </span>

        <span
          style="
            padding:10px 14px;
            border-radius:999px;
            background:#1e2b4c;
          "
        >
          Internship
        </span>

        <span
          style="
            padding:10px 14px;
            border-radius:999px;
            background:#1e2b4c;
          "
        >
          JavaScript
        </span>

        <span
          style="
            padding:10px 14px;
            border-radius:999px;
            background:#1e2b4c;
          "
        >
          OOP
        </span>

        <span
          style="
            padding:10px 14px;
            border-radius:999px;
            background:#1e2b4c;
          "
        >
          Async Programming
        </span>
      </div>
    </main>
  </body>
</html>`);
  },
);

/* ============================================================
   WEB PAGE
   ============================================================ */

app.get(
  "/",
  (req, res) => {
    res.render("welcome");
  },
);

/* ============================================================
   404 HANDLER
   ============================================================ */

app.use(notFoundHandler);

/* ============================================================
   GLOBAL ERROR HANDLER
   ============================================================ */

app.use(errorHandler);

export default app;