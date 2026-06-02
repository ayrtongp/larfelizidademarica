import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/utils/authMiddleware';

const EXPRESS_URL = process.env.NEXT_PUBLIC_URLDO ?? 'https://lobster-app-gbru2.ondigitalocean.app';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Método não permitido' });
  }

  if (!requireAuth(req, res)) return;

  const id = req.query.id as string;
  if (!id) return res.status(400).json({ ok: false, error: 'id obrigatório' });

  try {
    const expressRes = await fetch(`${EXPRESS_URL}/r2_files/${encodeURIComponent(id)}`);

    if (!expressRes.ok) {
      const body = await expressRes.json().catch(() => ({}));
      return res.status(expressRes.status).json(body);
    }

    const { url } = await expressRes.json();
    return res.status(200).json({ ok: true, url });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message ?? 'Erro ao resolver URL' });
  }
}
