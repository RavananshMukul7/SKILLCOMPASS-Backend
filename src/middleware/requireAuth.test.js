import { afterEach, describe, expect, it, vi, } from "vitest";
import { requireAuth } from "./requireAuth.js";
import { prisma } from "../config/prisma.js";
describe("requireAuth", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });
    const createResponse = () => ({
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    });
    it("should return 401 when no session cookie exists", async () => {
        const req = {
            cookies: {},
        };
        const res = createResponse();
        const next = vi.fn();
        await requireAuth(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Authentication required",
        });
        expect(next).not.toHaveBeenCalled();
    });
    it("should return 401 when the session is invalid or expired", async () => {
        const req = {
            cookies: {
                session: "invalid-session-token",
            },
        };
        const res = createResponse();
        const next = vi.fn();
        vi.spyOn(prisma.session, "findFirst")
            .mockResolvedValue(null);
        await requireAuth(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Invalid or expired session",
        });
        expect(next).not.toHaveBeenCalled();
    });
    it("should authenticate a valid session", async () => {
        const req = {
            cookies: {
                session: "valid-session-token",
            },
        };
        const res = createResponse();
        const next = vi.fn();
        const user = {
            id: "user-123",
            email: "user@example.com",
            displayName: "Test User",
        };
        vi.spyOn(prisma.session, "findFirst")
            .mockResolvedValue({
            id: "session-123",
            tokenHash: "hashed-token",
            revokedAt: null,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            lastUsedAt: new Date(),
            user,
        });
        vi.spyOn(prisma.session, "update")
            .mockResolvedValue({});
        await requireAuth(req, res, next);
        expect(req.user).toEqual(user);
        expect(next).toHaveBeenCalledTimes(1);
        expect(prisma.session.update)
            .toHaveBeenCalledWith({
            where: {
                id: "session-123",
            },
            data: {
                lastUsedAt: expect.any(Date),
            },
        });
    });
    it("should query Prisma using a hashed session token", async () => {
        const req = {
            cookies: {
                session: "my-secret-session-token",
            },
        };
        const res = createResponse();
        const next = vi.fn();
        vi.spyOn(prisma.session, "findFirst")
            .mockResolvedValue(null);
        await requireAuth(req, res, next);
        expect(prisma.session.findFirst).toHaveBeenCalledWith({
            where: {
                tokenHash: expect.any(String),
                revokedAt: null,
                expiresAt: {
                    gt: expect.any(Date),
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
        const call = vi.mocked(prisma.session.findFirst).mock.calls[0][0];
        expect(call?.where?.tokenHash).not.toBe("my-secret-session-token");
    });
    it("should pass database errors to next", async () => {
        const req = {
            cookies: {
                session: "valid-session-token",
            },
        };
        const res = createResponse();
        const next = vi.fn();
        const databaseError = new Error("Database unavailable");
        vi.spyOn(prisma.session, "findFirst")
            .mockRejectedValue(databaseError);
        await requireAuth(req, res, next);
        expect(next).toHaveBeenCalledWith(databaseError);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });
});
