import type { AIJsonRequest, AIJsonResponse, AIModel } from "./ai.types.js";

interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
  prompt_eval_count?: number;
  eval_count?: number;
}

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";

const OLLAMA_MODEL =
  process.env.OLLAMA_MODEL ?? "qwen2.5-coder:0.5b-instruct-q2_K";

export const ollamaModel: AIModel = {
  async generateJson<T>(request: AIJsonRequest): Promise<AIJsonResponse<T>> {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        system: request.systemPrompt,
        prompt: request.userPrompt,
        format: "json",
        stream: false,
        options: {
          temperature: request.temperature ?? 0,
          num_predict: request.maxTokens ?? 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();

      throw new Error(
        `Ollama request failed (${response.status}): ${errorBody}`,
      );
    }

    const data = (await response.json()) as OllamaGenerateResponse;

    let parsedResult: T;

    console.log("RAW OLLAMA RESPONSE:", JSON.stringify(data.response, null, 2));

    try {
      parsedResult = JSON.parse(data.response) as T;
    } catch {
      throw new Error(
        `Ollama returned invalid JSON. Raw response: ${data.response}`,
      );
    }

    return {
      result: parsedResult,
      model: data.model,
      usage: {
        inputTokens: data.prompt_eval_count,
        outputTokens: data.eval_count,
      },
    };
  },
};
