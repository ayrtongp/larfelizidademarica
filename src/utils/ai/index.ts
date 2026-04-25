import { IAIProvider, T_AIProviderName } from '@/types/T_ai';
import { OpenAIProvider } from './providers/openai';
import { GeminiProvider } from './providers/gemini';

const registry: Record<T_AIProviderName, IAIProvider> = {
  openai: new OpenAIProvider(),
  gemini: new GeminiProvider(),
};

export function getProvider(name: T_AIProviderName): IAIProvider {
  const provider = registry[name];
  if (!provider) throw new Error(`[AI] Provider desconhecido: ${name}`);
  return provider;
}

export function listProviders(): T_AIProviderName[] {
  return Object.keys(registry) as T_AIProviderName[];
}
