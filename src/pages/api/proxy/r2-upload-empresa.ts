import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAnyGroup } from '@/utils/authMiddleware';
import { ADMINISTRATIVO_GROUP_ID } from '@/constants/accessGroups';

export const config = { api: { bodyParser: false } };

const EXPRESS_URL = process.env.NEXT_PUBLIC_URLDO ?? 'https://lobster-app-gbru2.ondigitalocean.app';
const MAX_BODY_BYTES = 10 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = ['multipart/form-data', 'application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function readRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on('data', (chunk: Buffer) => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        req.destroy();
        reject(new Error('Arquivo muito grande. Limite de 10 MB.'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'MÃ©todo nÃ£o permitido' });
  if (!await requireAnyGroup(req, res, [ADMINISTRATIVO_GROUP_ID, 'administrativo'])) return;
  const contentType = (req.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase();
  if (!ALLOWED_CONTENT_TYPES.some(type => contentType.startsWith(type))) return res.status(415).json({ ok: false, error: 'Tipo de arquivo nÃ£o permitido.' });

  try {
    const rawBody = await readRawBody(req);
    const expressRes = await fetch(`${EXPRESS_URL}/r2_upload`, {
      method: 'POST',
      headers: { 'Content-Type': req.headers['content-type'] ?? '', Authorization: req.headers.authorization! },
      body: rawBody,
    });
    const payload = await expressRes.json().catch(() => ({}));
    return res.status(expressRes.status).json(payload);
  } catch (error: any) {
    return res.status(error?.message?.includes('grande') ? 413 : 500).json({ ok: false, error: error?.message ?? 'Erro no upload' });
  }
}


