import express from "express";
import helmet from "helmet";
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

import { notFoundHandler } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.disable("x-powered-by");
/*
 * ============================================================
 * SECURITY
 * ============================================================
 */

app.use(helmet());

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(cookieParser());

/*
 * ============================================================
 * REQUEST BODY PARSING
 * ============================================================
 */

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

/*
 * ============================================================
 * REQUEST LOGGER
 * ============================================================
 */

app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
    );
  });

  next();
});

/*
 * ============================================================
 * RATE LIMITING
 * ============================================================
 */

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

/*
 * ============================================================
 * SWAGGER / OPENAPI
 * ============================================================
 */

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);

/*
 * ============================================================
 * API ROUTES
 * ============================================================
 */

app.use("/api/health", healthRoutes);

app.use(
  "/api/auth",
  authLimiter,
  authRoutes
);

app.use(
  "/api/github",
  apiLimiter,
  githubRoutes
);

app.use(
  "/api/analysis",
  apiLimiter,
  analysisRoutes
);

app.use(
  "/api/dashboard",
  apiLimiter,
  dashboardRouter
);

app.use(
  "/api/matching",
  apiLimiter,
  matchingRouter
);

app.use(
  "/api/jobs",
  apiLimiter,
  jobsRouter
);

/*
 * ============================================================
 * WEB PAGE
 * ============================================================
 */

app.get("/", (req, res) => {
  res.render("welcome");
});

/*
 * ============================================================
 * 404 HANDLER
 * ============================================================
 */

app.use(notFoundHandler);

/*
 * ============================================================
 * GLOBAL ERROR HANDLER
 * ============================================================
 */

app.use(errorHandler);

export default app;