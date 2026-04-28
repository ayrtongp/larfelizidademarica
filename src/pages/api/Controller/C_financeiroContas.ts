import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const collection = db.collection('financeiro_contas');

  switch (req.method) {

    case 'GET':

      // -------------------------
      // GET All Contas
      // -------------------------
      if (req.query.type === 'getAll') {
        try {
          const documents = await collection
            .find()
            .sort({ nome: 1 })
            .toArray();
          return res.status(200).json(documents);
        } catch (err) {
          console.error('[C_financeiroContas]', err);
          return res.status(500).json({ message: 'getAll: Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // GET Contas Ativas
      // -------------------------
      else if (req.query.type === 'getAtivas') {
        try {
          const documents = await collection
            .find({ ativo: true })
            .sort({ nome: 1 })
            .toArray();
          return res.status(200).json(documents);
        } catch (err) {
          console.error('[C_financeiroContas]', err);
          return res.status(500).json({ message: 'getAtivas: Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // GET Conta by ID
      // -------------------------
      else if (req.query.type === 'getById' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const document = await collection.findOne({ _id: new ObjectId(reqId) });
          if (!document) {
            return res.status(404).json({ message: 'Conta não encontrada.' });
          }
          return res.status(200).json(document);
        } catch (err) {
          console.error('[C_financeiroContas]', err);
          return res.status(500).json({ message: 'getById: Erro não identificado. Procure um administrador.' });
        }
      }

      else {
        return res.status(400).json({ message: 'GET: Nenhum query.type identificado.' });
      }

    case 'POST':

      // -------------------------
      // CREATE Nova Conta
      // -------------------------
      if (req.query.type === 'new') {
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

          if (!body.nome || !body.tipo || body.saldoInicial === undefined) {
            return res.status(400).json({ message: 'Campos obrigatórios ausentes: nome, tipo, saldoInicial.' });
          }

          if (!['banco', 'caixa', 'aplicacao'].includes(body.tipo)) {
            return res.status(400).json({ message: 'Tipo inválido. Use "banco", "caixa" ou "aplicacao".' });
          }

          const dataFields = {
            nome: body.nome,
            tipo: body.tipo,
            banco: body.banco ?? null,
            saldoInicial: Number(body.saldoInicial),
            ativo: body.ativo !== undefined ? body.ativo : true,
            modeloImportacao: body.modeloImportacao ?? null,
            observacoes: body.observacoes ?? null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const result = await collection.insertOne(dataFields);
          return res.status(201).json({ id: result.insertedId, message: 'Conta financeira criada com sucesso.' });
        } catch (err) {
          console.error('[C_financeiroContas]', err);
          return res.status(500).json({ message: 'new: Erro não identificado. Procure um administrador.' });
        }
      }

      else {
        return res.status(400).json({ message: 'POST: Nenhum query.type identificado.' });
      }

    case 'PUT':

      // -------------------------
      // UPDATE Conta
      // -------------------------
      if (req.query.type === 'update' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const updateData = { ...body, updatedAt: new Date().toISOString() };
          delete updateData._id;

          if (updateData.saldoInicial !== undefined) {
            updateData.saldoInicial = Number(updateData.saldoInicial);
          }

          const result = await collection.updateOne(
            { _id: new ObjectId(reqId) },
            { $set: updateData }
          );

          if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Conta não encontrada.' });
          }

          return res.status(200).json({ message: 'Conta atualizada com sucesso.' });
        } catch (err) {
          console.error('[C_financeiroContas]', err);
          return res.status(500).json({ message: 'update: Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // TOGGLE Ativo
      // -------------------------
      else if (req.query.type === 'toggleAtivo' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const current = await collection.findOne({ _id: new ObjectId(reqId) });
          if (!current) {
            return res.status(404).json({ message: 'Conta não encontrada.' });
          }

          const novoAtivo = !current.ativo;
          await collection.updateOne(
            { _id: new ObjectId(reqId) },
            { $set: { ativo: novoAtivo, updatedAt: new Date().toISOString() } }
          );

          return res.status(200).json({ message: `Conta ${novoAtivo ? 'ativada' : 'desativada'} com sucesso.` });
        } catch (err) {
          console.error('[C_financeiroContas]', err);
          return res.status(500).json({ message: 'toggleAtivo: Erro não identificado. Procure um administrador.' });
        }
      }

      else {
        return res.status(400).json({ message: 'PUT: Nenhum query.type identificado.' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
