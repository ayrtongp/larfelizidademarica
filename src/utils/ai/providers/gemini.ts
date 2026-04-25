import { IAIProvider, T_AIRequest, T_AIResponse } from '@/types/T_ai';

const DEFAULT_MODEL = process.env.GEMINI_DEFAULT_MODEL || 'gemini-2.5-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export class GeminiProvider implements IAIProvider {
  name: 'gemini' = 'gemini';

  async complete(req: T_AIRequest): Promise<T_AIResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('[Gemini] GEMINI_API_KEY não definida no ambiente.');

    const model = req.model || DEFAULT_MODEL;
    const url = `${API_BASE}/${model}:generateContent?key=${apiKey}`;

    // Monta partes do user: imagem (se houver) + texto
    const parts: unknown[] = [];
    if (req.image) {
      parts.push({ inlineData: { mimeType: req.image.mimeType, data: req.image.base64 } });
    }
    parts.push({ text: req.prompt });

    const body: Record<string, unknown> = {
      contents: [{ role: 'user', parts }],
    };

    if (req.systemPrompt) {
      body.systemInstruction = { parts: [{ text: req.systemPrompt }] };
    }

    const genConfig: Record<string, unknown> = {};
    if (req.maxTokens)            genConfig.maxOutputTokens = req.maxTokens;
    if (req.temperature !== undefined) genConfig.temperature = req.temperature;
    if (req.jsonMode)              genConfig.responseMimeType = 'application/json';
    if (Object.keys(genConfig).length > 0) body.generationConfig = genConfig;

    const start = Date.now();

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`[Gemini] Erro ${res.status}: ${err}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const content = candidate?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
    const meta = data.usageMetadata;

    return {
      provider: 'gemini',
      content,
      model,
      usage: meta ? {
        promptTokens:     meta.promptTokenCount     ?? 0,
        completionTokens: meta.candidatesTokenCount ?? 0,
        totalTokens:      meta.totalTokenCount      ?? 0,
      } : undefined,
      durationMs: Date.now() - start,
    };
  }
}
