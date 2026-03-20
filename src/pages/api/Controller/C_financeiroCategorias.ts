import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const collection = db.collection('financeiro_categorias');

  switch (req.method) {

    case 'GET':

      // -------------------------
      // GET All Categorias
      // -------------------------
      if (req.query.type === 'getAll') {
        try {
          const documents = await collection
            .find()
            .sort({ tipo: 1, nome: 1 })
            .toArray();
          return res.status(200).json(documents);
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'getAll: Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // GET Categoria by ID
      // -------------------------
      else if (req.query.type === 'getById' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const document = await collection.findOne({ _id: new ObjectId(reqId) });
          if (!document) {
            return res.status(404).json({ message: 'Categoria não encontrada.' });
          }
          return res.status(200).json(document);
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'getById: Erro não identificado. Procure um administrador.' });
        }
      }

      else {
        return res.status(400).json({ message: 'GET: Nenhum query.type identificado.' });
      }

    case 'POST':

      // -------------------------
      // CREATE Nova Categoria
      // -------------------------
      if (req.query.type === 'new') {
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

          if (!body.nome || !body.tipo || body.ativo === undefined) {
            return res.status(400).json({ message: 'Campos obrigatórios ausentes: nome, tipo, ativo.' });
          }

          if (!['receita', 'despesa'].includes(body.tipo)) {
            return res.status(400).json({ message: 'Tipo inválido. Use "receita" ou "despesa".' });
          }

          const dataFields = {
            nome: body.nome,
            tipo: body.tipo,
            categoriaPaiId: body.categoriaPaiId ?? null,
            cor: body.cor ?? null,
            icone: body.icone ?? null,
            ordem: body.ordem ?? null,
            ativo: body.ativo,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const result = await collection.insertOne(dataFields);
          return res.status(201).json({ id: result.insertedId, message: 'Categoria criada com sucesso.' });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'new: Erro não identificado. Procure um administrador.' });
        }
      }

      else {
        return res.status(400).json({ message: 'POST: Nenhum query.type identificado.' });
      }

    case 'PUT':

      // -------------------------
      // UPDATE Categoria
      // -------------------------
      if (req.query.type === 'update' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const updateData = { ...body, updatedAt: new Date().toISOString() };
          delete updateData._id;

          const result = await collection.updateOne(
            { _id: new ObjectId(reqId) },
            { $set: updateData }
          );

          if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Categoria não encontrada.' });
          }

          return res.status(200).json({ message: 'Categoria atualizada com sucesso.' });
        } catch (err) {
          console.error(err);
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
            return res.status(404).json({ message: 'Categoria não encontrada.' });
          }

          const novoAtivo = !current.ativo;
          await collection.updateOne(
            { _id: new ObjectId(reqId) },
            { $set: { ativo: novoAtivo, updatedAt: new Date().toISOString() } }
          );

          return res.status(200).json({ message: `Categoria ${novoAtivo ? 'ativada' : 'desativada'} com sucesso.` });
        } catch (err) {
          console.error(err);
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
