import { afterEach, describe, expect, it, vi, } from "vitest";
import { register, login, me, logout, sessions, revokeUserSession, logoutAll, } from "./auth.controller.js";
import { registerUser, loginUser, logoutUser, getUserSessions, revokeSession, logoutAllSessions, } from "./auth.service.js";
vi.mock("./auth.service.js", () => ({
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
    getUserSessions: vi.fn(),
    revokeSession: vi.fn(),
    logoutAllSessions: vi.fn(),
}));
describe("auth controllers", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });
    const createResponse = () => {
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            cookie: vi.fn().mockReturnThis(),
            clearCookie: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
        };
        return res;
    };
    it("should register a user and set the session cookie", async () => {
        const req = {
            headers: {
                "user-agent": "Vitest",
            },
            socket: {
                remoteAddress: "127.0.0.1",
            },
            get: (name) => name === "user-agent"
                ? "Vitest"
                : undefined,
        };
        const res = createResponse();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        vi.mocked(registerUser).mockResolvedValue({
            user: {
                id: "user-123",
                email: "test@example.com",
                displayName: "Test User",
            },
            sessionToken: "session-token",
            expiresAt,
        });
        res.locals = {
            validated: {
                body: {
                    email: "test@example.com",
                    password: "password123",
                    displayName: "Test User",
                },
            },
        };
        await register(req, res);
        expect(registerUser).toHaveBeenCalledWith("test@example.com", "password123", "Test User", {
            userAgent: "Vitest",
            ipAddress: "127.0.0.1",
        });
        expect(res.cookie).toHaveBeenCalledWith("session", "session-token", expect.objectContaining({
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            expires: expiresAt,
        }));
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: {
                user: {
                    id: "user-123",
                    email: "test@example.com",
                    displayName: "Test User",
                },
            },
        });
    });
    it("should login a user and set the session cookie", async () => {
        const req = {
            headers: {
                "user-agent": "Vitest",
            },
            socket: {
                remoteAddress: "127.0.0.1",
            },
            get: (name) => name === "user-agent"
                ? "Vitest"
                : undefined,
        };
        const res = createResponse();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        vi.mocked(loginUser).mockResolvedValue({
            user: {
                id: "user-123",
                email: "test@example.com",
                displayName: "Test User",
            },
            sessionToken: "login-session-token",
            expiresAt,
        });
        res.locals = {
            validated: {
                body: {
                    email: "test@example.com",
                    password: "password123",
                },
            },
        };
        await login(req, res);
        expect(loginUser).toHaveBeenCalledWith("test@example.com", "password123", {
            userAgent: "Vitest",
            ipAddress: "127.0.0.1",
        });
        expect(res.cookie).toHaveBeenCalledWith("session", "login-session-token", expect.objectContaining({
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            expires: expiresAt,
        }));
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: {
                user: {
                    id: "user-123",
                    email: "test@example.com",
                    displayName: "Test User",
                },
            },
        });
    });
    it("should return the authenticated user", async () => {
        const req = {
            user: {
                id: "user-123",
                email: "test@example.com",
                displayName: "Test User",
            },
        };
        const res = createResponse();
        await me(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: {
                user: req.user,
            },
        });
    });
    it("should logout the current session", async () => {
        const req = {
            cookies: {
                SESSION_COOKIE_NAME: "session-token",
            },
        };
        const res = createResponse();
        await logout(req, res);
        expect(logoutUser).toHaveBeenCalledWith("session-token");
        expect(res.clearCookie).toHaveBeenCalledWith("session", expect.objectContaining({
            httpOnly: true,
            sameSite: "lax",
            path: "/",
        }));
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Logged out successfully",
        });
    });
    it("should logout successfully even when no session cookie exists", async () => {
        const req = {
            cookies: {},
        };
        const res = createResponse();
        await logout(req, res);
        expect(logoutUser).not.toHaveBeenCalled();
        expect(res.clearCookie).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Logged out successfully",
        });
    });
    it("should return the user's sessions", async () => {
        const req = {
            user: {
                id: "user-123",
            },
        };
        const res = createResponse();
        const userSessions = [
            {
                id: "session-1",
                userAgent: "Chrome",
            },
            {
                id: "session-2",
                userAgent: "Firefox",
            },
        ];
        vi.mocked(getUserSessions).mockResolvedValue(userSessions);
        await sessions(req, res);
        expect(getUserSessions).toHaveBeenCalledWith("user-123");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: userSessions,
        });
    });
    it("should revoke a specific user session", async () => {
        const req = {
            user: {
                id: "user-123",
            },
            params: {
                sessionId: "session-456",
            },
        };
        const res = createResponse();
        await revokeUserSession(req, res);
        expect(revokeSession).toHaveBeenCalledWith("user-123", "session-456");
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.send).toHaveBeenCalled();
    });
    it("should revoke all sessions and clear the session cookie", async () => {
        const req = {
            user: {
                id: "user-123",
            },
        };
        const res = createResponse();
        await logoutAll(req, res);
        expect(logoutAllSessions).toHaveBeenCalledWith("user-123");
        expect(res.clearCookie).toHaveBeenCalledWith("session", expect.objectContaining({
            httpOnly: true,
            sameSite: "lax",
            path: "/",
        }));
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "All sessions revoked",
        });
    });
});
