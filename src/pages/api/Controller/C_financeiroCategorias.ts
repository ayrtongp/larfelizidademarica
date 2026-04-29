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
          console.error('[C_financeiroCategorias]', err);
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
          console.error('[C_financeiroCategorias]', err);
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

          if (!['receita', 'despesa', 'transferencia', 'sistema'].includes(body.tipo)) {
            return res.status(400).json({ message: 'Tipo inválido. Use "receita", "despesa", "transferencia" ou "sistema".' });
          }

          const duplicado = await collection.findOne({
            nome: { $regex: `^${body.nome.trim()}$`, $options: 'i' },
            tipo: body.tipo,
          });
          if (duplicado) {
            return res.status(400).json({ message: `Já existe uma categoria do tipo "${body.tipo}" com o nome "${body.nome}".` });
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
          console.error('[C_financeiroCategorias]', err);
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

          if (body.nome && body.tipo) {
            const duplicado = await collection.findOne({
              _id: { $ne: new ObjectId(reqId) },
              nome: { $regex: `^${body.nome.trim()}$`, $options: 'i' },
              tipo: body.tipo,
            });
            if (duplicado) {
              return res.status(400).json({ message: `Já existe uma categoria do tipo "${body.tipo}" com o nome "${body.nome}".` });
            }
          }

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
          console.error('[C_financeiroCategorias]', err);
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
          console.error('[C_financeiroCategorias]', err);
          return res.status(500).json({ message: 'toggleAtivo: Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // MESCLAR — migra movimentações e rateios da origemId para destinoId e desativa a origem
      // -------------------------
      else if (req.query.type === 'mesclar') {
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const { origemId, destinoId } = body;
          if (!origemId || !destinoId) return res.status(400).json({ message: 'origemId e destinoId são obrigatórios.' });
          if (origemId === destinoId) return res.status(400).json({ message: 'Origem e destino não podem ser iguais.' });

          const movCol    = db.collection('financeiro_movimentacoes');
          const rateioCol = db.collection('financeiro_rateios');

          const [movResult, rateioResult] = await Promise.all([
            movCol.updateMany({ categoriaId: origemId }, { $set: { categoriaId: destinoId, updatedAt: new Date().toISOString() } }),
            rateioCol.updateMany({ categoriaId: origemId }, { $set: { categoriaId: destinoId, updatedAt: new Date().toISOString() } }),
          ]);

          await collection.updateOne(
            { _id: new ObjectId(origemId) },
            { $set: { ativo: false, updatedAt: new Date().toISOString() } }
          );

          return res.status(200).json({
            movimentacoesAtualizadas: movResult.modifiedCount,
            rateiosAtualizados: rateioResult.modifiedCount,
          });
        } catch (err) {
          console.error('[C_financeiroCategorias]', err);
          return res.status(500).json({ message: 'mesclar: Erro não identificado.' });
        }
      }

      else {
        return res.status(400).json({ message: 'PUT: Nenhum query.type identificado.' });
      }

    case 'DELETE':

      // -------------------------
      // DELETE Categoria (só se sem vínculos)
      // -------------------------
      if (req.query.id) {
        const reqId = req.query.id as string;
        try {
          const movCol    = db.collection('financeiro_movimentacoes');
          const rateioCol = db.collection('financeiro_rateios');

          const [movCount, rateioCount] = await Promise.all([
            movCol.countDocuments({ categoriaId: reqId }),
            rateioCol.countDocuments({ categoriaId: reqId }),
          ]);

          if (movCount > 0 || rateioCount > 0) {
            return res.status(400).json({
              message: `Não é possível excluir: a categoria possui ${movCount} movimentação(ões) e ${rateioCount} rateio(s) vinculados. Use Mesclar para migrar os dados antes.`,
            });
          }

          const result = await collection.deleteOne({ _id: new ObjectId(reqId) });
          if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Categoria não encontrada.' });
          }

          return res.status(200).json({ message: 'Categoria excluída com sucesso.' });
        } catch (err) {
          console.error('[C_financeiroCategorias]', err);
          return res.status(500).json({ message: 'delete: Erro não identificado. Procure um administrador.' });
        }
      }

      return res.status(400).json({ message: 'DELETE: id não informado.' });

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
