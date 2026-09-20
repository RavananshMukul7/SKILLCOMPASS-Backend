import crypto from "node:crypto";
import { prisma } from "../../config/prisma.js";
import { githubConfig } from "../../config/github.js";
import { decrypt, encrypt, } from "../../utils/encryption.js";
import { AppError } from "../../utils/AppError.js";
import { findSkillCompassInstallation, } from "./githubAppAuth.service.js";
const OAUTH_STATE_DURATION_MS = 1000 * 60 * 10; // 10 minutes
const createRandomToken = (bytes = 32) => {
    return crypto
        .randomBytes(bytes)
        .toString("base64url");
};
const hashState = (state) => {
    return crypto
        .createHash("sha256")
        .update(state)
        .digest("hex");
};
const createCodeChallenge = (verifier) => {
    return crypto
        .createHash("sha256")
        .update(verifier)
        .digest("base64url");
};
const githubApiHeaders = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2026-03-10",
};
export const createGitHubAuthorizationUrl = async (userId) => {
    const state = createRandomToken(32);
    const codeVerifier = createRandomToken(32);
    const codeChallenge = createCodeChallenge(codeVerifier);
    const stateHash = hashState(state);
    await prisma.gitHubOAuthState.create({
        data: {
            userId,
            stateHash,
            codeVerifierEncrypted: encrypt(codeVerifier),
            expiresAt: new Date(Date.now() +
                OAUTH_STATE_DURATION_MS),
        },
    });
    const params = new URLSearchParams({
        client_id: githubConfig.clientId,
        redirect_uri: githubConfig.callbackUrl,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        allow_signup: "false",
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
};
const exchangeAuthorizationCode = async (code, codeVerifier) => {
    let response;
    try {
        response = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                client_id: githubConfig.clientId,
                client_secret: githubConfig.clientSecret,
                code,
                redirect_uri: githubConfig.callbackUrl,
                code_verifier: codeVerifier,
            }),
        });
    }
    catch {
        throw new AppError("Unable to connect to GitHub", 502);
    }
    if (!response.ok) {
        throw new AppError("GitHub authorization code exchange failed", 502);
    }
    const data = (await response.json());
    if (!data.access_token) {
        throw new AppError("GitHub did not return an access token", 502);
    }
    return data;
};
const getGitHubUser = async (accessToken) => {
    let response;
    try {
        response = await fetch("https://api.github.com/user", {
            headers: {
                ...githubApiHeaders,
                Authorization: `Bearer ${accessToken}`,
            },
        });
    }
    catch {
        throw new AppError("Unable to connect to GitHub", 502);
    }
    if (!response.ok) {
        throw new AppError("Unable to retrieve GitHub user", 502);
    }
    return (await response.json());
};
export const handleGitHubCallback = async (code, state) => {
    const stateHash = hashState(state);
    const oauthState = await prisma.gitHubOAuthState.findUnique({
        where: {
            stateHash,
        },
    });
    if (!oauthState) {
        throw new AppError("Invalid GitHub OAuth state", 400);
    }
    if (oauthState.consumedAt) {
        throw new AppError("GitHub OAuth state has already been used", 400);
    }
    if (oauthState.expiresAt <=
        new Date()) {
        throw new AppError("GitHub OAuth state has expired", 400);
    }
    /*
     * Consume the state before exchanging
     * the authorization code.
     *
     * This prevents the same OAuth state
     * from being successfully processed twice.
     */
    const consumedState = await prisma.gitHubOAuthState.updateMany({
        where: {
            id: oauthState.id,
            consumedAt: null,
            expiresAt: {
                gt: new Date(),
            },
        },
        data: {
            consumedAt: new Date(),
        },
    });
    if (consumedState.count !== 1) {
        throw new AppError("GitHub OAuth state is no longer valid", 400);
    }
    const userId = oauthState.userId;
    const codeVerifier = decrypt(oauthState.codeVerifierEncrypted);
    const token = await exchangeAuthorizationCode(code, codeVerifier);
    const githubUser = await getGitHubUser(token.access_token);
    /*
     * Check whether this GitHub account
     * is already connected to another
     * SkillCompass account.
     */
    const existingGitHubAccount = await prisma.gitHubAccount.findUnique({
        where: {
            githubUserId: BigInt(githubUser.id),
        },
        select: {
            id: true,
            userId: true,
        },
    });
    if (existingGitHubAccount &&
        existingGitHubAccount.userId !==
            userId) {
        throw new AppError("This GitHub account is already connected to another SkillCompass account", 409);
    }
    const installation = await findSkillCompassInstallation(githubUser.login);
    const accessTokenExpiresAt = token.expires_in !== undefined
        ? new Date(Date.now() +
            token.expires_in * 1000)
        : null;
    const refreshTokenExpiresAt = token.refresh_token_expires_in !==
        undefined
        ? new Date(Date.now() +
            token.refresh_token_expires_in *
                1000)
        : null;
    /*
     * Create the GitHub account if the
     * SkillCompass user does not have one.
     *
     * Otherwise update the existing
     * connection.
     */
    const githubAccount = await prisma.gitHubAccount.upsert({
        where: {
            userId,
        },
        create: {
            userId,
            githubUserId: BigInt(githubUser.id),
            username: githubUser.login,
            avatarUrl: githubUser.avatar_url,
            githubInstallationId: BigInt(installation.id),
            accessTokenEncrypted: encrypt(token.access_token),
            refreshTokenEncrypted: token.refresh_token
                ? encrypt(token.refresh_token)
                : null,
            accessTokenExpiresAt,
            refreshTokenExpiresAt,
        },
        update: {
            githubUserId: BigInt(githubUser.id),
            username: githubUser.login,
            avatarUrl: githubUser.avatar_url,
            githubInstallationId: BigInt(installation.id),
            accessTokenEncrypted: encrypt(token.access_token),
            ...(token.refresh_token
                ? {
                    refreshTokenEncrypted: encrypt(token.refresh_token),
                }
                : {}),
            accessTokenExpiresAt,
            refreshTokenExpiresAt,
        },
    });
    return githubAccount;
};
