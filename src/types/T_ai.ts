export type T_AIProviderName = 'openai' | 'gemini';

export type T_AIImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

export interface T_AIImage {
  base64: string;          // base64 puro, sem prefixo "data:..."
  mimeType: T_AIImageMimeType;
}

export interface T_AIRequest {
  provider: T_AIProviderName;
  prompt: string;
  systemPrompt?: string;
  image?: T_AIImage;
  jsonMode?: boolean;      // força resposta em JSON puro
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface T_AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface T_AIResponse {
  provider: T_AIProviderName;
  content: string;
  model: string;
  usage?: T_AIUsage;
  durationMs: number;
}

export interface IAIProvider {
  name: T_AIProviderName;
  complete(req: T_AIRequest): Promise<T_AIResponse>;
}
