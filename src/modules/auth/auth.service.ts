import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { SESSION_DURATION_MS } from "../../config/session.js";

const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

interface SessionMetadata {
  userAgent?: string;
  ipAddress?: string;
}

const createSession = async (
  userId: string,
  metadata: SessionMetadata
) => {
  const rawSessionToken = crypto.randomBytes(32).toString("hex");

  const tokenHash = hashToken(rawSessionToken);

  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_MS
  );

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      lastUsedAt: new Date(),
      userAgent: metadata.userAgent ?? null,
      ipAddress: metadata.ipAddress ?? null,
    },
  });

  return {
    sessionToken: rawSessionToken,
    expiresAt,
  };
};

const sanitizeUser = (user: {
  id: string;
  email: string;
  displayName: string | null;
}) => {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  };
};

export const registerUser = async (
  email: string,
  password: string,
  displayName: string | undefined,
  metadata: SessionMetadata
) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (existingUser) {
    throw new AppError(
      "An account with this email already exists",
      409
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      displayName: displayName?.trim() || null,
    },
  });

  const session = await createSession(
    user.id,
    metadata
  );

  return {
    user: sanitizeUser(user),
    ...session,
  };
};

export const loginUser = async (
  email: string,
  password: string,
  metadata: SessionMetadata
) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (!user) {
    throw new AppError(
      "Invalid email or password",
      401
    );
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw new AppError(
      "Invalid email or password",
      401
    );
  }

  const session = await createSession(
    user.id,
    metadata
  );

  return {
    user: sanitizeUser(user),
    ...session,
  };
};

export const logoutUser = async (
  sessionToken: string
) => {
  const tokenHash = hashToken(sessionToken);

  await prisma.session.updateMany({
    where: {
      tokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
};

export const getUserSessions = async (
  userId: string
) => {
  return prisma.session.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      userAgent: true,
      ipAddress: true,
      createdAt: true,
      lastUsedAt: true,
      expiresAt: true,
    },
    orderBy: {
      lastUsedAt: "desc",
    },
  });
};

export const revokeSession = async (
  userId: string,
  sessionId: string
) => {
  const result = await prisma.session.updateMany({
    where: {
      id: sessionId,
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  if (result.count === 0) {
    throw new AppError(
      "Session not found",
      404
    );
  }
};

export const logoutAllSessions = async (
  userId: string
) => {
  await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
};