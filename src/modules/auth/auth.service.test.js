import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcrypt";
import { prisma } from "../../config/prisma.js";
import { getUserSessions, loginUser, logoutAllSessions, logoutUser, registerUser, revokeSession, } from "./auth.service.js";
describe("auth.service", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });
    describe("registerUser", () => {
        it("should register a new user and create a session", async () => {
            vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);
            vi.spyOn(prisma.user, "create").mockResolvedValue({
                id: "user-1",
                email: "test@example.com",
                passwordHash: "hashed-password",
                displayName: "Test User",
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            vi.spyOn(prisma.session, "create").mockResolvedValue({
                id: "session-1",
                userId: "user-1",
                tokenHash: "token-hash",
                userAgent: "Vitest",
                ipAddress: "127.0.0.1",
                createdAt: new Date(),
                lastUsedAt: new Date(),
                expiresAt: new Date(Date.now() + 1000 * 60 * 60),
                revokedAt: null,
            });
            const result = await registerUser("  TEST@EXAMPLE.COM  ", "password123", "  Test User  ", {
                userAgent: "Vitest",
                ipAddress: "127.0.0.1",
            });
            expect(result.user).toEqual({
                id: "user-1",
                email: "test@example.com",
                displayName: "Test User",
            });
            expect(result.sessionToken).toBeDefined();
            expect(result.sessionToken).toHaveLength(64);
            expect(result.expiresAt).toBeInstanceOf(Date);
            expect(prisma.user.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    email: "test@example.com",
                    displayName: "Test User",
                }),
            });
            expect(prisma.session.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: "user-1",
                    userAgent: "Vitest",
                    ipAddress: "127.0.0.1",
                }),
            });
        });
        it("should reject duplicate registration", async () => {
            vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
                id: "existing-user",
                email: "test@example.com",
                passwordHash: "hashed-password",
                displayName: "Existing User",
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            vi.spyOn(prisma.user, "create");
            await expect(registerUser("test@example.com", "password123", "Test User", {})).rejects.toMatchObject({
                statusCode: 409,
                message: "An account with this email already exists",
            });
            expect(prisma.user.create).not.toHaveBeenCalled();
        });
    });
    describe("loginUser", () => {
        it("should login a user with valid credentials", async () => {
            const passwordHash = await bcrypt.hash("password123", 12);
            vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
                id: "user-1",
                email: "test@example.com",
                passwordHash,
                displayName: "Test User",
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            vi.spyOn(prisma.session, "create").mockResolvedValue({
                id: "session-1",
                userId: "user-1",
                tokenHash: "token-hash",
                userAgent: "Vitest",
                ipAddress: "127.0.0.1",
                createdAt: new Date(),
                lastUsedAt: new Date(),
                expiresAt: new Date(Date.now() + 1000 * 60 * 60),
                revokedAt: null,
            });
            const result = await loginUser("  TEST@EXAMPLE.COM ", "password123", {
                userAgent: "Vitest",
                ipAddress: "127.0.0.1",
            });
            expect(result.user).toEqual({
                id: "user-1",
                email: "test@example.com",
                displayName: "Test User",
            });
            expect(result.sessionToken).toBeDefined();
            expect(result.sessionToken).toHaveLength(64);
            expect(prisma.session.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: "user-1",
                    userAgent: "Vitest",
                    ipAddress: "127.0.0.1",
                }),
            });
        });
        it("should reject login when the user does not exist", async () => {
            vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);
            vi.spyOn(prisma.session, "create");
            await expect(loginUser("unknown@example.com", "password123", {})).rejects.toMatchObject({
                statusCode: 401,
                message: "Invalid email or password",
            });
            expect(prisma.session.create).not.toHaveBeenCalled();
        });
        it("should reject login when the password is incorrect", async () => {
            const passwordHash = await bcrypt.hash("correct-password", 12);
            vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
                id: "user-1",
                email: "test@example.com",
                passwordHash,
                displayName: "Test User",
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            vi.spyOn(prisma.session, "create");
            await expect(loginUser("test@example.com", "wrong-password", {})).rejects.toMatchObject({
                statusCode: 401,
                message: "Invalid email or password",
            });
            expect(prisma.session.create).not.toHaveBeenCalled();
        });
    });
    describe("logoutUser", () => {
        it("should revoke the current session", async () => {
            const updateMany = vi
                .spyOn(prisma.session, "updateMany")
                .mockResolvedValue({
                count: 1,
            });
            await logoutUser("session-token-123");
            expect(updateMany).toHaveBeenCalledWith({
                where: {
                    tokenHash: expect.any(String),
                    revokedAt: null,
                },
                data: {
                    revokedAt: expect.any(Date),
                },
            });
        });
    });
    describe("getUserSessions", () => {
        it("should return active sessions for a user", async () => {
            const sessions = [
                {
                    id: "session-1",
                    userId: "user-1",
                    tokenHash: "token-hash",
                    userAgent: "Chrome",
                    ipAddress: "127.0.0.1",
                    createdAt: new Date(),
                    lastUsedAt: new Date(),
                    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
                    revokedAt: null,
                },
            ];
            const findMany = vi
                .spyOn(prisma.session, "findMany")
                .mockResolvedValue(sessions);
            const result = await getUserSessions("user-1");
            expect(result).toEqual(sessions);
            expect(findMany).toHaveBeenCalledWith({
                where: {
                    userId: "user-1",
                    revokedAt: null,
                    expiresAt: {
                        gt: expect.any(Date),
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
        });
    });
    describe("revokeSession", () => {
        it("should revoke a user's session", async () => {
            const updateMany = vi
                .spyOn(prisma.session, "updateMany")
                .mockResolvedValue({
                count: 1,
            });
            await revokeSession("user-1", "session-1");
            expect(updateMany).toHaveBeenCalledWith({
                where: {
                    id: "session-1",
                    userId: "user-1",
                    revokedAt: null,
                },
                data: {
                    revokedAt: expect.any(Date),
                },
            });
        });
        it("should throw 404 when the session does not exist", async () => {
            vi.spyOn(prisma.session, "updateMany").mockResolvedValue({
                count: 0,
            });
            await expect(revokeSession("user-1", "missing-session")).rejects.toMatchObject({
                statusCode: 404,
                message: "Session not found",
            });
        });
    });
    describe("logoutAllSessions", () => {
        it("should revoke all active sessions for a user", async () => {
            const updateMany = vi
                .spyOn(prisma.session, "updateMany")
                .mockResolvedValue({
                count: 3,
            });
            await logoutAllSessions("user-1");
            expect(updateMany).toHaveBeenCalledWith({
                where: {
                    userId: "user-1",
                    revokedAt: null,
                },
                data: {
                    revokedAt: expect.any(Date),
                },
            });
        });
    });
});
