export interface ExtractedJobSkill {
  skillName: string;
  normalizedName: string;
  category: string;
  requirementType: "REQUIRED" | "PREFERRED";
  importance: number;
}

interface SkillRule {
  patterns: RegExp[];
  skillName: string;
  normalizedName: string;
  category: string;
  importance: number;
}

const SKILL_RULES: SkillRule[] = [
  {
    patterns: [
      /\bjavascript\b/i,
      /\bjs\b/i,
      /\bnode\.?js\b/i,
    ],
    skillName: "JavaScript Programming",
    normalizedName: "javascript-programming",
    category: "PROGRAMMING_LANGUAGE",
    importance: 0.9,
  },

  {
    patterns: [
      /\btypescript\b/i,
      /\bts\b/i,
    ],
    skillName: "TypeScript",
    normalizedName: "typescript",
    category: "PROGRAMMING_LANGUAGE",
    importance: 0.8,
  },

  {
    patterns: [
      /\bpython\b/i,
    ],
    skillName: "Python Programming",
    normalizedName: "python-programming",
    category: "PROGRAMMING_LANGUAGE",
    importance: 0.9,
  },

  {
    patterns: [
      /\bc\+\+\b/i,
      /\bcpp\b/i,
    ],
    skillName: "C++ Programming",
    normalizedName: "cpp-programming",
    category: "PROGRAMMING_LANGUAGE",
    importance: 0.9,
  },

  {
    patterns: [
      /\bjava\b/i,
    ],
    skillName: "Java Programming",
    normalizedName: "java-programming",
    category: "PROGRAMMING_LANGUAGE",
    importance: 0.9,
  },

  {
    patterns: [
      /\boop\b/i,
      /\bobject[- ]oriented programming\b/i,
      /\bobject[- ]oriented design\b/i,
    ],
    skillName: "Object-Oriented Programming",
    normalizedName: "object-oriented-programming",
    category: "PROGRAMMING_CONCEPT",
    importance: 0.8,
  },

  {
    patterns: [
      /\basync(?:hronous)?\b/i,
      /\basynchronous programming\b/i,
      /\basync\/await\b/i,
    ],
    skillName: "Async",
    normalizedName: "async",
    category: "PROGRAMMING_CONCEPT",
    importance: 0.6,
  },

  {
    patterns: [
      /\bfunctional programming\b/i,
      /\bfunctional programming concepts\b/i,
      /\bfunctional programming paradigm\b/i,
    ],
    skillName: "Functional Programming",
    normalizedName: "functional-programming",
    category: "PROGRAMMING_CONCEPT",
    importance: 0.6,
  },

  {
    patterns: [
      /\bnode\.?js\b/i,
      /\bnode\b/i,
    ],
    skillName: "Node.js",
    normalizedName: "nodejs",
    category: "BACKEND",
    importance: 0.9,
  },

  {
    patterns: [
      /\breact\b/i,
      /\breact\.js\b/i,
      /\breactjs\b/i,
    ],
    skillName: "React",
    normalizedName: "react",
    category: "FRONTEND",
    importance: 0.8,
  },

  {
    patterns: [
      /\bexpress\.?js\b/i,
      /\bexpressjs\b/i,
      /\bexpress framework\b/i,
    ],
    skillName: "Express.js",
    normalizedName: "expressjs",
    category: "BACKEND",
    importance: 0.7,
  },

  {
    patterns: [
      /\bpostgresql\b/i,
      /\bpostgres\b/i,
    ],
    skillName: "PostgreSQL",
    normalizedName: "postgresql",
    category: "DATABASE",
    importance: 0.8,
  },

  {
    patterns: [
      /\bmongodb\b/i,
      /\bmongo\b/i,
    ],
    skillName: "MongoDB",
    normalizedName: "mongodb",
    category: "DATABASE",
    importance: 0.8,
  },

  {
    patterns: [
      /\brest\s+(?:api|apis)\b/i,
      /\brestful\s+(?:api|apis)\b/i,
      /\brestful services?\b/i,
      /\brest services?\b/i,
    ],
    skillName: "REST APIs",
    normalizedName: "rest-apis",
    category: "API",
    importance: 0.8,
  },

  {
    patterns: [
      /\bgraphql\b/i,
    ],
    skillName: "GraphQL",
    normalizedName: "graphql",
    category: "API",
    importance: 0.7,
  },

  {
    patterns: [
      /\bdocker\b/i,
      /\bcontainers?\b/i,
      /\bcontainerization\b/i,
    ],
    skillName: "Docker",
    normalizedName: "docker",
    category: "DEVOPS",
    importance: 0.7,
  },

  {
    patterns: [
      /\bkubernetes\b/i,
      /\bk8s\b/i,
    ],
    skillName: "Kubernetes",
    normalizedName: "kubernetes",
    category: "DEVOPS",
    importance: 0.6,
  },

  {
    patterns: [
      /\bgit\b/i,
      /\bgithub\b/i,
      /\bgitlab\b/i,
    ],
    skillName: "Git",
    normalizedName: "git",
    category: "DEVELOPER_TOOLS",
    importance: 0.5,
  },

  {
    patterns: [
      /\bphp\b/i,
    ],
    skillName: "PHP",
    normalizedName: "php",
    category: "PROGRAMMING_LANGUAGE",
    importance: 0.7,
  },

  {
    patterns: [
      /\blaravel\b/i,
    ],
    skillName: "Laravel",
    normalizedName: "laravel",
    category: "BACKEND_FRAMEWORK",
    importance: 0.7,
  },

  {
    patterns: [
      /\bartificial intelligence\b/i,
      /\bai\b/i,
      /\bmachine intelligence\b/i,
    ],
    skillName: "Artificial Intelligence",
    normalizedName: "artificial-intelligence",
    category: "AI",
    importance: 0.7,
  },

  {
    patterns: [
      /\bembedded systems?\b/i,
      /\bembedded software\b/i,
      /\bembedded engineer(?:ing)?\b/i,
      /\bembedded development\b/i,
    ],
    skillName: "Embedded Systems",
    normalizedName: "embedded-systems",
    category: "SYSTEMS",
    importance: 0.7,
  },

  {
    patterns: [
      /\bsdet\b/i,
      /\bsoftware development engineer in test\b/i,
      /\bsoftware development engineer in testing\b/i,
      /\bsoftware tester\b/i,
      /\bsoftware testing\b/i,
    ],
    skillName: "Software Testing",
    normalizedName: "software-testing",
    category: "TESTING",
    importance: 0.7,
  },

  {
    patterns: [
      /\bsoftware development life cycle\b/i,
      /\bsoftware development lifecycle\b/i,
      /\bsdlc\b/i,
    ],
    skillName: "Software Development Lifecycle",
    normalizedName: "software-development-lifecycle",
    category: "SOFTWARE_ENGINEERING",
    importance: 0.5,
  },

  {
    patterns: [
      /\bsql\b/i,
      /\bstructured query language\b/i,
    ],
    skillName: "SQL",
    normalizedName: "sql",
    category: "DATABASE",
    importance: 0.7,
  },

  {
    patterns: [
      /\baws\b/i,
      /\bamazon web services\b/i,
    ],
    skillName: "AWS",
    normalizedName: "aws",
    category: "CLOUD",
    importance: 0.6,
  },

  {
    patterns: [
      /\bazure\b/i,
      /\bmicrosoft azure\b/i,
    ],
    skillName: "Microsoft Azure",
    normalizedName: "microsoft-azure",
    category: "CLOUD",
    importance: 0.6,
  },

  {
    patterns: [
      /\bgoogle cloud\b/i,
      /\bgoogle cloud platform\b/i,
      /\bgcp\b/i,
    ],
    skillName: "Google Cloud",
    normalizedName: "google-cloud",
    category: "CLOUD",
    importance: 0.6,
  },

  {
    patterns: [
      /\bsoftware security\b/i,
      /\bsecure software development\b/i,
      /\bapplication security\b/i,
      /\bsecure coding\b/i,
    ],
    skillName: "Software Security",
    normalizedName: "software-security",
    category: "SECURITY",
    importance: 0.6,
  },

  {
    patterns: [
      /\bsoftware development\b/i,
      /\bsoftware engineering\b/i,
    ],
    skillName: "Software Development",
    normalizedName: "software-development",
    category: "SOFTWARE_ENGINEERING",
    importance: 0.6,
  },

  {
    patterns: [
      /\bsoftware development manager\b/i,
      /\bsoftware engineering manager\b/i,
    ],
    skillName: "Software Engineering Management",
    normalizedName: "software-engineering-management",
    category: "SOFTWARE_ENGINEERING",
    importance: 0.5,
  },

  {
    patterns: [
      /\bapi development\b/i,
      /\bapi integration\b/i,
    ],
    skillName: "API Development",
    normalizedName: "api-development",
    category: "API",
    importance: 0.7,
  },

  {
    patterns: [
      /\bbackend development\b/i,
      /\bback-end development\b/i,
      /\bbackend engineering\b/i,
      /\bback-end engineering\b/i,
    ],
    skillName: "Backend Development",
    normalizedName: "backend-development",
    category: "BACKEND",
    importance: 0.8,
  },

  {
    patterns: [
      /\bfrontend development\b/i,
      /\bfront-end development\b/i,
      /\bfrontend engineering\b/i,
      /\bfront-end engineering\b/i,
    ],
    skillName: "Frontend Development",
    normalizedName: "frontend-development",
    category: "FRONTEND",
    importance: 0.8,
  },

  {
    patterns: [
      /\bfull[- ]stack development\b/i,
      /\bfull[- ]stack engineering\b/i,
      /\bfullstack development\b/i,
    ],
    skillName: "Full Stack Development",
    normalizedName: "full-stack-development",
    category: "SOFTWARE_ENGINEERING",
    importance: 0.8,
  },
];

const PREFERRED_SECTION_PATTERNS = [
  /\bpreferred\b/i,
  /\bnice to have\b/i,
  /\bgood to have\b/i,
  /\bbonus\b/i,
  /\boptional\b/i,
  /\bdesired skills?\b/i,
  /\badditional skills?\b/i,
];

const REQUIRED_SECTION_PATTERNS = [
  /^\s*(?:required|required skills|required qualifications|mandatory|requirements?)\s*:?\s*$/i,
  /\bmandatory\b/i,
  /\bmust have\b/i,
  /\bminimum requirements?\b/i,
  /\bessential skills?\b/i,
  /\brequired qualifications?\b/i,
];

const PREFERRED_INLINE_PATTERNS = [
  /\bpreferred\b/i,
  /\bnice to have\b/i,
  /\bgood to have\b/i,
  /\bbonus\b/i,
  /\boptional\b/i,
  /\bis a plus\b/i,
  /\bwould be a plus\b/i,
  /\ba plus\b/i,
];

const REQUIRED_INLINE_PATTERNS = [
  /\brequired\b/i,
  /\bmust\b/i,
  /\bmandatory\b/i,
  /\bminimum\b/i,
  /\bneed(?:ed)?\b/i,
  /\bshould have\b/i,
  /\bessential\b/i,
];

const detectRequirementType = (
  text: string,
  skillPatterns: RegExp[]
): "REQUIRED" | "PREFERRED" => {
  const lines = text.split(/\r?\n/);

  let currentSection: "REQUIRED" | "PREFERRED" = "REQUIRED";

  let preferredEvidence = false;
  let requiredEvidence = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    const isPreferredSection =
      PREFERRED_SECTION_PATTERNS.some((pattern) =>
        pattern.test(line)
      );

    const isRequiredSection =
      REQUIRED_SECTION_PATTERNS.some((pattern) =>
        pattern.test(line)
      );

    if (isPreferredSection) {
      currentSection = "PREFERRED";
      continue;
    }

    if (isRequiredSection) {
      currentSection = "REQUIRED";
      continue;
    }

    const skillAppearsOnLine = skillPatterns.some((pattern) =>
      pattern.test(line)
    );

    if (!skillAppearsOnLine) {
      continue;
    }

    const hasPreferredInline =
      PREFERRED_INLINE_PATTERNS.some((pattern) =>
        pattern.test(line)
      );

    const hasRequiredInline =
      REQUIRED_INLINE_PATTERNS.some((pattern) =>
        pattern.test(line)
      );

    if (hasPreferredInline) {
      preferredEvidence = true;
      continue;
    }

    if (hasRequiredInline) {
      requiredEvidence = true;
      continue;
    }

    if (currentSection === "PREFERRED") {
      preferredEvidence = true;
    } else {
      requiredEvidence = true;
    }
  }

  if (preferredEvidence && !requiredEvidence) {
    return "PREFERRED";
  }

  if (requiredEvidence) {
    return "REQUIRED";
  }

  return "REQUIRED";
};

export const extractJobSkills = (
  title: string,
  description: string | null | undefined
): ExtractedJobSkill[] => {
  const text = `${title}\n${description ?? ""}`;

  const extracted = new Map<string, ExtractedJobSkill>();

  for (const rule of SKILL_RULES) {
    const matched = rule.patterns.some((pattern) =>
      pattern.test(text)
    );

    if (!matched) {
      continue;
    }

    const requirementType = detectRequirementType(
      text,
      rule.patterns
    );

    extracted.set(rule.normalizedName, {
      skillName: rule.skillName,
      normalizedName: rule.normalizedName,
      category: rule.category,
      requirementType,
      importance:
        requirementType === "PREFERRED"
          ? Math.min(rule.importance, 0.6)
          : rule.importance,
    });
  }

  return Array.from(extracted.values());
};