import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAnyGroup } from '@/utils/authMiddleware';
import { ADMINISTRATIVO_GROUP_ID } from '@/constants/accessGroups';

const EXPRESS_URL = process.env.NEXT_PUBLIC_URLDO ?? 'https://lobster-app-gbru2.ondigitalocean.app';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'MÃ©todo nÃ£o permitido' });
  if (!await requireAnyGroup(req, res, [ADMINISTRATIVO_GROUP_ID, 'administrativo'])) return;
  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) return res.status(400).json({ ok: false, error: 'id obrigatÃ³rio' });
  try {
    const response = await fetch(`${EXPRESS_URL}/r2_files/${encodeURIComponent(id)}`, { headers: { Authorization: req.headers.authorization! } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.url) return res.status(response.status || 502).json(payload);
    return res.status(200).json({ ok: true, url: payload.url });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error?.message ?? 'Erro ao abrir arquivo' });
  }
}

