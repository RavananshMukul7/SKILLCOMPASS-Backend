const JOB_RELEVANT_SKILLS = new Set([
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
  "Swift",
  "Kotlin",
  "Dart",
  "React",
  "Angular",
  "Vue",
  "Node.js",
  "Express.js",
  "Django",
  "Flask",
  "Spring",
  "ASP.NET",
  "SQL",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "GCP"
]);

export function filterJobSearchSkills(skills) {
  return skills.filter((skill) =>
    JOB_RELEVANT_SKILLS.has(skill.skill)
  );
}