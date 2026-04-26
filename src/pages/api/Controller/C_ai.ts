import { NextApiRequest, NextApiResponse } from 'next';
import { getProvider } from '@/utils/ai';
import { T_AIRequest, T_AIProviderName } from '@/types/T_ai';

// Aumenta limite para suportar imagens em base64
export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

const VALID_PROVIDERS: T_AIProviderName[] = ['openai', 'gemini'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Método não permitido.' });
  }

  const body: Partial<T_AIRequest> = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

  if (!body.provider || !VALID_PROVIDERS.includes(body.provider)) {
    return res.status(400).json({ message: `provider inválido. Use: ${VALID_PROVIDERS.join(', ')}.` });
  }
  if (!body.prompt || !body.prompt.trim()) {
    return res.status(400).json({ message: 'prompt é obrigatório.' });
  }

  try {
    const provider = getProvider(body.provider);
    const response = await provider.complete(body as T_AIRequest);
    return res.status(200).json(response);
  } catch (err) {
    console.error('[C_ai]', err);
    return res.status(500).json({
      message: 'Erro ao processar requisição de IA.',
      provider: body.provider,
      error: String(err),
    });
  }
}
