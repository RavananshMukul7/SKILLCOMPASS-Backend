import dotenv from "dotenv";
import { getUserSkills } from "./services/skillProfileService.js";
import { searchJobsForSkills } from "./services/skillJobService.js";
import { connectDatabase } from "./config/database.js";
import { rankJobs } from "./engines/jobRankingEngine.js";

dotenv.config();

await connectDatabase();

const USER_ID = "6a805e746ed4fc39e796ef1b";

try {
  const skills = await getUserSkills(USER_ID);

  const jobs = await searchJobsForSkills(
    skills,
    "India"
  );

  const rankedJobs = rankJobs(
    jobs,
    skills
  );

  console.log(
    JSON.stringify(rankedJobs, null, 2)
  );
} catch (error) {
  console.error(
    "Skill-based job search failed:",
    error.response?.data || error.message
  );
}