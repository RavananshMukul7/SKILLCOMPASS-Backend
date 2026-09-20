import { extractJobSkills } from "../modules/jobs/jobSkillExtraction.service.js";
const main = () => {
    const title = "Node.js Backend Developer Intern";
    const description = `
    We are looking for a backend developer intern with strong
    JavaScript and Node.js experience.

    Required:
    - JavaScript
    - Node.js
    - REST APIs
    - Object-oriented programming

    Preferred:
    - Python
    - Docker
    - PostgreSQL

    Experience with asynchronous programming is a plus.
  `;
    const skills = extractJobSkills(title, description);
    console.log("EXTRACTED JOB SKILLS:");
    console.dir(skills, {
        depth: null,
    });
};
main();
