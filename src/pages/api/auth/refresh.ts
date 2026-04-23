import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token ausente.' });
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET as string;

  try {
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
    const newToken = jwt.sign({ userId: decoded.userId }, secret, { expiresIn: '1h' });
    return res.status(200).json({ token: newToken });
  } catch {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
}
