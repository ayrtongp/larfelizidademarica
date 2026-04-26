import jwt from 'jsonwebtoken';
import type { IncomingMessage } from 'http';

export interface FamiliaSessionPayload {
  userId: string;
  nome: string;
}

const COOKIE_NAME = 'familia_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function verifyFamiliaSession(
  req: IncomingMessage & { cookies?: Record<string, string> },
): FamiliaSessionPayload | null {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return null;
    const secret = process.env.JWT_SECRET as string;
    return jwt.verify(token, secret) as FamiliaSessionPayload;
  } catch {
    return null;
  }
}

export function buildFamiliaSessionCookie(payload: FamiliaSessionPayload): string {
  const secret = process.env.JWT_SECRET as string;
  const token = jwt.sign(payload, secret, { expiresIn: MAX_AGE });
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; HttpOnly${secure}; SameSite=Strict; Max-Age=${MAX_AGE}; Path=/`;
}

export function clearFamiliaSessionCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Max-Age=0; Path=/`;
}
