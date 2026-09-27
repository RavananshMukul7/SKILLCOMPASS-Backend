import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { createInstallationAccessToken } from "./githubInstallation.service.js";

interface GitHubRepositoryResponse {
  id: number;
  name: string;
  full_name: string;
  owner?: {
    login?: string;
  };
  default_branch: string | null;
  private: boolean;
  archived: boolean;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string | null;
  updated_at?: string | null;
}

interface GitHubRepositoryTreeItem {
  path: string;
  mode?: string;
  type: "blob" | "tree" | string;
  sha: string;
  size?: number;
  url?: string;
}

interface GitHubRepositoryTreeResponse {
  sha: string;
  truncated: boolean;
  tree: GitHubRepositoryTreeItem[];
}

interface GitHubFileResponse {
  name: string;
  path: string;
  sha: string;
  size: number;
  content: string;
  encoding: string;
}

interface GitHubInstallationRepositoriesResponse {
  total_count?: number;
  repositories?: GitHubRepositoryResponse[];
}

const githubHeaders = (token: string) => ({
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "X-GitHub-Api-Version": "2022-11-28",
});

export const getGitHubRepository = async (
  installationId: bigint,
  ownerLogin: string,
  repositoryName: string,
): Promise<GitHubRepositoryResponse> => {
  const { token } = await createInstallationAccessToken(installationId);

  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(
      ownerLogin,
    )}/${encodeURIComponent(repositoryName)}`,
    {
      headers: githubHeaders(token),
    },
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new AppError("GitHub repository not found", 404);
    }

    throw new AppError("Unable to fetch GitHub repository", 502);
  }

  return (await response.json()) as GitHubRepositoryResponse;
};

export const getGitHubRepositoryTree = async (
  installationId: bigint,
  ownerLogin: string,
  repositoryName: string,
  branch: string,
): Promise<GitHubRepositoryTreeResponse> => {
  const { token } = await createInstallationAccessToken(installationId);

  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(
      ownerLogin,
    )}/${encodeURIComponent(repositoryName)}/git/trees/${encodeURIComponent(
      branch,
    )}?recursive=1`,
    {
      headers: githubHeaders(token),
    },
  );

  if (!response.ok) {
    throw new AppError("Unable to fetch GitHub repository tree", 502);
  }

  return (await response.json()) as GitHubRepositoryTreeResponse;
};

export const getGitHubFileContent = async (
  installationId: bigint,
  ownerLogin: string,
  repositoryName: string,
  filePath: string,
  ref?: string,
): Promise<{
  name: string;
  path: string;
  sha: string;
  size: number;
  content: string;
}> => {
  const { token } = await createInstallationAccessToken(installationId);

  const refQuery = ref ? `?ref=${encodeURIComponent(ref)}` : "";

  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(
      ownerLogin,
    )}/${encodeURIComponent(
      repositoryName,
    )}/contents/${filePath}${refQuery}`,
    {
      headers: githubHeaders(token),
    },
  );

  if (!response.ok) {
    throw new AppError("Unable to fetch GitHub file content", 502);
  }

  const data = (await response.json()) as GitHubFileResponse;

  const content =
    data.encoding === "base64"
      ? Buffer.from(
          data.content.replace(/\n/g, ""),
          "base64",
        ).toString("utf8")
      : data.content;

  return {
    name: data.name,
    path: data.path,
    sha: data.sha,
    size: data.size,
    content,
  };
};

export const getGitHubRepositoryLanguages = async (
  installationId: bigint,
  ownerLogin: string,
  repositoryName: string,
): Promise<Record<string, number>> => {
  const { token } = await createInstallationAccessToken(installationId);

  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(
      ownerLogin,
    )}/${encodeURIComponent(repositoryName)}/languages`,
    {
      headers: githubHeaders(token),
    },
  );

  if (!response.ok) {
    throw new AppError("Unable to fetch GitHub repository languages", 502);
  }

  return (await response.json()) as Record<string, number>;
};

export const syncUserRepositories = async (userId: string) => {
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
    throw new AppError(
      "GitHub App installation is not available",
      400,
    );
  }

  const { token } = await createInstallationAccessToken(
    githubAccount.githubInstallationId,
  );

  const response = await fetch(
    "https://api.github.com/installation/repositories?per_page=100",
    {
      headers: githubHeaders(token),
    },
  );

  if (!response.ok) {
    throw new AppError(
      "Unable to fetch GitHub installation repositories",
      502,
    );
  }

  const data =
    (await response.json()) as GitHubInstallationRepositoriesResponse;

  const repositories = Array.isArray(data.repositories)
    ? data.repositories
    : [];

  const syncedAt = new Date();
  let synced = 0;

  /**
   * Important:
   *
   * GitHub repository ID and SkillCompass repository ID
   * are two different identifiers.
   *
   * GitHub:
   *   repository.id -> numeric GitHub ID
   *
   * SkillCompass:
   *   Repository.id -> PostgreSQL UUID
   *
   * The UUID must be returned to the frontend as `id`
   * because the analysis API expects a UUID.
   */
  const syncedRepositories: Array<{
    id: string;
    githubRepoId: number;
    name: string;
    fullName: string;
    ownerLogin: string;
    defaultBranch: string | null;
    isPrivate: boolean;
    archived: boolean;
    htmlUrl: string;
    description: string | null;
    stars: number;
    forks: number;
    pushedAt: string | null;
  }> = [];

  for (const repository of repositories) {
    const githubRepoId = BigInt(repository.id);

    const ownerLogin =
      repository.owner?.login ??
      repository.full_name.split("/")[0] ??
      "";

    const fullName =
      repository.full_name ||
      `${ownerLogin}/${repository.name}`;

    const defaultBranch = repository.default_branch ?? null;

    /**
     * Do not depend on a Prisma composite unique key here.
     * Find the repository by the user's ownership + GitHub repository ID.
     */
    const existingRepository = await prisma.repository.findFirst({
      where: {
        userId,
        githubRepoId,
      },
      select: {
        id: true,
      },
    });

    const repositoryData = {
      userId,
      githubAccountId: githubAccount.id,
      githubRepoId,
      name: repository.name,
      fullName,
      ownerLogin,
      defaultBranch,
      isPrivate: repository.private,
      archived: repository.archived,
      htmlUrl: repository.html_url,
      description: repository.description,
      stars: Number(repository.stargazers_count ?? 0),
      forks: Number(repository.forks_count ?? 0),
      pushedAt: repository.pushed_at
        ? new Date(repository.pushed_at)
        : null,
      lastSyncedAt: syncedAt,
    };

    let skillCompassRepositoryId: string;

    if (existingRepository) {
      await prisma.repository.update({
        where: {
          id: existingRepository.id,
        },
        data: {
          githubAccountId: repositoryData.githubAccountId,
          githubRepoId: repositoryData.githubRepoId,
          name: repositoryData.name,
          fullName: repositoryData.fullName,
          ownerLogin: repositoryData.ownerLogin,
          defaultBranch: repositoryData.defaultBranch,
          isPrivate: repositoryData.isPrivate,
          archived: repositoryData.archived,
          htmlUrl: repositoryData.htmlUrl,
          description: repositoryData.description,
          stars: repositoryData.stars,
          forks: repositoryData.forks,
          pushedAt: repositoryData.pushedAt,
          lastSyncedAt: repositoryData.lastSyncedAt,
        },
      });

      skillCompassRepositoryId = existingRepository.id;
    } else {
      const createdRepository = await prisma.repository.create({
        data: repositoryData,
        select: {
          id: true,
        },
      });

      skillCompassRepositoryId = createdRepository.id;
    }

    syncedRepositories.push({
      /**
       * THIS is the value the frontend must use for analysis.
       * It is the SkillCompass PostgreSQL UUID.
       */
      id: skillCompassRepositoryId,

      /**
       * Keep the original GitHub numeric ID separately.
       */
      githubRepoId: repository.id,

      name: repository.name,
      fullName,
      ownerLogin,
      defaultBranch,
      isPrivate: repository.private,
      archived: repository.archived,
      htmlUrl: repository.html_url,
      description: repository.description,
      stars: Number(repository.stargazers_count ?? 0),
      forks: Number(repository.forks_count ?? 0),
      pushedAt: repository.pushed_at,
    });

    synced += 1;
  }

  return {
    githubAccountId: githubAccount.id,
    githubUsername: githubAccount.username,
    totalAvailable: Number(
      data.total_count ?? repositories.length,
    ),
    synced,
    syncedAt,

    /**
     * `id` = SkillCompass Repository UUID
     * `githubRepoId` = GitHub numeric repository ID
     */
    repositories: syncedRepositories,
  };
};