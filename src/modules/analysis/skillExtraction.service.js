const addSkill = (skills, skill) => {
    const existing = skills.get(skill.normalizedName);
    if (!existing) {
        skills.set(skill.normalizedName, skill);
        return;
    }
    existing.confidence = Math.min(1, Math.max(existing.confidence, skill.confidence));
    for (const evidence of skill.evidence) {
        const alreadyExists = existing.evidence.some((item) => item.technologyName ===
            evidence.technologyName &&
            item.path === evidence.path);
        if (!alreadyExists) {
            existing.evidence.push({
                technologyName: evidence.technologyName,
                path: evidence.path,
                reasoning: evidence.reasoning,
            });
        }
    }
};
const createTechnologySkill = (technology, skillName, normalizedName, category, reasoning) => ({
    skillName,
    normalizedName,
    category,
    confidence: technology.confidence,
    evidence: [
        {
            technologyName: technology.technologyName,
            path: technology.path,
            reasoning,
        },
    ],
});
export const extractSkillsFromTechnologies = (technologies) => {
    const skills = new Map();
    for (const technology of technologies) {
        const technologyName = technology.normalizedName
            .trim()
            .toLowerCase();
        const path = technology.path;
        /*
         * --------------------------------------------------
         * PROGRAMMING LANGUAGES
         * --------------------------------------------------
         */
        if (technologyName === "javascript" ||
            technologyName.startsWith("javascript ")) {
            addSkill(skills, createTechnologySkill(technology, "JavaScript Programming", "javascript-programming", "PROGRAMMING", "The repository demonstrates JavaScript programming."));
        }
        if (technologyName === "typescript" ||
            technologyName.startsWith("typescript ")) {
            addSkill(skills, createTechnologySkill(technology, "TypeScript Programming", "typescript-programming", "PROGRAMMING", "The repository demonstrates TypeScript programming."));
        }
        if (technologyName === "python" ||
            technologyName.startsWith("python ")) {
            addSkill(skills, createTechnologySkill(technology, "Python Programming", "python-programming", "PROGRAMMING", "The repository demonstrates Python programming."));
        }
        if (technologyName === "java" ||
            technologyName.startsWith("java ")) {
            addSkill(skills, createTechnologySkill(technology, "Java Programming", "java-programming", "PROGRAMMING", "The repository demonstrates Java programming."));
        }
        if (technologyName === "c++" ||
            technologyName === "cpp" ||
            technologyName.startsWith("c++ ")) {
            addSkill(skills, createTechnologySkill(technology, "C++ Programming", "c++-programming", "PROGRAMMING", "The repository demonstrates C++ programming."));
        }
        if (technologyName === "c" ||
            technologyName.startsWith("c ")) {
            addSkill(skills, createTechnologySkill(technology, "C Programming", "c-programming", "PROGRAMMING", "The repository demonstrates C programming."));
        }
        if (technologyName === "go" ||
            technologyName === "golang") {
            addSkill(skills, createTechnologySkill(technology, "Go Programming", "go-programming", "PROGRAMMING", "The repository demonstrates Go programming."));
        }
        /*
         * --------------------------------------------------
         * WEB DEVELOPMENT
         * --------------------------------------------------
         */
        if (technologyName === "html" ||
            technologyName === "html5") {
            addSkill(skills, createTechnologySkill(technology, "HTML", "html", "WEB_DEVELOPMENT", "The repository contains HTML markup used to structure web pages."));
        }
        if (technologyName === "css" ||
            technologyName === "css3") {
            addSkill(skills, createTechnologySkill(technology, "CSS", "css", "WEB_DEVELOPMENT", "The repository demonstrates CSS styling for web interfaces."));
        }
        /*
         * --------------------------------------------------
         * JAVASCRIPT ECOSYSTEM
         * --------------------------------------------------
         */
        if (technologyName === "react" ||
            technologyName === "reactjs" ||
            technologyName === "react.js") {
            addSkill(skills, createTechnologySkill(technology, "React", "react", "FRONTEND", "The repository demonstrates the use of React for frontend development."));
        }
        if (technologyName === "node" ||
            technologyName === "node.js" ||
            technologyName === "nodejs") {
            addSkill(skills, createTechnologySkill(technology, "Node.js", "nodejs", "BACKEND", "The repository demonstrates Node.js backend/runtime development."));
        }
        if (technologyName === "express" ||
            technologyName === "express.js" ||
            technologyName === "expressjs") {
            addSkill(skills, createTechnologySkill(technology, "Express.js", "expressjs", "BACKEND", "The repository demonstrates backend development using Express.js."));
        }
        /*
         * --------------------------------------------------
         * DATABASES
         * --------------------------------------------------
         */
        if (technologyName === "postgresql" ||
            technologyName === "postgres" ||
            technologyName === "postgresql database") {
            addSkill(skills, createTechnologySkill(technology, "PostgreSQL", "postgresql", "DATABASE", "The repository demonstrates PostgreSQL database usage."));
        }
        if (technologyName === "mongodb" ||
            technologyName === "mongo") {
            addSkill(skills, createTechnologySkill(technology, "MongoDB", "mongodb", "DATABASE", "The repository demonstrates MongoDB database usage."));
        }
        if (technologyName === "mysql") {
            addSkill(skills, createTechnologySkill(technology, "MySQL", "mysql", "DATABASE", "The repository demonstrates MySQL database usage."));
        }
        if (technologyName === "prisma" ||
            technologyName === "prisma orm") {
            addSkill(skills, createTechnologySkill(technology, "Prisma ORM", "prisma-orm", "DATABASE", "The repository demonstrates database access using Prisma ORM."));
        }
        /*
         * --------------------------------------------------
         * API / BACKEND CONCEPTS
         * --------------------------------------------------
         */
        if (technologyName === "rest" ||
            technologyName === "rest api" ||
            technologyName === "restful api" ||
            technologyName === "restful apis") {
            addSkill(skills, createTechnologySkill(technology, "REST API Development", "rest-api-development", "BACKEND", "The repository demonstrates REST API development."));
        }
        if (technologyName === "graphql") {
            addSkill(skills, createTechnologySkill(technology, "GraphQL", "graphql", "API", "The repository demonstrates GraphQL API development."));
        }
        /*
         * --------------------------------------------------
         * VERSION CONTROL
         * --------------------------------------------------
         */
        if (technologyName === "git" ||
            technologyName === "git version control") {
            addSkill(skills, createTechnologySkill(technology, "Git", "git", "VERSION_CONTROL", "The repository demonstrates use of Git version control."));
        }
        if (technologyName === "github" ||
            technologyName === "github api") {
            addSkill(skills, createTechnologySkill(technology, "GitHub", "github", "DEVELOPER_TOOLS", "The repository demonstrates integration with GitHub."));
        }
        /*
         * --------------------------------------------------
         * OBJECT-ORIENTED PROGRAMMING
         * --------------------------------------------------
         */
        if (technologyName.includes("class") ||
            technologyName.includes("object")) {
            addSkill(skills, createTechnologySkill(technology, "Object-Oriented Programming", "object-oriented-programming", "PROGRAMMING_PARADIGM", "The source code demonstrates classes or object-oriented constructs."));
        }
        /*
         * --------------------------------------------------
         * ASYNCHRONOUS PROGRAMMING
         * --------------------------------------------------
         */
        if (technologyName.includes("async") ||
            technologyName.includes("await")) {
            addSkill(skills, createTechnologySkill(technology, "Asynchronous Programming", "asynchronous-programming", "PROGRAMMING_CONCEPT", "The source code demonstrates asynchronous execution patterns."));
        }
        /*
         * --------------------------------------------------
         * FUNCTIONAL PROGRAMMING
         * --------------------------------------------------
         */
        if (technologyName.includes("array method") ||
            technologyName.includes("map") ||
            technologyName.includes("filter") ||
            technologyName.includes("reduce")) {
            addSkill(skills, createTechnologySkill(technology, "Functional Programming", "functional-programming", "PROGRAMMING_PARADIGM", "The source code demonstrates functional collection-processing patterns such as map, filter, or reduce."));
        }
        /*
         * --------------------------------------------------
         * STANDARD LIBRARY
         * --------------------------------------------------
         */
        if (technologyName.includes("standard library") ||
            technologyName === "iostream" ||
            technologyName === "string") {
            addSkill(skills, createTechnologySkill(technology, "Standard Library Usage", "standard-library-usage", "PROGRAMMING", "The source code demonstrates usage of a language standard library."));
        }
        /*
         * --------------------------------------------------
         * FUNCTIONS / METHODS
         * --------------------------------------------------
         */
        if (technologyName.includes("function") ||
            technologyName.includes("method")) {
            addSkill(skills, createTechnologySkill(technology, "Function-Based Programming", "function-based-programming", "PROGRAMMING_CONCEPT", "The source code demonstrates reusable functions or methods."));
        }
    }
    return Array.from(skills.values());
};
