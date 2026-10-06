import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAnyGroup } from '@/utils/authMiddleware';
import { ADMINISTRATIVO_GROUP_ID } from '@/constants/accessGroups';

const EXPRESS_URL = process.env.NEXT_PUBLIC_URLDO ?? 'https://lobster-app-gbru2.ondigitalocean.app';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).json({ ok: false, error: 'MÃ©todo nÃ£o permitido' });
  if (!await requireAnyGroup(req, res, [ADMINISTRATIVO_GROUP_ID, 'administrativo'])) return;
  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) return res.status(400).json({ ok: false, error: 'id obrigatÃ³rio' });
  try {
    const response = await fetch(`${EXPRESS_URL}/r2_delete?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: { Authorization: req.headers.authorization! } });
    const payload = await response.json().catch(() => ({}));
    return res.status(response.status).json(payload);
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error?.message ?? 'Erro ao excluir arquivo' });
  }
}

