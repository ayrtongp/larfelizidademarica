import { IAIProvider, T_AIRequest, T_AIResponse } from '@/types/T_ai';

const DEFAULT_MODEL = process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini';
const API_URL = 'https://api.openai.com/v1/chat/completions';

export class OpenAIProvider implements IAIProvider {
  name: 'openai' = 'openai';

  async complete(req: T_AIRequest): Promise<T_AIResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('[OpenAI] OPENAI_API_KEY não definida no ambiente.');

    const model = req.model || DEFAULT_MODEL;

    // Monta conteúdo do user: imagem (se houver) + texto
    type ContentPart =
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } };

    const userContent: ContentPart[] = [];

    if (req.image) {
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:${req.image.mimeType};base64,${req.image.base64}` },
      });
    }

    userContent.push({ type: 'text', text: req.prompt });

    type Message =
      | { role: 'system'; content: string }
      | { role: 'user'; content: ContentPart[] | string };

    const messages: Message[] = [];
    if (req.systemPrompt) messages.push({ role: 'system', content: req.systemPrompt });
    messages.push({ role: 'user', content: req.image ? userContent : req.prompt });

    const start = Date.now();

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        ...(req.jsonMode ? { response_format: { type: 'json_object' } } : {}),
        ...(req.maxTokens ? { max_tokens: req.maxTokens } : {}),
        ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`[OpenAI] Erro ${res.status}: ${err}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];

    return {
      provider: 'openai',
      content: choice?.message?.content ?? '',
      model: data.model ?? model,
      usage: data.usage ? {
        promptTokens:     data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens:      data.usage.total_tokens,
      } : undefined,
      durationMs: Date.now() - start,
    };
  }
}
