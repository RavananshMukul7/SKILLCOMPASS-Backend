import { calculateProficiencies, } from "./proficiency.service.js";
const skills = [
    {
        skillName: "JavaScript Programming",
        normalizedName: "javascript-programming",
        category: "PROGRAMMING",
        confidence: 0.95,
        evidence: [
            {
                technologyName: "JavaScript Classes",
                path: "dummy-js.js",
                reasoning: "JavaScript classes detected.",
            },
            {
                technologyName: "JavaScript Array Methods",
                path: "dummy-js.js",
                reasoning: "Array methods detected.",
            },
        ],
    },
    {
        skillName: "Object-Oriented Programming",
        normalizedName: "object-oriented-programming",
        category: "PROGRAMMING_PARADIGM",
        confidence: 0.95,
        evidence: [
            {
                technologyName: "Java Classes",
                path: "dummy-java.java",
                reasoning: "Java classes detected.",
            },
            {
                technologyName: "JavaScript Classes",
                path: "dummy-js.js",
                reasoning: "JavaScript classes detected.",
            },
        ],
    },
    {
        skillName: "Asynchronous Programming",
        normalizedName: "asynchronous-programming",
        category: "PROGRAMMING_CONCEPT",
        confidence: 0.95,
        evidence: [
            {
                technologyName: "Async/Await",
                path: "dummy-js.js",
                reasoning: "Async/await detected.",
            },
        ],
    },
];
const results = calculateProficiencies(skills);
console.log(JSON.stringify(results, null, 2));
