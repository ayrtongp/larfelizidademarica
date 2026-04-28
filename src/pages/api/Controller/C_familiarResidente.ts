import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '@/utils/Database';
import { ObjectId } from 'mongodb';
import { getCurrentDateTime } from '@/utils/Functions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const col = db.collection('familiar_residente');

  // ── GET ──────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {

    // Lista familiares de um residente (com dados do usuário via $lookup)
    if (req.query.type === 'getByResidente') {
      const { residente_id } = req.query;
      if (!residente_id) return res.status(400).json({ message: 'residente_id é obrigatório.' });

      try {
        const docs = await col.aggregate([
          { $match: { residente_id: String(residente_id) } },
          {
            $lookup: {
              from: 'usuario',
              let: { uid: '$usuario_id' },
              pipeline: [
                { $addFields: { uid_str: { $toString: '$_id' } } },
                { $match: { $expr: { $eq: ['$uid_str', '$$uid'] } } },
                { $project: { _id: 1, nome: 1, sobrenome: 1, usuario: 1, email: 1, ativo: 1 } },
              ],
              as: 'usuario',
            },
          },
          { $unwind: { path: '$usuario', preserveNullAndEmpty: true } },
          { $sort: { createdAt: -1 } },
        ]).toArray();

        return res.status(200).json(docs);
      } catch (err) {
        console.error('[C_familiarResidente]', err);
        return res.status(500).json({ message: 'Erro ao listar familiares do residente.' });
      }
    }

    // Lista residentes de um familiar (com display_name via $lookup)
    if (req.query.type === 'getByUsuario') {
      const { usuario_id } = req.query;
      if (!usuario_id) return res.status(400).json({ message: 'usuario_id é obrigatório.' });

      try {
        const docs = await col.aggregate([
          { $match: { usuario_id: String(usuario_id), ativo: true } },
          {
            $lookup: {
              from: 'patient',
              let: { rid: '$residente_id' },
              pipeline: [
                { $addFields: { rid_str: { $toString: '$_id' } } },
                { $match: { $expr: { $eq: ['$rid_str', '$$rid'] } } },
                { $project: { _id: 1, display_name: 1, photo_url: 1 } },
              ],
              as: 'residente',
            },
          },
          { $unwind: { path: '$residente', preserveNullAndEmpty: true } },
          { $sort: { createdAt: -1 } },
        ]).toArray();

        return res.status(200).json(docs);
      } catch (err) {
        console.error('[C_familiarResidente]', err);
        return res.status(500).json({ message: 'Erro ao listar residentes do familiar.' });
      }
    }

    return res.status(400).json({ message: 'type não reconhecido.' });
  }

  // ── POST: criar vínculo ──────────────────────────────────────────────────
  if (req.method === 'POST') {
    if (req.query.type === 'new') {
      try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { usuario_id, residente_id, parentesco } = body;

        if (!usuario_id || !residente_id || !parentesco) {
          return res.status(400).json({ message: 'usuario_id, residente_id e parentesco são obrigatórios.' });
        }

        // Evita duplicata ativa
        const exists = await col.findOne({ usuario_id: String(usuario_id), residente_id: String(residente_id), ativo: true });
        if (exists) return res.status(409).json({ message: 'Vínculo já existe.' });

        const now = getCurrentDateTime();
        const doc = {
          usuario_id:   String(usuario_id),
          residente_id: String(residente_id),
          parentesco:   String(parentesco),
          ativo:        true,
          createdAt:    now,
          updatedAt:    now,
        };

        const result = await col.insertOne(doc);
        return res.status(201).json({ id: result.insertedId });
      } catch (err) {
        console.error('[C_familiarResidente]', err);
        return res.status(500).json({ message: 'Erro ao criar vínculo.' });
      }
    }

    return res.status(400).json({ message: 'type não reconhecido.' });
  }

  // ── PUT: ativar / desativar vínculo ──────────────────────────────────────
  if (req.method === 'PUT') {
    if (req.query.type === 'toggleAtivo') {
      try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ message: 'id é obrigatório.' });

        const doc = await col.findOne({ _id: new ObjectId(id as string) });
        if (!doc) return res.status(404).json({ message: 'Vínculo não encontrado.' });

        await col.updateOne(
          { _id: new ObjectId(id as string) },
          { $set: { ativo: !doc.ativo, updatedAt: getCurrentDateTime() } },
        );

        return res.status(200).json({ message: 'Vínculo atualizado.', ativo: !doc.ativo });
      } catch (err) {
        console.error('[C_familiarResidente]', err);
        return res.status(500).json({ message: 'Erro ao atualizar vínculo.' });
      }
    }

    return res.status(400).json({ message: 'type não reconhecido.' });
  }

  // ── DELETE: remover vínculo ──────────────────────────────────────────────
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ message: 'id é obrigatório.' });

      const result = await col.deleteOne({ _id: new ObjectId(id as string) });
      if (result.deletedCount === 0) return res.status(404).json({ message: 'Vínculo não encontrado.' });

      return res.status(200).json({ message: 'Vínculo removido.' });
    } catch (err) {
      console.error('[C_familiarResidente]', err);
      return res.status(500).json({ message: 'Erro ao remover vínculo.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}
