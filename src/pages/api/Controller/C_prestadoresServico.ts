import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb';

const lookupUsuarioPipeline = [
  {
    $addFields: { usuarioObjectId: { $toObjectId: '$usuarioId' } },
  },
  {
    $lookup: {
      from: 'usuario',
      localField: 'usuarioObjectId',
      foreignField: '_id',
      as: 'usuarioArr',
    },
  },
  {
    $addFields: {
      usuario: {
        $let: {
          vars: { u: { $arrayElemAt: ['$usuarioArr', 0] } },
          in: {
            _id: { $toString: '$$u._id' },
            nome: '$$u.nome',
            sobrenome: '$$u.sobrenome',
            email: '$$u.email',
            funcao: '$$u.funcao',
            foto_cdn: '$$u.foto_cdn',
            foto_base64: '$$u.foto_base64',
          },
        },
      },
    },
  },
  { $project: { usuarioObjectId: 0, usuarioArr: 0 } },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const collection = db.collection('prestadores_servico');

  switch (req.method) {

    case 'GET':

      // -------------------------
      // GET All (enriquecido com usuario)
      // -------------------------
      if (req.query.type === 'getAll') {
        try {
          const matchStage: any = {};
          if (req.query.status) matchStage.status = req.query.status;
          if (req.query.tipoServico) matchStage['contrato.tipoServico'] = req.query.tipoServico;

          const pipeline: any[] = [
            { $match: matchStage },
            ...lookupUsuarioPipeline,
            { $sort: { 'usuario.nome': 1 } },
          ];
          const documents = await collection.aggregate(pipeline).toArray();
          return res.status(200).json(documents);
        } catch (err) {
          console.error('[C_prestadoresServico]', err);
          return res.status(500).json({ message: 'getAll: Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // GET by ID
      // -------------------------
      else if (req.query.type === 'getById' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const pipeline: any[] = [
            { $match: { _id: new ObjectId(reqId) } },
            ...lookupUsuarioPipeline,
          ];
          const result = await collection.aggregate(pipeline).toArray();
          if (!result.length) return res.status(404).json({ message: 'Prestador não encontrado.' });
          return res.status(200).json(result[0]);
        } catch (err) {
          console.error('[C_prestadoresServico]', err);
          return res.status(500).json({ message: 'getById: Erro não identificado.' });
        }
      }

      else {
        return res.status(400).json({ message: 'GET: Nenhum query.type identificado.' });
      }

    case 'POST':

      // -------------------------
      // CREATE Novo Prestador
      // -------------------------
      if (req.query.type === 'new') {
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const { usuarioId, contrato, tipoPessoa, createdBy } = body;

          if (!usuarioId) return res.status(400).json({ message: 'Campo obrigatório ausente: usuarioId.' });
          if (!tipoPessoa) return res.status(400).json({ message: 'Campo obrigatório ausente: tipoPessoa.' });
          if (!contrato?.tipoServico || !contrato?.tipoCobranca || !contrato?.valor || !contrato?.dataInicio) {
            return res.status(400).json({ message: 'Campos obrigatórios do contrato ausentes: tipoServico, tipoCobranca, valor, dataInicio.' });
          }

          const usuariosCollection = db.collection('usuario');
          const usuarioExiste = await usuariosCollection.findOne({ _id: new ObjectId(usuarioId) });
          if (!usuarioExiste) return res.status(404).json({ message: 'Usuário não encontrado.' });

          const jaExiste = await collection.findOne({ usuarioId });
          if (jaExiste) return res.status(409).json({ message: 'Este usuário já possui um registro de prestador.' });

          const now = new Date().toISOString();
          const doc = {
            usuarioId,
            status: 'ativo',
            tipoPessoa,
            dados: body.dados ?? {},
            endereco: body.endereco ?? {},
            contrato,
            dadosBancarios: body.dadosBancarios ?? {},
            observacoes: body.observacoes ?? '',
            createdBy: createdBy ?? '',
            createdAt: now,
            updatedAt: now,
          };

          const result = await collection.insertOne(doc);
          return res.status(201).json({ id: result.insertedId, message: 'Prestador cadastrado com sucesso.' });
        } catch (err) {
          console.error('[C_prestadoresServico]', err);
          return res.status(500).json({ message: 'new: Erro não identificado.' });
        }
      }

      else {
        return res.status(400).json({ message: 'POST: Nenhum query.type identificado.' });
      }

    case 'PUT':

      // -------------------------
      // UPDATE Contrato
      // -------------------------
      if (req.query.type === 'updateContrato' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const result = await collection.updateOne(
            { _id: new ObjectId(reqId) },
            { $set: { contrato: body.contrato, updatedAt: new Date().toISOString() } }
          );
          if (result.matchedCount === 0) return res.status(404).json({ message: 'Prestador não encontrado.' });
          return res.status(200).json({ message: 'Contrato atualizado com sucesso.' });
        } catch (err) {
          console.error('[C_prestadoresServico]', err);
          return res.status(500).json({ message: 'updateContrato: Erro não identificado.' });
        }
      }

      // -------------------------
      // UPDATE Dados + Endereço
      // -------------------------
      else if (req.query.type === 'updateDados' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const result = await collection.updateOne(
            { _id: new ObjectId(reqId) },
            { $set: { dados: body.dados, endereco: body.endereco, tipoPessoa: body.tipoPessoa, updatedAt: new Date().toISOString() } }
          );
          if (result.matchedCount === 0) return res.status(404).json({ message: 'Prestador não encontrado.' });
          return res.status(200).json({ message: 'Dados atualizados com sucesso.' });
        } catch (err) {
          console.error('[C_prestadoresServico]', err);
          return res.status(500).json({ message: 'updateDados: Erro não identificado.' });
        }
      }

      // -------------------------
      // UPDATE Dados Bancários
      // -------------------------
      else if (req.query.type === 'updateBancarios' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const result = await collection.updateOne(
            { _id: new ObjectId(reqId) },
            { $set: { dadosBancarios: body.dadosBancarios, updatedAt: new Date().toISOString() } }
          );
          if (result.matchedCount === 0) return res.status(404).json({ message: 'Prestador não encontrado.' });
          return res.status(200).json({ message: 'Dados bancários atualizados com sucesso.' });
        } catch (err) {
          console.error('[C_prestadoresServico]', err);
          return res.status(500).json({ message: 'updateBancarios: Erro não identificado.' });
        }
      }

      // -------------------------
      // UPDATE Observações
      // -------------------------
      else if (req.query.type === 'updateObservacoes' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const result = await collection.updateOne(
            { _id: new ObjectId(reqId) },
            { $set: { observacoes: body.observacoes, updatedAt: new Date().toISOString() } }
          );
          if (result.matchedCount === 0) return res.status(404).json({ message: 'Prestador não encontrado.' });
          return res.status(200).json({ message: 'Observações atualizadas com sucesso.' });
        } catch (err) {
          console.error('[C_prestadoresServico]', err);
          return res.status(500).json({ message: 'updateObservacoes: Erro não identificado.' });
        }
      }

      // -------------------------
      // UPDATE Status
      // -------------------------
      else if (req.query.type === 'updateStatus' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const validStatus = ['ativo', 'inativo', 'suspenso'];
          if (!validStatus.includes(body.status)) {
            return res.status(400).json({ message: 'Status inválido.' });
          }
          const result = await collection.updateOne(
            { _id: new ObjectId(reqId) },
            { $set: { status: body.status, updatedAt: new Date().toISOString() } }
          );
          if (result.matchedCount === 0) return res.status(404).json({ message: 'Prestador não encontrado.' });
          return res.status(200).json({ message: 'Status atualizado com sucesso.' });
        } catch (err) {
          console.error('[C_prestadoresServico]', err);
          return res.status(500).json({ message: 'updateStatus: Erro não identificado.' });
        }
      }

      else {
        return res.status(400).json({ message: 'PUT: Nenhum query.type identificado.' });
      }

    default:
      return res.status(405).json({ message: 'Método não permitido.' });
  }
}
