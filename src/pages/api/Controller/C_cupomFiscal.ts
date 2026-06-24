import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb';
import { registrarAuditoria } from '../../../utils/auditoria';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const collection = db.collection('cupom_fiscal');

  switch (req.method) {
    case 'GET': {
      if (req.query.type === 'getAll') {
        try {
          const filter: Record<string, unknown> = {};
          if (req.query.from || req.query.to) {
            filter['cupom.dataCompra'] = {};
            if (req.query.from) (filter['cupom.dataCompra'] as Record<string, string>).$gte = req.query.from as string;
            if (req.query.to) (filter['cupom.dataCompra'] as Record<string, string>).$lte = req.query.to as string;
          }
          const docs = await collection.find(filter).sort({ createdAt: -1 }).toArray();
          return res.status(200).json(docs);
        } catch (err) {
          console.error('[C_cupomFiscal] getAll:', err);
          return res.status(500).json({ message: 'Erro ao buscar cupons.' });
        }
      }

      if (req.query.type === 'getById' && req.query.id) {
        try {
          const doc = await collection.findOne({ _id: new ObjectId(req.query.id as string) });
          if (!doc) return res.status(404).json({ message: 'Cupom não encontrado.' });
          return res.status(200).json(doc);
        } catch (err) {
          console.error('[C_cupomFiscal] getById:', err);
          return res.status(500).json({ message: 'Erro ao buscar cupom.' });
        }
      }

      return res.status(400).json({ message: 'GET: type não identificado.' });
    }

    case 'POST': {
      if (req.query.type === 'criar') {
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const now = new Date().toISOString();
          const doc = { ...body, createdAt: now, updatedAt: now };
          const result = await collection.insertOne(doc);

          await registrarAuditoria(db, {
            entidade: 'cupom_fiscal',
            entidadeId: result.insertedId.toString(),
            nomeEntidade: body.estabelecimento?.nome ?? '',
            acao: 'criar',
            depois: { totalInformado: body.totais?.totalInformado, qtdItens: body.itens?.length },
            realizadoPor: body.criadoPor ?? '',
          });

          return res.status(201).json({ id: result.insertedId.toString() });
        } catch (err) {
          console.error('[C_cupomFiscal] criar:', err);
          return res.status(500).json({ message: 'Erro ao salvar cupom.' });
        }
      }

      return res.status(400).json({ message: 'POST: type não identificado.' });
    }

    case 'PUT': {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ message: 'id obrigatório.' });

      if (req.query.type === 'update') {
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const { _id, createdAt, ...updateFields } = body;
          updateFields.updatedAt = new Date().toISOString();

          const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateFields }
          );
          if (result.matchedCount === 0) return res.status(404).json({ message: 'Cupom não encontrado.' });
          return res.status(200).json({ message: 'Cupom atualizado.' });
        } catch (err) {
          console.error('[C_cupomFiscal] update:', err);
          return res.status(500).json({ message: 'Erro ao atualizar cupom.' });
        }
      }

      return res.status(400).json({ message: 'PUT: type não identificado.' });
    }

    case 'DELETE': {
      const id = req.query.id as string;
      if (req.query.type === 'excluir' && id) {
        try {
          const atual = await collection.findOne({ _id: new ObjectId(id) }, { projection: { estabelecimento: 1, criadoPor: 1 } });
          if (!atual) return res.status(404).json({ message: 'Cupom não encontrado.' });

          await collection.deleteOne({ _id: new ObjectId(id) });

          await registrarAuditoria(db, {
            entidade: 'cupom_fiscal',
            entidadeId: id,
            nomeEntidade: atual.estabelecimento?.nome ?? '',
            acao: 'excluir',
            realizadoPor: req.body?.realizadoPor ?? '',
          });

          return res.status(200).json({ message: 'Cupom excluído.' });
        } catch (err) {
          console.error('[C_cupomFiscal] excluir:', err);
          return res.status(500).json({ message: 'Erro ao excluir cupom.' });
        }
      }

      return res.status(400).json({ message: 'DELETE: type não identificado.' });
    }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ message: `Método ${req.method} não permitido.` });
  }
}
