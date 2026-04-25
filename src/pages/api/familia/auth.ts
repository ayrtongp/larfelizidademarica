import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '@/utils/Database';
import bcrypt from 'bcryptjs';
import { buildFamiliaSessionCookie, clearFamiliaSessionCookie } from '@/utils/familiaSession';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  // ── LOGIN ────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { pin } = req.body ?? {};
    const pinStr = String(pin ?? '').replace(/\D/g, '');

    if (pinStr.length !== 6) {
      return res.status(400).json({ message: 'PIN deve ter 6 dígitos.' });
    }

    const { db } = await connect();
    const col = db.collection('usuario');

    // Busca todos os usuários família ativos e testa bcrypt — lista pequena, OK
    const familyUsers = await col.find({ tipo: 'familia', ativo: 'S' }).toArray();

    let matched: (typeof familyUsers)[number] | null = null;
    for (const u of familyUsers) {
      if (u.pin_hash && (await bcrypt.compare(pinStr, u.pin_hash))) {
        matched = u;
        break;
      }
    }

    if (!matched) {
      return res.status(401).json({ message: 'PIN incorreto.' });
    }

    const cookie = buildFamiliaSessionCookie({
      userId:       String(matched._id),
      id_residente: matched.id_residente,
      nome:         matched.nome,
    });

    res.setHeader('Set-Cookie', cookie);
    return res.status(200).json({ ok: true });
  }

  // ── LOGOUT ───────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', clearFamiliaSessionCookie());
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['POST', 'DELETE']);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}
