export interface AIJsonRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIJsonResponse<T> {
  result: T;
  model: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}

export interface AIModel {
  generateJson<T>(
    request: AIJsonRequest
  ): Promise<AIJsonResponse<T>>;
}
