import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const col = db.collection('escala_excecoes');

  switch (req.method) {
    case 'GET': {
      if (req.query.type === 'getByRange') {
        const { inicio, fim, equipeId } = req.query;
        if (!inicio || !fim) return res.status(400).json({ message: 'inicio e fim obrigatórios.' });
        try {
          const filter: any = { data: { $gte: inicio as string, $lte: fim as string } };
          if (equipeId) filter.equipeId = equipeId as string;
          const docs = await col.find(filter).sort({ data: 1 }).toArray();
          return res.status(200).json(docs.map((d: any) => ({ ...d, _id: d._id.toString() })));
        } catch {
          return res.status(500).json({ message: 'Erro ao buscar exceções.' });
        }
      }
      return res.status(400).json({ message: 'type inválido.' });
    }

    case 'POST': {
      if (req.query.type === 'new') {
        const { equipeId, equipeNome, funcionarioId, nome, data, tipo, observacao } = req.body;
        if (!equipeId || !funcionarioId || !data || !tipo) {
          return res.status(400).json({ message: 'equipeId, funcionarioId, data e tipo são obrigatórios.' });
        }
        try {
          // Upsert: substitui exceção anterior do mesmo membro/equipe/data
          await col.deleteMany({ equipeId, funcionarioId, data });
          const result = await col.insertOne({
            equipeId, equipeNome, funcionarioId, nome, data, tipo,
            observacao: observacao ?? '',
            createdAt: new Date().toISOString(),
          });
          return res.status(201).json({ _id: result.insertedId.toString() });
        } catch {
          return res.status(500).json({ message: 'Erro ao salvar exceção.' });
        }
      }
      return res.status(400).json({ message: 'type inválido.' });
    }

    case 'DELETE': {
      if (!req.query.id) return res.status(400).json({ message: 'id obrigatório.' });
      try {
        await col.deleteOne({ _id: new ObjectId(req.query.id as string) });
        return res.status(200).json({ ok: true });
      } catch {
        return res.status(500).json({ message: 'Erro ao remover exceção.' });
      }
    }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      return res.status(405).json({ message: 'Método não permitido.' });
  }
}
