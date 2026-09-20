import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";
import { env } from "../config/env.js";
const isObject = (value) => {
    return (typeof value === "object" &&
        value !== null);
};
const getErrorMessage = (error) => {
    if (error instanceof Error) {
        return error.message;
    }
    if (isObject(error) &&
        typeof error.message === "string") {
        return error.message;
    }
    return "Internal server error";
};
const getErrorStatusCode = (error) => {
    if (isObject(error) &&
        typeof error.statusCode === "number" &&
        Number.isInteger(error.statusCode) &&
        error.statusCode >= 400 &&
        error.statusCode <= 599) {
        return error.statusCode;
    }
    if (isObject(error) &&
        typeof error.status === "number" &&
        Number.isInteger(error.status) &&
        error.status >= 400 &&
        error.status <= 599) {
        return error.status;
    }
    return 500;
};
const isMalformedJsonError = (error) => {
    if (!isObject(error)) {
        return false;
    }
    return (error.type === "entity.parse.failed" ||
        (error instanceof SyntaxError &&
            typeof error.message === "string" &&
            error.message
                .toLowerCase()
                .includes("json")));
};
const isRequestBodyTooLargeError = (error) => {
    if (!isObject(error)) {
        return false;
    }
    return (error.type === "entity.too.large" ||
        getErrorStatusCode(error) === 413);
};
const sanitizePath = (req) => {
    return req.originalUrl || req.url || "/";
};
export const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        next(err);
        return;
    }
    // Malformed JSON
    if (isMalformedJsonError(err)) {
        console.warn(`Malformed JSON request: ${req.method} ${sanitizePath(req)}`);
        res.status(400).json({
            success: false,
            message: "Invalid JSON request body",
        });
        return;
    }
    // Request body too large
    if (isRequestBodyTooLargeError(err)) {
        console.warn(`Request body too large: ${req.method} ${sanitizePath(req)}`);
        res.status(413).json({
            success: false,
            message: "Request body is too large",
        });
        return;
    }
    // Zod validation errors
    if (err instanceof ZodError) {
        res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: err.issues,
        });
        return;
    }
    // Application errors
    if (err instanceof AppError) {
        if (env.NODE_ENV !== "production") {
            console.warn(`[${err.statusCode}] ${req.method} ${sanitizePath(req)} - ${err.message}`);
        }
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
        return;
    }
    // Prisma database errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        console.error(`Prisma error: ${req.method} ${sanitizePath(req)}`, err);
        res.status(500).json({
            success: false,
            message: "A database error occurred",
        });
        return;
    }
    // Other known 4xx errors
    const statusCode = getErrorStatusCode(err);
    if (statusCode >= 400 &&
        statusCode < 500) {
        const message = getErrorMessage(err);
        console.warn(`[${statusCode}] ${req.method} ${sanitizePath(req)} - ${message}`);
        res.status(statusCode).json({
            success: false,
            message,
        });
        return;
    }
    // Unexpected errors
    console.error(`UNEXPECTED ERROR: ${req.method} ${sanitizePath(req)}`, err);
    res.status(500).json({
        success: false,
        message: "Internal server error",
    });
};
