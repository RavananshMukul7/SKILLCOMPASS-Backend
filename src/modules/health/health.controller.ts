import type { Request, Response } from "express";
import { getHealthStatus } from "./health.service.js";

export const healthCheck = async (
  req: Request,
  res: Response
) => {
  const health = await getHealthStatus();

  res.status(200).json({
    success: true,
    data: health,
  });
};