import { Router } from "express";

import { healthCheck } from "./health.controller.js";

const router = Router();

/**
 * Liveness probe.
 *
 * Used by a deployment platform/orchestrator to determine
 * whether the API process itself is alive.
 *
 * This deliberately does not query the database.
 */
router.get("/live", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      service: "SkillCompass API",
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * Readiness probe.
 *
 * The existing health check verifies database connectivity.
 */
router.get("/", healthCheck);

export default router;