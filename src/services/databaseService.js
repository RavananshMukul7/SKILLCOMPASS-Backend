import User from "../models/User.js";
import Repository from "../models/Repository.js";
import SkillProfile from "../models/SkillProfile.js";

export async function saveUser(githubUser) {
  return User.findOneAndUpdate(
    { githubId: String(githubUser.id) },
    {
      githubId: String(githubUser.id),
      username: githubUser.login,
      name: githubUser.name,
      avatarUrl: githubUser.avatar_url
    },
    {
      returnDocument: "after",
      upsert: true
    }
  );
}

export async function saveRepository(
  userId,
  repository,
  sourceFiles
) {
  return Repository.findOneAndUpdate(
    { githubId: repository.id },
    {
      githubId: repository.id,
      userId,
      name: repository.name,
      fullName: repository.full_name,
      defaultBranch: repository.default_branch,
      sourceFiles
    },
    {
      returnDocument: "after",
      upsert: true
    }
  );
}

export async function saveSkillProfiles(
  userId,
  repositoryId,
  skills
) {
  const savedProfiles = [];

  for (const skill of skills) {
    const profile = await SkillProfile.findOneAndUpdate(
      {
        userId,
        repositoryId,
        skill: skill.skill
      },
      {
        userId,
        repositoryId,
        skill: skill.skill,
        evidence: skill.evidence,
        concepts: skill.concepts,
        occurrences: skill.occurrences,
        averageComplexity: skill.averageComplexity,
        averageConfidence: skill.averageConfidence,
        proficiencyScore: skill.proficiencyScore,
        proficiencyLevel: skill.proficiencyLevel,

        analysisVersion: skill.analysisVersion ?? "v1",
        model: skill.model ?? "qwen2.5-coder:7b",
        analysisTimestamp:
          skill.analysisTimestamp ?? new Date()
      },

      {
        returnDocument: "after",
        upsert: true
      }
    );

    savedProfiles.push(profile);
  }

  return savedProfiles;
}

export async function deleteRepositorySkillProfiles(
  userId,
  repositoryId
) {
  await SkillProfile.deleteMany({
    userId,
    repositoryId
  });
}