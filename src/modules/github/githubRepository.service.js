import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { createInstallationAccessToken } from "./githubInstallation.service.js";
const githubHeaders = (token) => ({
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2026-03-10",
});
export const getGitHubRepository = async (installationId, ownerLogin, repositoryName) => {
    const { token } = await createInstallationAccessToken(installationId);
    const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(ownerLogin)}/${encodeURIComponent(repositoryName)}`, {
        method: "GET",
        headers: githubHeaders(token),
    });
    if (!response.ok) {
        const errorBody = await response.text();
        console.error("GitHub repository fetch error:", errorBody);
        throw new AppError("Unable to fetch GitHub repository", response.status === 404 ? 404 : 502);
    }
    return (await response.json());
};
export const getGitHubRepositoryTree = async (installationId, ownerLogin, repositoryName, branch) => {
    const { token } = await createInstallationAccessToken(installationId);
    const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(ownerLogin)}/${encodeURIComponent(repositoryName)}/git/trees/${encodeURIComponent(branch)}?recursive=1`, {
        method: "GET",
        headers: githubHeaders(token),
    });
    if (!response.ok) {
        const errorBody = await response.text();
        console.error("GitHub repository tree fetch error:", errorBody);
        throw new AppError("Unable to fetch GitHub repository tree", response.status === 404 ? 404 : 502);
    }
    return (await response.json());
};
export const getGitHubFileContent = async (installationId, ownerLogin, repositoryName, filePath) => {
    const { token } = await createInstallationAccessToken(installationId);
    const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(ownerLogin)}/${encodeURIComponent(repositoryName)}/contents/${filePath
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`, {
        method: "GET",
        headers: githubHeaders(token),
    });
    if (!response.ok) {
        const errorBody = await response.text();
        console.error("GitHub file fetch error:", errorBody);
        throw new AppError("Unable to fetch GitHub file", response.status === 404 ? 404 : 502);
    }
    const data = (await response.json());
    const decodedContent = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
    return {
        ...data,
        content: decodedContent,
    };
};
export const getGitHubRepositoryLanguages = async (installationId, ownerLogin, repositoryName) => {
    const { token } = await createInstallationAccessToken(installationId);
    const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(ownerLogin)}/${encodeURIComponent(repositoryName)}/languages`, {
        method: "GET",
        headers: githubHeaders(token),
    });
    if (!response.ok) {
        const errorBody = await response.text();
        console.error("GitHub repository languages fetch error:", errorBody);
        throw new AppError("Unable to fetch GitHub repository languages", response.status === 404 ? 404 : 502);
    }
    return (await response.json());
};
export const syncUserRepositories = async (userId) => {
    const githubAccount = await prisma.gitHubAccount.findUnique({
        where: {
            userId,
        },
        select: {
            id: true,
            username: true,
            githubInstallationId: true,
        },
    });
    if (!githubAccount) {
        throw new AppError("GitHub account is not connected", 400);
    }
    if (githubAccount.githubInstallationId === null) {
        throw new AppError("GitHub App installation is not available", 400);
    }
    const { token } = await createInstallationAccessToken(githubAccount.githubInstallationId);
    const response = await fetch("https://api.github.com/installation/repositories?per_page=100", {
        method: "GET",
        headers: githubHeaders(token),
    });
    if (!response.ok) {
        const errorBody = await response.text();
        console.error("GitHub installation repositories fetch error:", errorBody);
        throw new AppError("Unable to fetch GitHub installation repositories", response.status === 404 ? 404 : 502);
    }
    const data = (await response.json());
    const syncedAt = new Date();
    const repositories = data.repositories;
    for (const repository of repositories) {
        const ownerLogin = repository.full_name.split("/")[0] ?? githubAccount.username;
        await prisma.repository.upsert({
            where: {
                githubRepoId: BigInt(repository.id),
            },
            create: {
                githubAccountId: githubAccount.id,
                githubRepoId: BigInt(repository.id),
                name: repository.name,
                fullName: repository.full_name,
                ownerLogin,
                defaultBranch: repository.default_branch,
                isPrivate: repository.private,
                archived: repository.archived,
                htmlUrl: repository.html_url,
                description: repository.description,
                stars: repository.stargazers_count,
                forks: repository.forks_count,
                pushedAt: repository.pushed_at
                    ? new Date(repository.pushed_at)
                    : null,
                lastSyncedAt: syncedAt,
            },
            update: {
                githubAccountId: githubAccount.id,
                name: repository.name,
                fullName: repository.full_name,
                ownerLogin,
                defaultBranch: repository.default_branch,
                isPrivate: repository.private,
                archived: repository.archived,
                htmlUrl: repository.html_url,
                description: repository.description,
                stars: repository.stargazers_count,
                forks: repository.forks_count,
                pushedAt: repository.pushed_at
                    ? new Date(repository.pushed_at)
                    : null,
                lastSyncedAt: syncedAt,
            },
        });
    }
    return {
        githubAccountId: githubAccount.id,
        githubUsername: githubAccount.username,
        totalAvailable: data.total_count,
        synced: repositories.length,
        syncedAt,
    };
};
