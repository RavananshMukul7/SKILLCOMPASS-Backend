const SKILL_TAXONOMY = {
  JavaScript: [
    "javascript",
    "js",
    "ecmascript"
  ],

  TypeScript: [
    "typescript",
    "ts"
  ],

  Python: [
    "python",
    "python programming language",
    "python scripting"
  ],

  Java: [
    "java",
    "core java",
    "java 8",
    "java 11",
    "java 17",
    "java 8/11/17",
    "java ee",
    "java se",
    "j2ee"
  ],

  SQL: [
    "sql",
    "sql databases",
    "relational databases"
  ],

  "REST APIs": [
    "rest api",
    "rest apis",
    "restful api",
    "restful apis"
  ],

  Git: [
    "git",
    "version control",
    "version control tools",
    "version control tools (git, svn)"
  ],

  "C++": [
    "c++",
    "cpp"
  ],

  React: [
    "react",
    "react.js",
    "reactjs"
  ],

  Angular: [
    "angular",
    "angular.js",
    "angularjs"
  ],

  Vue: [
    "vue",
    "vue.js",
    "vuejs"
  ],

  "Node.js": [
    "node",
    "node.js",
    "nodejs"
  ],

  "Express.js": [
    "express",
    "express.js",
    "expressjs"
  ],

  Django: [
    "django"
  ],

  Flask: [
    "flask"
  ],

  "Spring Boot": [
    "spring boot"
  ],

  Spring: [
    "spring",
    "spring framework",
    "spring mvc",
    "spring data"
  ],

  MongoDB: [
    "mongodb",
    "mongo"
  ],

  PostgreSQL: [
    "postgresql",
    "postgres"
  ],

  Docker: [
    "docker"
  ],

  Kubernetes: [
    "kubernetes",
    "k8s"
  ],

  AWS: [
    "aws",
    "amazon web services"
  ],

  Azure: [
    "azure",
    "microsoft azure"
  ],

  GCP: [
    "gcp",
    "google cloud",
    "google cloud platform"
  ],

  GitHub: [
    "github"
  ],

  Jenkins: [
    "jenkins"
  ],

  Kafka: [
    "kafka",
    "apache kafka"
  ],

  Redis: [
    "redis"
  ],

  Linux: [
    "linux",
    "linux operating systems",
    "linux environment"
  ],

  "TCP/IP": [
    "tcp/ip",
    "tcp",
    "ip"
  ],

  UDP: [
    "udp"
  ],

  RTOS: [
    "rtos",
    "real-time operating system"
  ],

  "Embedded Systems": [
    "embedded systems",
    "embedded system",
    "bare-metal"
  ],

  "DO-178C": [
    "do-178c"
  ],

  ARP4754: [
    "arp4754"
  ],

  "Microcontroller Architecture": [
    "microcontroller",
    "microcontroller architecture",
    "microcontroller/microprocessor architecture",
    "microcontroller/microprocessor architectures"
  ],

  Debugging: [
    "debugging",
    "debugging tools"
  ],

  "Performance Optimization": [
    "performance tuning",
    "performance optimization",
    "performance optimization techniques"
  ]
};

export function normalizeSkill(skill) {
  
  const rawSkill =
    typeof skill === "string"
      ? skill
      : skill?.skill;

  if (
    typeof rawSkill !== "string" ||
    !rawSkill.trim()
  ) {
    return typeof skill === "object"
      ? skill
      : "";
  }

  const normalized = rawSkill
    .toLowerCase()
    .trim();

  for (const [canonical, aliases] of Object.entries(
    SKILL_TAXONOMY
  )) {
    if (
      aliases.some(
        (alias) =>
          normalized === alias ||
          normalized.includes(alias)
      )
    ) {
      return canonical;
    }
  }

  return rawSkill.trim();
}

export function normalizeSkills(skills) {
  return [
    ...new Set(
      skills.map((skill) => {
        if (typeof skill === "string") {
          return normalizeSkill(skill);
        }

        return normalizeSkill(skill.skill);
      })
    )
  ];
}