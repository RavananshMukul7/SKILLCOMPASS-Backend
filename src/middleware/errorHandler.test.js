import { describe, expect, it, vi } from "vitest";
import { AppError } from "../utils/AppError.js";
import { Prisma } from "@prisma/client";
import { errorHandler } from "./errorHandler.js";
import { z } from "zod";
describe("errorHandler", () => {
    it("should return 400 for malformed JSON", () => {
        const req = {
            method: "POST",
            originalUrl: "/api/test",
        };
        const res = {
            headersSent: false,
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
        const next = vi.fn();
        const error = {
            type: "entity.parse.failed",
        };
        errorHandler(error, req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Invalid JSON request body",
        });
    });
    it("should return 413 when request body is too large", () => {
        const req = {
            method: "POST",
            originalUrl: "/api/test",
        };
        const res = {
            headersSent: false,
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
        const next = vi.fn();
        const error = {
            type: "entity.too.large",
        };
        errorHandler(error, req, res, next);
        expect(res.status).toHaveBeenCalledWith(413);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Request body is too large",
        });
    });
    it("should return 500 for an unexpected error", () => {
        const req = {
            method: "GET",
            originalUrl: "/api/test",
        };
        const res = {
            headersSent: false,
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
        const next = vi.fn();
        const error = new Error("Something unexpected happened");
        errorHandler(error, req, res, next);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Internal server error",
        });
    });
    it("should return 500 for a Prisma database error", () => {
        const req = {
            method: "GET",
            originalUrl: "/api/test",
        };
        const res = {
            headersSent: false,
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
        const next = vi.fn();
        const error = new Prisma.PrismaClientKnownRequestError("Database failure", {
            code: "P1001",
            clientVersion: "7.10.0",
        });
        errorHandler(error, req, res, next);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "A database error occurred",
        });
    });
    it("should return the status code and message for an AppError", () => {
        const req = {
            method: "GET",
            originalUrl: "/api/test",
        };
        const res = {
            headersSent: false,
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
        const next = vi.fn();
        const error = new AppError("Authentication required", 401);
        errorHandler(error, req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Authentication required",
        });
    });
    it("should return 400 for Zod validation errors", () => {
        const req = {
            method: "GET",
            originalUrl: "/api/test",
        };
        const res = {
            headersSent: false,
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
        const next = vi.fn();
        const schema = z.object({
            email: z.email(),
        });
        let error;
        try {
            schema.parse({
                email: "invalid-email",
            });
        }
        catch (err) {
            error = err;
        }
        errorHandler(error, req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Validation failed",
            errors: expect.any(Array),
        });
    });
    it("should pass the error to next when headers were already sent", () => {
        const req = {
            method: "GET",
            originalUrl: "/api/test",
        };
        const res = {
            headersSent: true,
            status: vi.fn(),
            json: vi.fn(),
        };
        const next = vi.fn();
        const error = new Error("Headers already sent");
        errorHandler(error, req, res, next);
        expect(next).toHaveBeenCalledWith(error);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });
});
