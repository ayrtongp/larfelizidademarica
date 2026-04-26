import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '@/utils/Database';
import bcrypt from 'bcryptjs';
import { buildFamiliaSessionCookie, clearFamiliaSessionCookie } from '@/utils/familiaSession';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  // ── LOGIN ────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { usuario, senha } = body ?? {};

    if (!usuario?.trim() || !senha) {
      return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
    }

    const { db } = await connect();
    const col = db.collection('usuario');

    const user = await col.findOne({
      usuario: usuario.trim(),
      ativo: 'S',
      funcoes: 'familiar',
    });

    if (!user || !user.senha) {
      return res.status(401).json({ message: 'Usuário ou senha incorretos.' });
    }

    const senhaOk = await bcrypt.compare(String(senha), user.senha);
    if (!senhaOk) {
      return res.status(401).json({ message: 'Usuário ou senha incorretos.' });
    }

    const cookie = buildFamiliaSessionCookie({
      userId: String(user._id),
      nome:   `${user.nome}${user.sobrenome ? ` ${user.sobrenome}` : ''}`.trim(),
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
