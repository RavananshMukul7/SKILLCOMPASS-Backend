import axios from "axios";

const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "qwen2.5-coder:7b";

const requirementSchema = {
  type: "object",
  properties: {
    skills: {
      type: "array",
      items: {
        type: "object",
        properties: {
          skill: {
            type: "string"
          },
          importance: {
            type: "string",
            enum: ["mandatory", "preferred"]
          },
          evidence: {
            type: "string"
          }
        },
        required: ["skill", "importance", "evidence"]
      }
    }
  },
  required: ["skills"]
};

const ALLOWED_SKILLS = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C++",
  "C#",
  "React",
  "Angular",
  "Vue",
  "Node.js",
  "Express.js",
  "Django",
  "Flask",
  "Spring",
  "Spring Boot",
  "MongoDB",
  "PostgreSQL",
  "SQL",
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
  "Redis",
  "Linux",
  "REST APIs",
  "GraphQL",
  "WebSockets",
  "TCP/IP",
  "UDP",
  "RTOS",
  "Embedded Systems",
  "DO-178C",
  "ARP4754",
  "Microcontroller Architecture",
  "Debugging",
  "Performance Optimization"
];

export async function extractJobRequirements(job) {
  const response = await axios.post(OLLAMA_URL, {
    model: MODEL,
    stream: false,
    format: requirementSchema,
    messages: [
      {
        role: "system",
        content: `
          You are the Job Requirement Extraction Engine for SkillCompass.

          Extract ONLY concrete technical skills from the job description.

          You may ONLY use skills from this allowed taxonomy:

          ${ALLOWED_SKILLS.join(", ")}

          For every skill, return:

          1. skill
          2. importance
          3. evidence

          importance:
          - mandatory = explicitly required, must-have, essential, or strongly required
          - preferred = preferred, desirable, optional, or an advantage

          evidence MUST be an exact or near-exact phrase from the job description
          that supports the extracted skill.

          Do NOT invent evidence.
          Do NOT infer a skill without supporting evidence.

          Ignore:
          - job titles
          - seniority
          - years of experience
          - education
          - soft skills
          - business concepts
          - generic capabilities
          - responsibilities
          - methodologies

          Return JSON only:

          {
            "skills": [
              {
                "skill": "Python",
                "importance": "mandatory",
                "evidence": "Strong Python development skills"
              }
            ]
          }
        `
      },
      {
        role: "user",
        content: `
          Job Title:
          ${job.title || ""}

          Job Description:
          ${job.description || ""}

          Extract only the concrete technical skills required
          to perform this job.
        `
      }
    ]
  });

  const content = response.data.message?.content;

  if (!content) {
    throw new Error("Empty response from Ollama");
  }

  return JSON.parse(content);
}