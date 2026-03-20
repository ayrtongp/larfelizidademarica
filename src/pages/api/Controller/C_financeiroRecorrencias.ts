import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const collection = db.collection('financeiro_recorrencias');

  switch (req.method) {
    case 'GET': {
      const { type, id } = req.query;

      if (type === 'getAll') {
        const filter: any = {};
        if (req.query.tipo) filter.tipo = req.query.tipo;
        if (req.query.ativo !== undefined) filter.ativo = req.query.ativo === 'true';
        const data = await collection.find(filter).sort({ descricaoPadrao: 1 }).toArray();
        return res.status(200).json(data);
      }

      if (type === 'getById' && id) {
        const item = await collection.findOne({ _id: new ObjectId(id as string) });
        if (!item) return res.status(404).json({ message: 'Recorrência não encontrada.' });
        return res.status(200).json(item);
      }

      return res.status(400).json({ message: 'GET: Nenhum query.type identificado.' });
    }

    case 'POST': {
      const { type } = req.query;

      if (type === 'new') {
        const { tipo, descricaoPadrao, categoriaId, contraparteId, residenteId, responsavelId, valorPadrao, diaVencimento, frequencia, dataInicio, dataFim, ativo } = req.body;

        if (!tipo || !descricaoPadrao || !categoriaId || !valorPadrao || !diaVencimento || !frequencia || !dataInicio) {
          return res.status(400).json({ message: 'Campos obrigatórios: tipo, descricaoPadrao, categoriaId, valorPadrao, diaVencimento, frequencia, dataInicio.' });
        }

        const now = new Date().toISOString();
        const novaRecorrencia = {
          tipo,
          descricaoPadrao,
          categoriaId,
          contraparteId: contraparteId || null,
          residenteId: residenteId || null,
          responsavelId: responsavelId || null,
          valorPadrao: Number(valorPadrao),
          diaVencimento: Number(diaVencimento),
          frequencia,
          dataInicio,
          dataFim: dataFim || null,
          ativo: ativo !== undefined ? ativo : true,
          createdAt: now,
          updatedAt: now,
        };

        const result = await collection.insertOne(novaRecorrencia);
        return res.status(201).json({ _id: result.insertedId.toString(), ...novaRecorrencia });
      }

      return res.status(400).json({ message: 'POST: Nenhum query.type identificado.' });
    }

    case 'PUT': {
      const { type, id } = req.query;

      if (type === 'update' && id) {
        const { tipo, descricaoPadrao, categoriaId, contraparteId, residenteId, responsavelId, valorPadrao, diaVencimento, frequencia, dataInicio, dataFim, ativo } = req.body;
        const now = new Date().toISOString();
        const updateData: any = { updatedAt: now };
        if (tipo !== undefined) updateData.tipo = tipo;
        if (descricaoPadrao !== undefined) updateData.descricaoPadrao = descricaoPadrao;
        if (categoriaId !== undefined) updateData.categoriaId = categoriaId;
        if (contraparteId !== undefined) updateData.contraparteId = contraparteId;
        if (residenteId !== undefined) updateData.residenteId = residenteId;
        if (responsavelId !== undefined) updateData.responsavelId = responsavelId;
        if (valorPadrao !== undefined) updateData.valorPadrao = Number(valorPadrao);
        if (diaVencimento !== undefined) updateData.diaVencimento = Number(diaVencimento);
        if (frequencia !== undefined) updateData.frequencia = frequencia;
        if (dataInicio !== undefined) updateData.dataInicio = dataInicio;
        if (dataFim !== undefined) updateData.dataFim = dataFim;
        if (ativo !== undefined) updateData.ativo = ativo;

        await collection.updateOne({ _id: new ObjectId(id as string) }, { $set: updateData });
        const updated = await collection.findOne({ _id: new ObjectId(id as string) });
        return res.status(200).json(updated);
      }

      if (type === 'toggleAtivo' && id) {
        const item = await collection.findOne({ _id: new ObjectId(id as string) });
        if (!item) return res.status(404).json({ message: 'Recorrência não encontrada.' });
        const now = new Date().toISOString();
        await collection.updateOne(
          { _id: new ObjectId(id as string) },
          { $set: { ativo: !item.ativo, updatedAt: now } }
        );
        return res.status(200).json({ message: 'Ativo alternado com sucesso.' });
      }

      return res.status(400).json({ message: 'PUT: Nenhum query.type identificado.' });
    }

    case 'DELETE': {
      const { type, id } = req.query;

      if (type === 'delete' && id) {
        await collection.deleteOne({ _id: new ObjectId(id as string) });
        return res.status(200).json({ message: 'Recorrência removida com sucesso.' });
      }

      return res.status(400).json({ message: 'DELETE: Nenhum query.type identificado.' });
    }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
