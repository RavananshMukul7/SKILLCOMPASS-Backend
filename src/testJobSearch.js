import dotenv from "dotenv";
import { searchJobs } from "./services/jobSearchService.js";

dotenv.config();

try {
  const jobs = await searchJobs({
    query: "JavaScript Developer",
    location: "India"
  });

  console.log(
    JSON.stringify(jobs, null, 2)
  );
} catch (error) {
  console.error(
    "Job search failed:",
    error.response?.data || error.message
  );
}