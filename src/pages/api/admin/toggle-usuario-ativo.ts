import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '@/utils/Database';
import { ObjectId } from 'mongodb';
import { requireAuth } from '@/utils/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'PUT') return res.status(405).json({ ok: false });

    if (!requireAuth(req, res)) return;

    const { id, ativo } = req.query;

    if (!id || typeof id !== 'string') return res.status(400).json({ ok: false, message: 'id inválido' });
    if (ativo !== 'S' && ativo !== 'N') return res.status(400).json({ ok: false, message: 'ativo deve ser S ou N' });

    try {
        const { db } = await connect();
        await db.collection('usuario').updateOne(
            { _id: new ObjectId(id) },
            { $set: { ativo } }
        );
        return res.status(200).json({ ok: true });
    } catch (err: any) {
        console.error('[toggle-usuario-ativo]', err);
        return res.status(500).json({ ok: false, message: 'Erro interno. Contate um administrador.' });
    }
}
