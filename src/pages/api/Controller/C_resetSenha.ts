import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://larfelizidade.com.br';
const FROM_EMAIL = 'noreply@larfelizidade.com.br';
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const usuarios = db.collection('usuario');
  const tokens = db.collection('reset_tokens');

  // POST /solicitar — recebe email, envia link
  if (req.method === 'POST' && req.query.type === 'solicitar') {
    const { email } = req.body ?? {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email obrigatório.' });
    }

    const user = await usuarios.findOne({ email: email.trim().toLowerCase() });

    // Resposta genérica mesmo se não encontrar (evita enumeração)
    if (!user) {
      return res.status(200).json({ message: 'Se o email estiver cadastrado, você receberá as instruções em breve.' });
    }

    // Invalida tokens anteriores do mesmo usuário
    await tokens.deleteMany({ userId: String(user._id) });

    const token = crypto.randomBytes(32).toString('hex');
    await tokens.insertOne({
      token,
      userId: String(user._id),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      createdAt: new Date(),
    });

    const link = `${APP_URL}/portal/redefinir-senha?token=${token}`;
    const nomeCompleto = `${user.nome ?? ''} ${user.sobrenome ?? ''}`.trim() || 'usuário';

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email.trim(),
      subject: 'Recuperação de acesso — Lar Felizidade',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f9fafb;border-radius:12px">
          <img src="${APP_URL}/images/lar felizidade logo transparente.png" alt="Lar Felizidade" style="height:56px;margin-bottom:24px" />
          <h2 style="color:#1e293b;margin-bottom:8px">Olá, ${nomeCompleto}</h2>
          <p style="color:#475569;font-size:14px;line-height:1.6;margin-bottom:8px">
            Recebemos uma solicitação de recuperação de acesso para sua conta.
          </p>
          <p style="color:#475569;font-size:14px;line-height:1.6;margin-bottom:24px">
            <strong>Seu usuário é:</strong> <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px">${user.usuario}</code>
          </p>
          <a href="${link}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600">
            Redefinir minha senha
          </a>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;line-height:1.5">
            Este link expira em 1 hora. Se você não solicitou a recuperação, ignore este email.
          </p>
        </div>
      `,
    });

    return res.status(200).json({ message: 'Se o email estiver cadastrado, você receberá as instruções em breve.' });
  }

  // GET /validar?token=xxx — verifica se token é válido
  if (req.method === 'GET' && req.query.type === 'validar') {
    const token = req.query.token as string;
    if (!token) return res.status(400).json({ valid: false });

    const entry = await tokens.findOne({ token });
    if (!entry) return res.status(200).json({ valid: false, message: 'Link inválido.' });
    if (new Date() > new Date(entry.expiresAt)) {
      return res.status(200).json({ valid: false, message: 'Este link expirou. Solicite um novo.' });
    }

    return res.status(200).json({ valid: true });
  }

  // POST /redefinir — aplica nova senha
  if (req.method === 'POST' && req.query.type === 'redefinir') {
    const { token, novaSenha } = req.body ?? {};
    if (!token || !novaSenha || novaSenha.length < 6) {
      return res.status(400).json({ message: 'Token e senha (mínimo 6 caracteres) são obrigatórios.' });
    }

    const entry = await tokens.findOne({ token });
    if (!entry) return res.status(400).json({ message: 'Link inválido.' });
    if (new Date() > new Date(entry.expiresAt)) {
      return res.status(400).json({ message: 'Este link expirou. Solicite um novo.' });
    }

    const hash = await bcrypt.hash(novaSenha, 10);
    const { ObjectId } = await import('mongodb');
    await usuarios.updateOne(
      { _id: new ObjectId(entry.userId) },
      { $set: { senha: hash } }
    );

    await tokens.deleteOne({ token });

    return res.status(200).json({ message: 'Senha redefinida com sucesso!' });
  }

  return res.status(405).json({ message: 'Método não permitido.' });
}
