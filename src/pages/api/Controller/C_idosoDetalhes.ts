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
            cpf: '$$u.cpf',
            data_nascimento: '$$u.data_nascimento',
            genero: '$$u.genero',
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
  const collection = db.collection('idoso_detalhes');

  switch (req.method) {

    case 'GET':

      // -------------------------
      // GET All (enriquecido com usuario)
      // -------------------------
      if (req.query.type === 'getAll' || req.query.type === 'getAtivos') {
        try {
          const matchStage: any = {};
          if (req.query.type === 'getAtivos') matchStage.status = 'ativo';
          else if (req.query.status) matchStage.status = req.query.status;
          if (req.query.modalidade) matchStage['admissao.modalidadePrincipal'] = req.query.modalidade;

          const pipeline: any[] = [
            { $match: matchStage },
            ...lookupUsuarioPipeline,
            { $sort: { 'usuario.nome': 1 } },
          ];
          const documents = await collection.aggregate(pipeline).toArray();
          return res.status(200).json(documents);
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'getAll: Erro não identificado.' });
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
          if (!result.length) return res.status(404).json({ message: 'Idoso não encontrado.' });
          return res.status(200).json(result[0]);
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'getById: Erro não identificado.' });
        }
      }

      else {
        return res.status(400).json({ message: 'GET: Nenhum query.type identificado.' });
      }

    case 'POST':

      // -------------------------
      // CREATE Novo Idoso
      // -------------------------
      if (req.query.type === 'new') {
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const { usuarioId, admissao, createdBy } = body;

          if (!usuarioId) return res.status(400).json({ message: 'Campo obrigatório ausente: usuarioId.' });
          if (!admissao?.dataEntrada || !admissao?.modalidadePrincipal) {
            return res.status(400).json({ message: 'Campos obrigatórios de admissão ausentes: dataEntrada, modalidadePrincipal.' });
          }

          // Verificar se usuário existe
          const usuariosCollection = db.collection('usuario');
          const usuarioExiste = await usuariosCollection.findOne({ _id: new ObjectId(usuarioId) });
          if (!usuarioExiste) return res.status(404).json({ message: 'Usuário não encontrado.' });

          // Verificar se já tem registro ativo
          const jaExiste = await collection.findOne({ usuarioId, status: { $ne: 'alta' } });
          if (jaExiste) return res.status(409).json({ message: 'Este usuário já possui um registro de idoso ativo.' });

          const now = new Date().toISOString();
          const doc = {
            usuarioId,
            status: 'ativo',
            admissao,
            responsavel: body.responsavel ?? {},
            composicaoFamiliar: body.composicaoFamiliar ?? [],
            historico: body.historico ?? {},
            documentos: body.documentos ?? {},
            observacoes: body.observacoes ?? '',
            createdBy: createdBy ?? '',
            createdAt: now,
            updatedAt: now,
          };

          const result = await collection.insertOne(doc);
          return res.status(201).json({ id: result.insertedId, message: 'Idoso admitido com sucesso.' });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'new: Erro não identificado.' });
        }
      }

      else {
        return res.status(400).json({ message: 'POST: Nenhum query.type identificado.' });
      }

    case 'PUT':

      // -------------------------
      // UPDATE Admissão
      // -------------------------
      if (req.query.type === 'updateAdmissao' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const result = await collection.updateOne(
            { _id: new ObjectId(reqId) },
            { $set: { admissao: body.admissao, updatedAt: new Date().toISOString() } }
          );
          if (result.matchedCount === 0) return res.status(404).json({ message: 'Idoso não encontrado.' });
          return res.status(200).json({ message: 'Admissão atualizada.' });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'updateAdmissao: Erro não identificado.' });
        }
      }

      // -------------------------
      // UPDATE Responsável
      // -------------------------
      else if (req.query.type === 'updateResponsavel' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const result = await collection.updateOne(
            { _id: new ObjectId(reqId) },
            { $set: { responsavel: body.responsavel, updatedAt: new Date().toISOString() } }
          );
          if (result.matchedCount === 0) return res.status(404).json({ message: 'Idoso não encontrado.' });
          return res.status(200).json({ message: 'Responsável atualizado.' });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'updateResponsavel: Erro não identificado.' });
        }
      }

      // -------------------------
      // UPDATE Família
      // -------------------------
      else if (req.query.type === 'updateFamilia' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const result = await collection.updateOne(
            { _id: new ObjectId(reqId) },
            { $set: { composicaoFamiliar: body.composicaoFamiliar, updatedAt: new Date().toISOString() } }
          );
          if (result.matchedCount === 0) return res.status(404).json({ message: 'Idoso não encontrado.' });
          return res.status(200).json({ message: 'Família atualizada.' });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'updateFamilia: Erro não identificado.' });
        }
      }

      // -------------------------
      // UPDATE Histórico
      // -------------------------
      else if (req.query.type === 'updateHistorico' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const result = await collection.updateOne(
            { _id: new ObjectId(reqId) },
            { $set: { historico: body.historico, documentos: body.documentos, updatedAt: new Date().toISOString() } }
          );
          if (result.matchedCount === 0) return res.status(404).json({ message: 'Idoso não encontrado.' });
          return res.status(200).json({ message: 'Histórico atualizado.' });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'updateHistorico: Erro não identificado.' });
        }
      }

      // -------------------------
      // UPDATE Status (alta, reativar, afastar)
      // -------------------------
      else if (req.query.type === 'updateStatus' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const validStatus = ['ativo', 'alta', 'falecido', 'afastado'];
          if (!validStatus.includes(body.status)) return res.status(400).json({ message: 'Status inválido.' });

          const setFields: any = { status: body.status, updatedAt: new Date().toISOString() };
          if (body.status === 'alta' && body.dataSaida) {
            setFields['admissao.dataSaida'] = body.dataSaida;
            setFields['admissao.motivoSaida'] = body.motivoSaida ?? '';
          }

          const result = await collection.updateOne(
            { _id: new ObjectId(reqId) },
            { $set: setFields }
          );
          if (result.matchedCount === 0) return res.status(404).json({ message: 'Idoso não encontrado.' });
          return res.status(200).json({ message: 'Status atualizado.' });
        } catch (err) {
          console.error(err);
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
