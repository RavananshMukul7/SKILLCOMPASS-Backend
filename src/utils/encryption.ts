import crypto from "node:crypto";
import { githubConfig } from "../config/github.js";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;

const getKey = (): Buffer => {
  const key = Buffer.from(
    githubConfig.encryptionKey,
    "base64"
  );

  if (key.length !== KEY_LENGTH) {
    throw new Error(
      "GITHUB_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes"
    );
  }

  return key;
};

export const encrypt = (
  plaintext: string
): string => {
  const iv = crypto.randomBytes(12);
  const key = getKey();

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    key,
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
};

export const decrypt = (
  payload: string
): string => {
  const [ivBase64, authTagBase64, encryptedBase64] =
    payload.split(".");

  if (
    !ivBase64 ||
    !authTagBase64 ||
    !encryptedBase64
  ) {
    throw new Error("Invalid encrypted payload");
  }

  const key = getKey();

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivBase64, "base64")
  );

  decipher.setAuthTag(
    Buffer.from(authTagBase64, "base64")
  );

  const decrypted = Buffer.concat([
    decipher.update(
      Buffer.from(encryptedBase64, "base64")
    ),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};