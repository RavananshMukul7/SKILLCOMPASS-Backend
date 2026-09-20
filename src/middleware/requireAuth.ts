import crypto from "node:crypto";

import type {
  Request,
  RequestHandler,
} from "express";

import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

const hashToken = (
  token: string
): string => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

export type AuthedRequest = Request & {
  user: {
    id: string;
    email: string;
    displayName: string | null;
  };
};

export const requireAuth: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const sessionToken =
      req.cookies?.session;

    if (!sessionToken) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const tokenHash =
      hashToken(sessionToken);

    const session =
      await prisma.session.findFirst({
        where: {
          tokenHash,
          revokedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
            },
          },
        },
      });

    if (!session) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired session",
      });
      return;
    }

    req.user = session.user;

    await prisma.session.update({
      where: {
        id: session.id,
      },
      data: {
        lastUsedAt: new Date(),
      },
    });

    next();
  } catch (error) {
    next(error);
  }
};