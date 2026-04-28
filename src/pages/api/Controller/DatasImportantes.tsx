import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb';
import { getCurrentDateTime } from '@/utils/Functions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const col = db.collection('datas_importantes');

  switch (req.method) {

    // ── GET ──────────────────────────────────────────────────────────────────
    case 'GET':
      if (req.query.type === 'getAll') {
        try {
          const docs = await col.find().sort({ data: 1 }).toArray();
          return res.status(200).json(docs);
        } catch (err) {
          console.error('[DatasImportantes]', err);
          return res.status(500).json({ message: 'getAll: erro interno.' });
        }
      }
      return res.status(400).json({ message: 'GET: type não reconhecido.' });

    // ── POST ─────────────────────────────────────────────────────────────────
    case 'POST':
      if (req.query.type === 'new') {
        try {
          const body = JSON.parse(req.body);
          const { titulo, data, recorrente, categoria, horario, observacao } = body;

          if (!titulo || !data || !categoria) {
            return res.status(400).json({ error: 'titulo, data e categoria são obrigatórios.' });
          }

          const doc = {
            titulo,
            data,
            recorrente: Boolean(recorrente),
            categoria,
            horario:    horario    || '',
            observacao: observacao || '',
            createdAt:  getCurrentDateTime(),
            updatedAt:  getCurrentDateTime(),
          };

          const result = await col.insertOne(doc);
          return res.status(201).json({ id: result.insertedId });
        } catch (err) {
          console.error('[DatasImportantes]', err);
          return res.status(500).json({ message: 'new: erro interno.' });
        }
      }
      return res.status(400).json({ message: 'POST: type não reconhecido.' });

    // ── PUT ──────────────────────────────────────────────────────────────────
    case 'PUT':
      if (req.query.type === 'update' && req.query.id) {
        try {
          const id  = new ObjectId(req.query.id as string);
          const body = JSON.parse(req.body);
          const { titulo, data, recorrente, categoria, horario, observacao } = body;

          if (!titulo || !data || !categoria) {
            return res.status(400).json({ error: 'titulo, data e categoria são obrigatórios.' });
          }

          await col.updateOne({ _id: id }, {
            $set: {
              titulo,
              data,
              recorrente: Boolean(recorrente),
              categoria,
              horario:    horario    || '',
              observacao: observacao || '',
              updatedAt:  getCurrentDateTime(),
            },
          });
          return res.status(200).json({ message: 'Atualizado.' });
        } catch (err) {
          console.error('[DatasImportantes]', err);
          return res.status(500).json({ message: 'update: erro interno.' });
        }
      }
      return res.status(400).json({ message: 'PUT: type ou id não reconhecido.' });

    // ── DELETE ───────────────────────────────────────────────────────────────
    case 'DELETE':
      if (req.query.id) {
        try {
          const id     = new ObjectId(req.query.id as string);
          const result = await col.deleteOne({ _id: id });
          if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Data não encontrada.' });
          }
          return res.status(200).json({ message: 'Excluída.' });
        } catch (err) {
          console.error('[DatasImportantes]', err);
          return res.status(500).json({ message: 'delete: erro interno.' });
        }
      }
      return res.status(400).json({ message: 'DELETE: id não informado.' });

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
