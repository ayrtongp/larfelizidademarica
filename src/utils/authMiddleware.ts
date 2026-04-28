import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

export function requireAuth(req: NextApiRequest, res: NextApiResponse): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Autenticação necessária.' });
    return null;
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET as string;

  try {
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
    return decoded.userId as string;
  } catch {
    res.status(401).json({ message: 'Token inválido ou expirado.' });
    return null;
  }
}
