import fs from "node:fs";
import path from "node:path";
const requiredGitHubEnv = (name) => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required GitHub environment variable: ${name}`);
    }
    return value;
};
const requiredEncryptionKey = () => {
    const value = requiredGitHubEnv("GITHUB_TOKEN_ENCRYPTION_KEY");
    const decoded = Buffer.from(value, "base64");
    if (decoded.length !== 32) {
        throw new Error("GITHUB_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes");
    }
    return value;
};
const appId = requiredGitHubEnv("GITHUB_APP_ID");
if (!/^\d+$/.test(appId)) {
    throw new Error("GITHUB_APP_ID must contain only digits");
}
const callbackUrl = requiredGitHubEnv("GITHUB_CALLBACK_URL");
try {
    new URL(callbackUrl);
}
catch {
    throw new Error("GITHUB_CALLBACK_URL must be a valid URL");
}
const privateKeyPath = path.resolve(process.cwd(), requiredGitHubEnv("GITHUB_APP_PRIVATE_KEY_PATH"));
if (!fs.existsSync(privateKeyPath)) {
    throw new Error("GITHUB_APP_PRIVATE_KEY_PATH does not point to an existing file");
}
export const githubConfig = {
    appId,
    clientId: requiredGitHubEnv("GITHUB_CLIENT_ID"),
    clientSecret: requiredGitHubEnv("GITHUB_CLIENT_SECRET"),
    callbackUrl,
    encryptionKey: requiredEncryptionKey(),
    privateKeyPath,
};
