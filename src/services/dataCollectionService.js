import fs from "fs/promises";
import path from "path";
import { downloadSourceFile } from "./githubFileService.js";

const COLLECTION_DIR = path.resolve("collected-data");

export async function collectRepositorySource(
  accessToken,
  repository,
  sourceFiles
) {
  const repositoryDir = path.join(
    COLLECTION_DIR,
    repository.name
  );

  await fs.mkdir(repositoryDir, {
    recursive: true
  });

  for (const file of sourceFiles) {
    const sourceFile = await downloadSourceFile(
      accessToken,
      repository,
      file.path
    );

    const outputPath = path.join(
      repositoryDir,
      file.path
    );

    await fs.mkdir(path.dirname(outputPath), {
      recursive: true
    });

    await fs.writeFile(
      outputPath,
      sourceFile.content,
      "utf-8"
    );
  }

  return repositoryDir;
}