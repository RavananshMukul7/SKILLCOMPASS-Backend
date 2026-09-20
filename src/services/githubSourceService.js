import axios from "axios";

const SOURCE_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".java",
  ".c",
  ".h",
  ".cpp",
  ".cc",
  ".cxx",
  ".hpp",
  ".cs",
  ".go",
  ".rs",
  ".rb",
  ".php",
  ".swift",
  ".kt",
  ".kts",
  ".scala",
  ".dart",
  ".lua",
  ".r",
  ".m",
  ".mm",
  ".sh",
  ".bash",
  ".zsh",
  ".sql",
  ".html",
  ".css",
  ".scss",
  ".sass",
  ".vue",
  ".svelte"
]);

const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".git",
  ".next",
  ".nuxt",
  "vendor",
  "target",
  "out"
]);

function isSourceFile(path) {
  const parts = path.split("/");

  if (
    parts.some((part) =>
      IGNORED_DIRECTORIES.has(part)
    )
  ) {
    return false;
  }

  const fileName = parts.at(-1);
  const lastDot = fileName.lastIndexOf(".");

  if (lastDot === -1) {
    return false;
  }

  const extension = fileName
    .slice(lastDot)
    .toLowerCase();

  return SOURCE_EXTENSIONS.has(extension);
}

export async function getSourceFiles(accessToken, repository) {
  if (!repository.default_branch) {
    return [];
  }

  try {
    const response = await axios.get(
      `https://api.github.com/repos/${repository.full_name}/git/trees/${repository.default_branch}`,
      {
        params: {
          recursive: 1
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28"
        }
      }
    );

    return response.data.tree
      .filter((item) => item.type === "blob")
      .filter((item) => isSourceFile(item.path))
      .map((item) => ({
        path: item.path,
        sha: item.sha,
        size: item.size
      }));
  } catch (error) {
    if (error.response?.status === 409) {
      return [];
    }

    throw error;
  }
}