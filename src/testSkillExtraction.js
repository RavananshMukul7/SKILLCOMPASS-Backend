import dotenv from "dotenv";
import { extractSkills } from "./engines/skillExtractionEngine.js";

dotenv.config();

const repositoryPath = "./collected-data/A";

try {
  const result = await extractSkills(repositoryPath);

  console.log(
    JSON.stringify(result, null, 2)
  );
} catch (error) {
  console.error(
    "Skill extraction failed:",
    error.message
  );
}