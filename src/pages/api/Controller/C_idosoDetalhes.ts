import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb';

// Pipeline unificado: usa patient (novos registros) com fallback para usuario (legado).
// Usa $lookup com pipeline/$expr + $toString:'$_id' para evitar $toObjectId em campos
// possivelmente nulos, que causa falha em algumas versões do MongoDB.
const lookupUsuarioPipeline = [
  // Lookup patient via comparação de strings (compatível com qualquer versão)
  {
    $lookup: {
      from: 'patient',
      let: { pid: '$patient_id' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $ne: ['$$pid', null] },
                { $ne: ['$$pid', ''] },
                { $eq: [{ $toString: '$_id' }, '$$pid'] },
              ],
            },
          },
        },
      ],
      as: '_patientArr',
    },
  },
  // Lookup usuario (legado) via comparação de strings
  {
    $lookup: {
      from: 'usuario',
      let: { uid: '$usuarioId' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $ne: ['$$uid', null] },
                { $ne: ['$$uid', ''] },
                { $eq: [{ $toString: '$_id' }, '$$uid'] },
              ],
            },
          },
        },
      ],
      as: '_usuarioArr',
    },
  },
  {
    $addFields: {
      _p: { $arrayElemAt: ['$_patientArr', 0] },
      _u: { $arrayElemAt: ['$_usuarioArr', 0] },
    },
  },
  // Monta campo `usuario` priorizando patient, caindo em usuario para registros legados
  {
    $addFields: {
      usuario: {
        _id:             { $ifNull: [{ $toString: '$_p._id' }, { $toString: '$_u._id' }] },
        nome:            { $ifNull: ['$_p.given_name',   '$_u.nome'] },
        sobrenome:       { $ifNull: ['$_p.family_name',  '$_u.sobrenome'] },
        apelido:         { $ifNull: ['$_u.apelido',      null] },
        email:           { $ifNull: ['$_p.email',        '$_u.email'] },
        cpf:             { $ifNull: ['$_p.cpf',          '$_u.cpf'] },
        data_nascimento: { $ifNull: ['$_p.birth_date',   '$_u.data_nascimento'] },
        genero:          { $ifNull: ['$_p.gender',       '$_u.genero'] },
        foto_cdn:        { $ifNull: ['$_p.photo_url',     '$_u.foto_cdn'] },
        foto_base64:     { $ifNull: ['$_p.photo',        '$_u.foto_base64'] },
      },
      patient: '$_p',
    },
  },
  { $project: { _patientArr: 0, _usuarioArr: 0, _p: 0, _u: 0 } },
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
          const totalDocs = await collection.countDocuments({});
          console.log('[C_idosoDetalhes] total docs na collection:', totalDocs);
          const documents = await collection.aggregate(pipeline).toArray();
          console.log('[C_idosoDetalhes] pipeline retornou:', documents.length);
          return res.status(200).json(documents);
        } catch (err) {
          console.error('[C_idosoDetalhes] getAll error:', err);
          return res.status(500).json({ message: 'getAll: Erro não identificado.', error: String(err) });
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
          const { patient: patientData, admissao, createdBy } = body;

          if (!patientData?.nome || !patientData?.sobrenome) {
            return res.status(400).json({ message: 'Campos obrigatórios ausentes: patient.nome, patient.sobrenome.' });
          }
          if (!admissao?.dataEntrada || !admissao?.modalidadePrincipal) {
            return res.status(400).json({ message: 'Campos obrigatórios de admissão ausentes: dataEntrada, modalidadePrincipal.' });
          }

          const now = new Date().toISOString();
          const displayName = `${patientData.nome} ${patientData.sobrenome}`.trim();

          // Monta identificadores
          const identifiers: any[] = [];
          if (patientData.cpf) identifiers.push({ system: 'cpf', value: patientData.cpf });
          if (admissao.numProntuario) identifiers.push({ system: 'prontuario', value: admissao.numProntuario });

          // Monta telecom
          const telecom: any[] = [];
          if (patientData.phone) telecom.push({ system: 'phone', value: patientData.phone, use: 'mobile' });

          // Cria Patient FHIR-aligned
          const patientCol = db.collection('patient');
          const patientDoc = {
            resourceType: 'Patient',
            identifier: identifiers,
            name: [{
              use: 'official',
              family: patientData.sobrenome,
              given: [patientData.nome],
              text: displayName,
            }],
            gender: patientData.gender ?? 'unknown',
            birthDate: patientData.birthDate ?? '',
            telecom,
            address: [],
            contact: [],
            extension: {},
            photo: patientData.photo ?? undefined,
            active: true,
            // Campos denormalizados (compat com pipeline)
            given_name:   patientData.nome,
            family_name:  patientData.sobrenome,
            display_name: displayName,
            birth_date:   patientData.birthDate ?? '',
            cpf:          patientData.cpf ?? undefined,
            createdBy:    createdBy ?? '',
            createdAt:    now,
            updatedAt:    now,
          };
          const patientResult = await patientCol.insertOne(patientDoc);
          const patientId = String(patientResult.insertedId);

          // Cria idoso_detalhes vinculado ao patient
          const idosoDoc = {
            patient_id: patientId,
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
          const idosoResult = await collection.insertOne(idosoDoc);
          const idosoId = String(idosoResult.insertedId);

          // Atualiza patient com o idoso_detalhes_id
          await patientCol.updateOne(
            { _id: patientResult.insertedId },
            { $set: { idoso_detalhes_id: idosoId } }
          );

          return res.status(201).json({ id: idosoResult.insertedId, message: 'Idoso admitido com sucesso.' });
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
      // UPDATE Status
// -------------------------
      else if (req.query.type === 'updateStatus' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const validStatus = ['ativo', 'inativo', 'falecido', 'afastado'];
          if (!validStatus.includes(body.status)) return res.status(400).json({ message: 'Status inválido.' });

          const setFields: any = { status: body.status, updatedAt: new Date().toISOString() };
          if (body.status === 'inativo' && body.dataSaida) {
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
