import axios from "axios";

const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "qwen2.5-coder:7b";

const skillAnalysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    skills: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          skill: {
            type: "string"
          },
          evidence: {
            type: "array",
            items: {
              type: "string"
            }
          },
          concepts: {
            type: "array",
            items: {
              type: "string"
            }
          },
          complexity: {
            type: "number"
          },
          confidence: {
            type: "number"
          }
        },
        required: [
          "skill",
          "evidence",
          "concepts",
          "complexity",
          "confidence"
        ]
      }
    }
  },
  required: ["skills"]
};

export async function analyzeCodeChunk({
  repository,
  filePath,
  chunk
}) {
  const response = await axios.post(OLLAMA_URL, {
    model: MODEL,
    stream: false,
    format: skillAnalysisSchema,
    messages: [
      {
        role: "system",
        content: `
You are the Skill Extraction Engine for SkillCompass.

Analyze source code only.

Identify programming languages, frameworks,
libraries, technologies, and programming skills
that are actually demonstrated by the code.

Do not infer a skill merely because it appears in:
- comments
- strings
- filenames
- documentation
- variable names

Only report skills supported by actual implementation.

Do not estimate the user's overall proficiency.

Return only valid JSON matching the provided schema.
`
      },
      {
        role: "user",
        content: `
Repository: ${repository}
File: ${filePath}

Source code:
${chunk}
`
      }
    ]
  });

  const content = response.data.message?.content;

  if (!content) {
    throw new Error("Ollama returned an empty response");
  }

  return JSON.parse(content);
}