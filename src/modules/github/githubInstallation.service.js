import { AppError } from "../../utils/AppError.js";
import { createGitHubAppJwt } from "./githubAppAuth.service.js";
export const createInstallationAccessToken = async (installationId) => {
    const appJwt = await createGitHubAppJwt();
    const response = await fetch(`https://api.github.com/app/installations/${installationId.toString()}/access_tokens`, {
        method: "POST",
        headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${appJwt}`,
            "X-GitHub-Api-Version": "2026-03-10",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            permissions: {
                metadata: "read",
                contents: "read",
            },
        }),
    });
    if (!response.ok) {
        const errorBody = await response.text();
        console.error("GitHub installation token error:", errorBody);
        throw new AppError("Unable to create GitHub installation access token", 502);
    }
    return (await response.json());
};
