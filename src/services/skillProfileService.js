import SkillProfile from "../models/SkillProfile.js";

export async function getUserSkills(userId) {
  return SkillProfile.find({
    userId
  }).select(
    "skill proficiencyScore proficiencyLevel"
  );
}