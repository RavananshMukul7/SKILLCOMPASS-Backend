import axios from "axios";

export async function downloadSourceFile(
  accessToken,
  repository,
  filePath
) {
  const response = await axios.get(
    `https://api.github.com/repos/${repository.full_name}/contents/${encodeURIComponent(filePath)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      }
    }
  );

  if (response.data.type !== "file") {
    throw new Error(`Not a file: ${filePath}`);
  }

  return {
    path: filePath,
    content: Buffer.from(
      response.data.content,
      "base64"
    ).toString("utf-8")
  };
}