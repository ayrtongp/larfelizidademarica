import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const col = db.collection('escala_equipes');

  switch (req.method) {
    case 'GET': {
      if (req.query.type === 'getAll') {
        try {
          const docs = await col.find({}).sort({ nome: 1 }).toArray();
          return res.status(200).json(docs.map((d: any) => ({ ...d, _id: d._id.toString() })));
        } catch {
          return res.status(500).json({ message: 'Erro ao buscar equipes.' });
        }
      }
      if (req.query.type === 'getById' && req.query.id) {
        try {
          const doc = await col.findOne({ _id: new ObjectId(req.query.id as string) });
          if (!doc) return res.status(404).json({ message: 'Equipe não encontrada.' });
          return res.status(200).json({ ...doc, _id: doc._id.toString() });
        } catch {
          return res.status(500).json({ message: 'Erro ao buscar equipe.' });
        }
      }
      return res.status(400).json({ message: 'type inválido.' });
    }

    case 'POST': {
      if (req.query.type === 'new') {
        const { nome, descricao, cor, membros, regra } = req.body;
        if (!nome || !cor || !regra) {
          return res.status(400).json({ message: 'nome, cor e regra são obrigatórios.' });
        }
        try {
          const now = new Date().toISOString();
          const result = await col.insertOne({
            nome,
            descricao: descricao ?? '',
            cor,
            membros: membros ?? [],
            regra,
            ativo: true,
            createdAt: now,
            updatedAt: now,
          });
          return res.status(201).json({ _id: result.insertedId.toString() });
        } catch {
          return res.status(500).json({ message: 'Erro ao criar equipe.' });
        }
      }
      return res.status(400).json({ message: 'type inválido.' });
    }

    case 'PUT': {
      if (!req.query.id) return res.status(400).json({ message: 'id obrigatório.' });
      const id = req.query.id as string;
      const now = new Date().toISOString();

      if (req.query.type === 'update') {
        const { nome, descricao, cor, regra } = req.body;
        try {
          await col.updateOne(
            { _id: new ObjectId(id) },
            { $set: { nome, descricao, cor, regra, updatedAt: now } }
          );
          return res.status(200).json({ ok: true });
        } catch {
          return res.status(500).json({ message: 'Erro ao atualizar equipe.' });
        }
      }
      if (req.query.type === 'updateMembros') {
        const { membros } = req.body;
        try {
          await col.updateOne(
            { _id: new ObjectId(id) },
            { $set: { membros, updatedAt: now } }
          );
          return res.status(200).json({ ok: true });
        } catch {
          return res.status(500).json({ message: 'Erro ao atualizar membros.' });
        }
      }
      if (req.query.type === 'toggleAtivo') {
        try {
          const doc = await col.findOne({ _id: new ObjectId(id) });
          if (!doc) return res.status(404).json({ message: 'Equipe não encontrada.' });
          await col.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ativo: !doc.ativo, updatedAt: now } }
          );
          return res.status(200).json({ ok: true });
        } catch {
          return res.status(500).json({ message: 'Erro ao alternar status.' });
        }
      }
      return res.status(400).json({ message: 'type inválido.' });
    }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      return res.status(405).json({ message: 'Método não permitido.' });
  }
}
