import { afterEach, describe, expect, it, vi, } from "vitest";
import fs from "node:fs";
vi.mock("node:fs", () => ({
    default: {
        existsSync: vi.fn(),
    },
}));
describe("GitHub configuration", () => {
    const originalEnv = process.env;
    afterEach(() => {
        process.env = originalEnv;
        vi.resetModules();
        vi.clearAllMocks();
    });
    const validEnvironment = {
        GITHUB_APP_ID: "123456",
        GITHUB_CLIENT_ID: "test-client-id",
        GITHUB_CLIENT_SECRET: "test-client-secret",
        GITHUB_CALLBACK_URL: "http://localhost:3000/api/github/callback",
        GITHUB_TOKEN_ENCRYPTION_KEY: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        GITHUB_APP_PRIVATE_KEY_PATH: "test-private-key.pem",
    };
    it("should load valid GitHub configuration", async () => {
        process.env = {
            ...originalEnv,
            ...validEnvironment,
        };
        vi.mocked(fs.existsSync).mockReturnValue(true);
        const { githubConfig } = await import("./github.js");
        expect(githubConfig.appId).toBe("123456");
        expect(githubConfig.clientId).toBe("test-client-id");
        expect(githubConfig.clientSecret).toBe("test-client-secret");
        expect(githubConfig.callbackUrl).toBe("http://localhost:3000/api/github/callback");
        expect(githubConfig.encryptionKey).toBe(validEnvironment.GITHUB_TOKEN_ENCRYPTION_KEY);
    });
    it("should reject a non-numeric GitHub App ID", async () => {
        process.env = {
            ...originalEnv,
            ...validEnvironment,
            GITHUB_APP_ID: "abc",
        };
        vi.mocked(fs.existsSync).mockReturnValue(true);
        await expect(import("./github.js")).rejects.toThrow("GITHUB_APP_ID must contain only digits");
    });
    it("should reject an invalid callback URL", async () => {
        process.env = {
            ...originalEnv,
            ...validEnvironment,
            GITHUB_CALLBACK_URL: "not-a-url",
        };
        vi.mocked(fs.existsSync).mockReturnValue(true);
        await expect(import("./github.js")).rejects.toThrow("GITHUB_CALLBACK_URL must be a valid URL");
    });
    it("should reject an encryption key that is not 32 bytes", async () => {
        process.env = {
            ...originalEnv,
            ...validEnvironment,
            GITHUB_TOKEN_ENCRYPTION_KEY: "dGVzdA==",
        };
        vi.mocked(fs.existsSync).mockReturnValue(true);
        await expect(import("./github.js")).rejects.toThrow("GITHUB_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes");
    });
    it("should reject a missing private key file", async () => {
        process.env = {
            ...originalEnv,
            ...validEnvironment,
        };
        vi.mocked(fs.existsSync).mockReturnValue(false);
        await expect(import("./github.js")).rejects.toThrow("GITHUB_APP_PRIVATE_KEY_PATH does not point to an existing file");
    });
});
