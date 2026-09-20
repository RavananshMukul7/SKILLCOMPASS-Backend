import { SESSION_COOKIE_NAME, } from "../../config/session.js";
import { getUserSessions, loginUser, logoutAllSessions, logoutUser, registerUser, revokeSession, } from "./auth.service.js";
const getClientIp = (req) => {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
        return forwarded
            .split(",")[0]
            ?.trim();
    }
    return req.socket.remoteAddress;
};
const setSessionCookie = (res, sessionToken, expiresAt) => {
    res.cookie(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: expiresAt,
        path: "/",
    });
};
const clearSessionCookie = (res) => {
    res.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });
};
export const register = async (req, res) => {
    const { email, password, displayName, } = res.locals.validated.body;
    const result = await registerUser(email, password, displayName, {
        userAgent: req.get("user-agent") ??
            undefined,
        ipAddress: getClientIp(req),
    });
    setSessionCookie(res, result.sessionToken, result.expiresAt);
    res.status(201).json({
        success: true,
        data: {
            user: result.user,
        },
    });
};
export const login = async (req, res) => {
    const { email, password, } = res.locals.validated.body;
    const result = await loginUser(email, password, {
        userAgent: req.get("user-agent") ??
            undefined,
        ipAddress: getClientIp(req),
    });
    setSessionCookie(res, result.sessionToken, result.expiresAt);
    res.status(200).json({
        success: true,
        data: {
            user: result.user,
        },
    });
};
export const me = async (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            user: req.user,
        },
    });
};
export const logout = async (req, res) => {
    const sessionToken = req.cookies?.SESSION_COOKIE_NAME;
    if (sessionToken) {
        await logoutUser(sessionToken);
    }
    clearSessionCookie(res);
    res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
};
export const sessions = async (req, res) => {
    const userSessions = await getUserSessions(req.user.id);
    res.status(200).json({
        success: true,
        data: userSessions,
    });
};
export const revokeUserSession = async (req, res) => {
    await revokeSession(req.user.id, req.params.sessionId);
    res.status(204).send();
};
export const logoutAll = async (req, res) => {
    await logoutAllSessions(req.user.id);
    clearSessionCookie(res);
    res.status(200).json({
        success: true,
        message: "All sessions revoked",
    });
};
