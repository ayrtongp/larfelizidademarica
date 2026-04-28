import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Simple in-memory rate limiter: max 5 attempts per IP per 15 minutes
const loginAttempts = new Map<string, { count: number; windowStart: number }>();
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= RATE_MAX) return false;

  entry.count++;
  return true;
}

function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress ?? 'unknown';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse,) {
  const { db } = await connect();
  const mainCollection = db.collection('usuario')
  switch (req.method) {

    case 'POST':
      // -------------------------
      // Realizar o LOGIN
      // -------------------------
      try {
        const ip = getClientIp(req);
        if (!checkRateLimit(ip)) {
          return res.status(429).json({ message: 'Muitas tentativas. Aguarde 15 minutos.' });
        }

        const { usuario, senha } = req.body ?? {};

        if (!usuario || !senha || typeof usuario !== 'string' || typeof senha !== 'string') {
          return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
        }

        const formattedUsuario = usuario.toLocaleLowerCase()
        const response = await mainCollection.findOne({ usuario: formattedUsuario });

        if (!response) {
          return res.status(401).json({ message: 'Usuário ou senha inválidos.' });
        }

        const match = await bcrypt.compare(senha, response?.senha);

        if (!match) {
          return res.status(401).json({ message: 'Usuário ou senha inválidos.' });
        }

        if (response.ativo !== 'S') {
          return res.status(401).json({ message: 'O usuário está desativado.' });
        }

        const secret = process.env.JWT_SECRET as string;
        const token = jwt.sign({ userId: response._id }, secret, { expiresIn: '1h' });
        const funcoes: string[] = Array.isArray(response.funcoes) && response.funcoes.length > 0
          ? response.funcoes
          : response.funcao ? [response.funcao] : [];
        const userInfo = { id: response._id, nome: response.nome + " " + response.sobrenome, fotoPerfil: response.foto_base64, funcao: response.funcao, funcoes }
        return res.status(200).json({ message: "Logado com sucesso", token, userInfo });
      }
      catch (error) {
        console.error('Erro no login:', error)
        return res.status(500).json({ message: "Ocorreu um erro ao realizar o login." });
      }

    default:
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

}
