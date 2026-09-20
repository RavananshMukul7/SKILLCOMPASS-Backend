import { ollamaModel } from "./ollama.service.js";

const result = await ollamaModel.generateJson<{
  technologies: string[];
}>({
  systemPrompt: `
Return ONLY valid JSON.

The JSON must have exactly this structure:

{
  "technologies": ["JavaScript", "Python", "Java", "C++"]
}

Do not repeat items.
Do not add any other fields.
Do not use markdown.
`.trim(),

  userPrompt: `
Identify the programming languages from this list:

JavaScript
Python
Java
C++
`.trim(),

  temperature: 0,
  maxTokens: 150,
});

console.log(
  "AI RESULT:",
  JSON.stringify(result.result, null, 2)
);