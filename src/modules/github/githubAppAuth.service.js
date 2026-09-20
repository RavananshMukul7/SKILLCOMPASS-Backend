import fs from "node:fs/promises";
import jwt from "jsonwebtoken";
import { githubConfig } from "../../config/github.js";
import { AppError } from "../../utils/AppError.js";
const GITHUB_API_BASE = "https://api.github.com";
const githubHeaders = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2026-03-10",
};
let cachedPrivateKey = null;
const getPrivateKey = async () => {
    if (cachedPrivateKey) {
        return cachedPrivateKey;
    }
    try {
        cachedPrivateKey = await fs.readFile(githubConfig.privateKeyPath, "utf8");
        return cachedPrivateKey;
    }
    catch {
        throw new AppError("GitHub App private key could not be loaded", 500);
    }
};
export const createGitHubAppJwt = async () => {
    const privateKey = await getPrivateKey();
    const now = Math.floor(Date.now() / 1000);
    try {
        return jwt.sign({
            iat: now - 60,
            exp: now + 9 * 60,
            iss: githubConfig.clientId,
        }, privateKey, {
            algorithm: "RS256",
        });
    }
    catch (error) {
        throw new AppError("Unable to create GitHub App authentication token", 500);
    }
};
export const findSkillCompassInstallation = async (githubUsername) => {
    const jwtToken = await createGitHubAppJwt();
    let response;
    try {
        response = await fetch(`${GITHUB_API_BASE}/users/${encodeURIComponent(githubUsername)}/installation`, {
            headers: {
                ...githubHeaders,
                Authorization: `Bearer ${jwtToken}`,
            },
        });
    }
    catch (error) {
        throw new AppError("Unable to connect to GitHub", 502);
    }
    if (response.status === 404) {
        throw new AppError("SkillCompass is not installed on this GitHub account", 400);
    }
    if (!response.ok) {
        throw new AppError("Unable to determine GitHub App installation", 502);
    }
    return (await response.json());
};
