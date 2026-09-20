import axios from "axios";

export async function getUserRepositories(accessToken) {
  const repositories = [];

  let page = 1;

  while (true) {
    const response = await axios.get(
      "https://api.github.com/user/repos",
      {
        params: {
          visibility: "public",
          affiliation: "owner",
          per_page: 100,
          page
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28"
        }
      }
    );

    repositories.push(...response.data);

    if (response.data.length < 100) {
      break;
    }

    page++;
  }

  return repositories;
}