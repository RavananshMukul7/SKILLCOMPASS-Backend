import {
  normalizeSkills,
  normalizeSkill
} from "./skillTaxonomy.js";

const NON_TECHNICAL_PATTERNS = [
  "problem solving",
  "communication",
  "collaboration",
  "teamwork",
  "leadership",
  "data accuracy",
  "data consistency",
  "usability",
  "efficiency",
  "scalability",
  "innovation",
  "customer engagement",
  "business domain",
  "professional experience",
  "years of experience"
];

const TECHNICAL_SKILLS = new Set([
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C++",
  "C#",
  "Go",
  "Rust",
  "PHP",
  "Ruby",

  "React",
  "Angular",
  "Vue",
  "Node.js",
  "Express.js",
  "Django",
  "Flask",
  "Spring",
  "Spring Boot",

  "SQL",
  "MongoDB",
  "PostgreSQL",
  "MySQL",

  "Docker",
  "Kubernetes",

  "AWS",
  "Azure",
  "GCP",

  "Git",
  "GitHub",

  "Jenkins",
  "Kafka",
  "RabbitMQ",
  "Redis",

  "Linux",
  "REST APIs",
  "GraphQL",
  "WebSockets"
]);

const NON_CANONICAL_REQUIREMENTS = new Set([
  "full stack development",
  "full-stack development",
  "Back-end Development",
  "Front-end Development",
  "backend development",
  "frontend development",
  "databases",
  "cloud platforms",
  "data management",
  "data analytics",
  "problem solving",
  "independent work",
  "collaboration",
  "teamwork",
  "agile development",
  "scrum",
  "requirement gathering"
]);

function evidenceSupportsSkill(skill, evidence) {
  if (
    typeof skill !== "string" ||
    typeof evidence !== "string"
  ) {
    return false;
  }

  const invalidEvidence = [
    "not specified",
    "not mentioned",
    "not available",
    "not provided"
  ];

  const evidenceLower =
    evidence.toLowerCase().trim();

  if (
    invalidEvidence.some((phrase) =>
      evidenceLower.includes(phrase)
    )
  ) {
    return false;
  }

  const normalizedSkill =
    normalizeSkill(skill).toLowerCase();

  const normalizedEvidence =
    evidenceLower;

  const aliases = {
    "c++": ["c++", "cpp"],
    javascript: [
      "javascript",
      "js",
      "ecmascript"
    ],
    typescript: [
      "typescript",
      "ts"
    ],
    python: ["python"],
    java: ["java", "j2ee"],
    linux: ["linux"],
    git: ["git", "github"],
    "rest apis": [
      "rest",
      "restful",
      "api",
      "apis"
    ]
  };

  const acceptedTerms =
    aliases[normalizedSkill] || [
      normalizedSkill
    ];

  return acceptedTerms.some((term) =>
    normalizedEvidence.includes(term)
  );
}

export function validateJobRequirements(
  requirements
) {
  const normalized = requirements
    .filter(
      (requirement) =>
        requirement &&
        typeof requirement.skill === "string" &&
        typeof requirement.evidence === "string" &&
        requirement.evidence.trim().length > 0 &&
        evidenceSupportsSkill(
          requirement.skill,
          requirement.evidence
        )
    )
    .map((requirement) => ({
      skill: normalizeSkill(
        requirement.skill
      ),
      importance:
        requirement.importance === "mandatory"
          ? "mandatory"
          : "preferred",
      evidence:
        requirement.evidence.trim()
    }));

  const unique = new Map();

  for (const requirement of normalized) {
    const existing =
      unique.get(requirement.skill);

    if (!existing) {
      unique.set(
        requirement.skill,
        requirement
      );
      continue;
    }

    if (
      requirement.importance === "mandatory"
    ) {
      unique.set(
        requirement.skill,
        requirement
      );
    }
  }

  return [...unique.values()];
}