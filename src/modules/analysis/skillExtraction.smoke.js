import { extractSkillsFromTechnologies, } from "./skillExtraction.service.js";
const technologies = [
    {
        technologyName: "JavaScript Classes",
        normalizedName: "javascript classes",
        confidence: 0.9,
        evidenceType: "CODE_PATTERN",
        evidenceValue: "JavaScript class syntax",
        path: "dummy-js.js",
    },
    {
        technologyName: "Async/Await",
        normalizedName: "async/await",
        confidence: 0.9,
        evidenceType: "CODE_PATTERN",
        evidenceValue: "async and await keywords",
        path: "dummy-js.js",
    },
    {
        technologyName: "JavaScript Array Methods",
        normalizedName: "javascript array methods",
        confidence: 0.9,
        evidenceType: "CODE_PATTERN",
        evidenceValue: "map/filter/reduce",
        path: "dummy-js.js",
    },
    {
        technologyName: "Python Functions",
        normalizedName: "python functions",
        confidence: 0.9,
        evidenceType: "CODE_PATTERN",
        evidenceValue: "Python function definition",
        path: "dummy-py.py",
    },
];
const skills = extractSkillsFromTechnologies(technologies);
console.log(JSON.stringify(skills, null, 2));
