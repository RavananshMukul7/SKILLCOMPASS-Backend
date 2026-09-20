import { z } from "zod";
import { ollamaModel } from "../ai/ollama.service.js";
import type {
  TechnologyDetectionInput,
  TechnologyDetectionResult,
  DetectedTechnology,
} from "./technologyDetection.types.js";

const aiTechnologySchema = z.object({
  technologies: z.array(z.string().min(1)),
});

export const detectTechnologiesWithAI = async (
  input: TechnologyDetectionInput
): Promise<TechnologyDetectionResult> => {
  const detectedTechnologies: DetectedTechnology[] = [];

  for (const file of input.files) {
    const systemPrompt = `
You are a code technology detector.

Analyze ONE source file.

Return ONLY valid JSON in exactly this format:

{
  "technologies": ["technology1", "technology2"]
}

Rules:
- Return only technologies actually supported by the source code.
- Use common technology names.
- Do not repeat technologies.
- Do not explain your answer.
- Do not return file names.
- Do not return programming language names unless the language is clearly relevant from the file itself.
- Do not invent frameworks or libraries.
`.trim();

    const userPrompt = `
File: ${file.path}

Source code:
${file.content}
`.trim();

    const response = await ollamaModel.generateJson<unknown>({
      systemPrompt,
      userPrompt,
      temperature: 0,
      maxTokens: 150,
    });

    const parsed = aiTechnologySchema.parse(response.result);

    for (const technologyName of parsed.technologies) {
      const normalizedName = technologyName.trim().toLowerCase();

      const alreadyDetected = detectedTechnologies.some(
        (item) =>
          item.normalizedName === normalizedName
      );

      if (alreadyDetected) {
        continue;
      }

      detectedTechnologies.push({
        technologyName: technologyName.trim(),
        normalizedName,
        category: "CONCEPT",
        confidence: 0.8,
        evidence: [
          {
            path: file.path,
            evidenceType: "AI_SOURCE_ANALYSIS",
            evidenceValue: `Detected by AI from ${file.path}`,
          },
        ],
      });
    }
  }

  return {
    technologies: detectedTechnologies,
  };
};