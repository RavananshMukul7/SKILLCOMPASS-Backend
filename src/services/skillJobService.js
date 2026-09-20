import { searchJobs } from "./jobSearchService.js";
import { filterJobSearchSkills } from "./jobSkillFilter.js";
import { extractJobRequirements } from "./jobRequirementService.js";
import { validateJobRequirements } from "./jobRequirementValidator.js";
import { normalizeSkill } from "./skillTaxonomy.js";

export async function searchJobsForSkills(
  skills,
  location = "India"
) {
  const jobSkills = filterJobSearchSkills(skills);

  const allJobs = [];
  const seenJobs = new Set();

  for (const skill of jobSkills) {
    const query = `${skill.skill} Developer`;

    const jobs = await searchJobs({
      query,
      location
    });

    for (const job of jobs) {
      const jobId = String(job.id);

      // Avoid duplicate jobs when multiple
      // user skills return the same job.
      if (seenJobs.has(jobId)) {
        continue;
      }

      seenJobs.add(jobId);

      try {
        // -----------------------------------------
        // 1. Extract technical requirements
        // -----------------------------------------
        const requirementData =
          await extractJobRequirements(job);

        // -----------------------------------------
        // 2. Validate + normalize requirements
        // -----------------------------------------
        const validatedRequirements =
          validateJobRequirements(
            requirementData.skills || []
          );

        // -----------------------------------------
        // 3. Make sure the skill that caused
        //    the search is present.
        // -----------------------------------------
        const matchedSkillCanonical =
          normalizeSkill(skill.skill);

        const hasMatchedSkill =
          validatedRequirements.some(
            (requirement) =>
              normalizeSkill(
                requirement.skill
              ).toLowerCase() ===
              matchedSkillCanonical.toLowerCase()
          );

        if (!hasMatchedSkill) {
          validatedRequirements.unshift({
            skill: matchedSkillCanonical,
            importance: "mandatory",
            evidence:
              `Matched search skill: ${skill.skill}`
          });
        }

        // -----------------------------------------
        // 4. Store the enriched job
        // -----------------------------------------
        allJobs.push({
          ...job,

          // Skill from the user's profile that
          // caused this job search.
          matchedSkill: skill.skill,

          // Canonical + validated requirements.
          requiredSkills:
            validatedRequirements
        });
      } catch (error) {
        console.error(
          `Requirement extraction failed for job ${jobId}:`,
          error.message
        );

        // -----------------------------------------
        // Fallback:
        // Even if LLM extraction fails, don't
        // discard the job completely.
        // -----------------------------------------
        allJobs.push({
          ...job,
          matchedSkill: skill.skill,
          requiredSkills: [
            {
              skill: normalizeSkill(
                skill.skill
              ),
              importance: "mandatory",
              evidence:
                `Matched search skill: ${skill.skill}`
            }
          ]
        });
      }
    }
  }

  return allJobs;
}