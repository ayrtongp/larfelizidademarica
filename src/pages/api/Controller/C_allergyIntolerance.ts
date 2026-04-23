import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const col = db.collection('patient_allergies');

  switch (req.method) {

    case 'GET':
      if (req.query.type === 'getAll' && req.query.patient_id) {
        try {
          const docs = await col
            .find({ patient_id: req.query.patient_id as string })
            .sort({ recordedDate: -1, createdAt: -1 })
            .toArray();
          return res.status(200).json(docs);
        } catch (err) {
          return res.status(500).json({ message: String(err) });
        }
      }
      if (req.query.type === 'getById' && req.query.id) {
        try {
          const doc = await col.findOne({ _id: new ObjectId(req.query.id as string) });
          if (!doc) return res.status(404).json({ message: 'Não encontrado.' });
          return res.status(200).json(doc);
        } catch (err) {
          return res.status(500).json({ message: String(err) });
        }
      }
      return res.status(400).json({ message: 'GET: type inválido.' });

    case 'POST':
      if (req.query.type === 'new') {
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const now = new Date().toISOString();
          const result = await col.insertOne({
            ...body,
            resourceType: 'AllergyIntolerance',
            createdAt: now,
            updatedAt: now,
          });
          return res.status(201).json({ id: String(result.insertedId) });
        } catch (err) {
          return res.status(500).json({ message: String(err) });
        }
      }
      return res.status(400).json({ message: 'POST: type inválido.' });

    case 'PUT':
      if (req.query.type === 'update' && req.query.id) {
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const { _id, createdAt, resourceType, ...fields } = body;
          const result = await col.updateOne(
            { _id: new ObjectId(req.query.id as string) },
            { $set: { ...fields, updatedAt: new Date().toISOString() } },
          );
          if (result.matchedCount === 0) return res.status(404).json({ message: 'Não encontrado.' });
          return res.status(200).json({ message: 'Atualizado.' });
        } catch (err) {
          return res.status(500).json({ message: String(err) });
        }
      }
      return res.status(400).json({ message: 'PUT: type inválido.' });

    case 'DELETE':
      if (req.query.type === 'delete' && req.query.id) {
        try {
          const result = await col.deleteOne({ _id: new ObjectId(req.query.id as string) });
          if (result.deletedCount === 0) return res.status(404).json({ message: 'Não encontrado.' });
          return res.status(200).json({ message: 'Excluído.' });
        } catch (err) {
          return res.status(500).json({ message: String(err) });
        }
      }
      return res.status(400).json({ message: 'DELETE: type inválido.' });

    default:
      return res.status(405).json({ message: 'Método não permitido.' });
  }
}
