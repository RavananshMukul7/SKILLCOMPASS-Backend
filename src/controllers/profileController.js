import User from "../models/User.js";
import Repository from "../models/Repository.js";
import SkillProfile from "../models/SkillProfile.js";

export async function getProfile(req, res) {
  try {
    const userId = req.query.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    const repositories = await Repository.find({
      userId
    });

    const skills = await SkillProfile.find({
      userId
    });

    res.json({
      user,
      repositories,
      skills
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch profile"
    });
  }
}