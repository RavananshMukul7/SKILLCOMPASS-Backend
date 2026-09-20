import dotenv from "dotenv";
import { extractSkills } from "./engines/skillExtractionEngine.js";
import { estimateProficiency } from "./engines/proficiencyEngine.js";

dotenv.config();

const repositoryPath = "./collected-data/A";

try {
  const extractionResult =
    await extractSkills(repositoryPath);

  const proficiency =
    estimateProficiency(extractionResult.skills);

  console.log(
    JSON.stringify(proficiency, null, 2)
  );
} catch (error) {
  console.error(
    "Proficiency estimation failed:",
    error.message
  );
}