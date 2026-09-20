import SkillProfile from "../models/SkillProfile.js";
import { searchJobsForSkills } from "../services/skillJobService.js";
import { rankJobs } from "../engines/jobRankingEngine.js";

export async function getJobs(req, res) {
  try {
    const { userId, location = "India" } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: "userId is required"
      });
    }

    const skills = await SkillProfile.find({
      userId
    }).select(
      "skill proficiencyScore proficiencyLevel"
    );

    const jobs = await searchJobsForSkills(
      skills,
      location
    );

    const rankedJobs = rankJobs(
      jobs,
      skills
    );

    res.json({
      location,
      jobs: rankedJobs
    });
  } catch (error) {
    console.error(
      error.response?.data ||
        error.message
    );

    res.status(500).json({
      error: "Failed to fetch jobs"
    });
  }
}