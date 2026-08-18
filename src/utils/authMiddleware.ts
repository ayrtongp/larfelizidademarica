import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import connect from '@/utils/Database';

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

export async function requireAnyGroup(
  req: NextApiRequest,
  res: NextApiResponse,
  allowedGroups: string[],
): Promise<string | null> {
  const userId = requireAuth(req, res);
  if (!userId || !ObjectId.isValid(userId)) return null;

  const { db } = await connect();
  const userObjectId = new ObjectId(userId);
  const user = await db.collection('usuario').findOne(
    { _id: userObjectId },
    { projection: { ativo: 1 } },
  );

  if (!user || (user.ativo !== 'S' && user.ativo !== true)) {
    res.status(401).json({ message: 'Usuario inativo ou inexistente.' });
    return null;
  }

  const relations = await db
    .collection('grupos_usuario')
    .find({ id_usuario: { $in: [userId, userObjectId] } })
    .project({ id_grupo: 1 })
    .toArray();
  const groupIds = relations
    .map((relation: { id_grupo?: unknown }) => String(relation.id_grupo ?? ''))
    .filter((id: string) => ObjectId.isValid(id))
    .map((id: string) => new ObjectId(id));

  const groups = groupIds.length
    ? await db
        .collection('grupos')
        .find({ _id: { $in: groupIds } })
        .project({ cod_grupo: 1 })
        .toArray()
    : [];
  const allowed = new Set(allowedGroups.map(group => group.toLowerCase()));
  const hasGroup = groups.some((group: { cod_grupo?: unknown }) =>
    allowed.has(String(group.cod_grupo ?? '').toLowerCase()),
  );

  if (!hasGroup) {
    res.status(403).json({ message: 'Permissao insuficiente.' });
    return null;
  }

  return userId;
}
