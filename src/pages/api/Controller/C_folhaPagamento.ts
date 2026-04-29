import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb';

function somaLancamentos(lista: any[]): number {
  return (lista || []).reduce((s: number, l: any) => s + Number(l.valor || 0), 0);
}

function normalizarItem(item: any) {
  const proventos = (item.proventos || []).map((l: any) => ({ descricao: String(l.descricao || ''), valor: Number(l.valor || 0) }));
  const descontos = (item.descontos || []).map((l: any) => ({ descricao: String(l.descricao || ''), valor: Number(l.valor || 0) }));
  const totalProventos = somaLancamentos(proventos);
  const totalDescontos = somaLancamentos(descontos);
  return { ...item, proventos, descontos, totalProventos, totalDescontos, salarioLiquido: totalProventos - totalDescontos };
}

function calcularTotais(itens: any[]) {
  return itens.reduce(
    (acc: any, item: any) => {
      acc.totalBruto += Number(item.totalProventos || 0);
      acc.totalDescontos += Number(item.totalDescontos || 0);
      acc.totalLiquido += Number(item.salarioLiquido || 0);
      return acc;
    },
    { totalBruto: 0, totalDescontos: 0, totalLiquido: 0 }
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const collection = db.collection('folha_pagamento');

  switch (req.method) {

    case 'GET': {
      if (req.query.type === 'getAll') {
        try {
          const docs = await collection
            .find({}, { projection: { itens: 0 } })
            .sort({ 'periodo.ano': -1, 'periodo.mes': -1 })
            .toArray();
          return res.status(200).json(docs);
        } catch {
          return res.status(500).json({ error: 'Erro ao buscar folhas' });
        }
      }

      if (req.query.type === 'getById') {
        try {
          const doc = await collection.findOne({ _id: new ObjectId(req.query.id as string) });
          if (!doc) return res.status(404).json({ error: 'Não encontrado' });
          return res.status(200).json(doc);
        } catch {
          return res.status(500).json({ error: 'Erro ao buscar folha' });
        }
      }

      return res.status(400).json({ error: 'type inválido' });
    }

    case 'POST': {
      if (req.query.type === 'new') {
        try {
          const { periodo, itens, createdBy } = req.body;
          if (!periodo?.mes || !periodo?.ano || !createdBy) {
            return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
          }

          const existente = await collection.findOne({ 'periodo.mes': Number(periodo.mes), 'periodo.ano': Number(periodo.ano) });
          if (existente) return res.status(409).json({ error: 'Já existe folha para este período' });

          const normalizedItens = (itens || []).map(normalizarItem);
          const totais = calcularTotais(normalizedItens);
          const doc = {
            periodo: { mes: Number(periodo.mes), ano: Number(periodo.ano) },
            itens: normalizedItens,
            ...totais,
            createdBy,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          const result = await collection.insertOne(doc);
          return res.status(201).json({ ...doc, _id: result.insertedId });
        } catch {
          return res.status(500).json({ error: 'Erro ao criar folha' });
        }
      }
      return res.status(400).json({ error: 'type inválido' });
    }

    case 'PUT': {
      if (req.query.type === 'update') {
        try {
          const id = req.query.id as string;
          const { itens } = req.body;

          const normalizedItens = (itens || []).map(normalizarItem);
          const totais = calcularTotais(normalizedItens);
          await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { itens: normalizedItens, ...totais, updatedAt: new Date().toISOString() } }
          );
          return res.status(200).json({ ok: true });
        } catch {
          return res.status(500).json({ error: 'Erro ao atualizar folha' });
        }
      }

      if (req.query.type === 'anexarArquivo') {
        try {
          const id = req.query.id as string;
          const { cloudURL, filename, cloudFilename, size, format, descricao } = req.body;
          await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { cloudURL, filename, cloudFilename, size, format, descricao: descricao || '', updatedAt: new Date().toISOString() } }
          );
          return res.status(200).json({ ok: true });
        } catch {
          return res.status(500).json({ error: 'Erro ao anexar arquivo' });
        }
      }

      return res.status(400).json({ error: 'type inválido' });
    }

    case 'DELETE': {
      if (req.query.type === 'delete') {
        try {
          await collection.deleteOne({ _id: new ObjectId(req.query.id as string) });
          return res.status(200).json({ ok: true });
        } catch {
          return res.status(500).json({ error: 'Erro ao remover folha' });
        }
      }
      return res.status(400).json({ error: 'type inválido' });
    }

    default:
      return res.status(405).json({ error: 'Método não permitido' });
  }
}
