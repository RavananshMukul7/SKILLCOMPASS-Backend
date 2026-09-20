import { afterEach, describe, expect, it, vi, } from "vitest";
vi.mock("../config/github.js", () => ({
    githubConfig: {
        encryptionKey: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    },
}));
import { decrypt, encrypt, } from "./encryption.js";
describe("encryption utilities", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });
    it("should encrypt and decrypt a token correctly", () => {
        const plaintext = "github-secret-token-123";
        const encrypted = encrypt(plaintext);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(plaintext);
    });
    it("should produce a valid three-part encrypted payload", () => {
        const encrypted = encrypt("test-token");
        const parts = encrypted.split(".");
        expect(parts).toHaveLength(3);
        expect(parts[0]).toBeTruthy();
        expect(parts[1]).toBeTruthy();
        expect(parts[2]).toBeTruthy();
    });
    it("should produce different ciphertexts for the same plaintext", () => {
        const plaintext = "same-token";
        const encrypted1 = encrypt(plaintext);
        const encrypted2 = encrypt(plaintext);
        expect(encrypted1).not.toBe(encrypted2);
    });
    it("should reject an invalid encrypted payload", () => {
        expect(() => decrypt("invalid-payload")).toThrow("Invalid encrypted payload");
    });
    it("should reject a payload with missing encrypted data", () => {
        expect(() => decrypt("iv.authTag.")).toThrow("Invalid encrypted payload");
    });
    it("should reject tampered encrypted data", () => {
        const encrypted = encrypt("secret-token");
        const parts = encrypted.split(".");
        parts[2] =
            `${parts[2]}tampered`;
        expect(() => decrypt(parts.join("."))).toThrow();
    });
});
