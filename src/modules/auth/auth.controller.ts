import type { Request, Response } from "express";
import {
  SESSION_COOKIE_NAME,
} from "../../config/session.js";
import {
  getUserSessions,
  loginUser,
  logoutAllSessions,
  logoutUser,
  registerUser,
  revokeSession,
} from "./auth.service.js";

const getClientIp = (
  req: Request
): string | undefined => {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string") {
    return forwarded
      .split(",")[0]
      ?.trim();
  }

  return req.socket.remoteAddress;
};

const setSessionCookie = (
  res: Response,
  sessionToken: string,
  expiresAt: Date
) => {
  res.cookie(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
};

const clearSessionCookie = (
  res: Response
) => {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
};

export const register = async (
  req: Request,
  res: Response
) => {
  const {
    email,
    password,
    displayName,
  } = res.locals.validated.body;

  const result = await registerUser(
    email,
    password,
    displayName,
    {
      userAgent:
        req.get("user-agent") ??
        undefined,

      ipAddress:
        getClientIp(req),
    }
  );

  setSessionCookie(
    res,
    result.sessionToken,
    result.expiresAt
  );

  res.status(201).json({
    success: true,
    data: {
      user: result.user,
    },
  });
};

export const login = async (
  req: Request,
  res: Response
) => {
  const {
    email,
    password,
  } = res.locals.validated.body;

  const result = await loginUser(
    email,
    password,
    {
      userAgent:
        req.get("user-agent") ??
        undefined,

      ipAddress:
        getClientIp(req),
    }
  );

  setSessionCookie(
    res,
    result.sessionToken,
    result.expiresAt
  );

  res.status(200).json({
    success: true,
    data: {
      user: result.user,
    },
  });
};

export const me = async (
  req: Request,
  res: Response
) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
};

export const logout = async (
  req: Request,
  res: Response
) => {
  const sessionToken =
    req.cookies?.[SESSION_COOKIE_NAME];

  if (sessionToken) {
    await logoutUser(sessionToken);
  }

  clearSessionCookie(res);

  res.status(200).json({
    success: true,
    message:
      "Logged out successfully",
  });
};

export const sessions = async (
  req: Request,
  res: Response
) => {
  const userSessions =
    await getUserSessions(
      req.user!.id
    );

  res.status(200).json({
    success: true,
    data: userSessions,
  });
};

export const revokeUserSession = async (
  req: Request<{
    sessionId: string;
  }>,
  res: Response
) => {
  await revokeSession(
    req.user!.id,
    req.params.sessionId
  );

  res.status(204).send();
};

export const logoutAll = async (
  req: Request,
  res: Response
) => {
  await logoutAllSessions(
    req.user!.id
  );

  clearSessionCookie(res);

  res.status(200).json({
    success: true,
    message:
      "All sessions revoked",
  });
};