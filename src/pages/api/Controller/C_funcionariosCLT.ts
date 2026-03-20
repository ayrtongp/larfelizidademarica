import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const collection = db.collection('funcionarios_clt');

  switch (req.method) {

    case 'GET':

      // -------------------------
      // GET All (enriquecido com dados do usuario)
      // -------------------------
      if (req.query.type === 'getAll' || req.query.type === 'getAtivos') {
        try {
          const matchStage: any = {};
          if (req.query.type === 'getAtivos') {
            matchStage.status = 'ativo';
          } else if (req.query.status) {
            matchStage.status = req.query.status;
          }
          if (req.query.setor) {
            matchStage['contrato.setor'] = req.query.setor;
          }

          const pipeline = [
            { $match: matchStage },
            {
              $addFields: {
                usuarioObjectId: { $toObjectId: '$usuarioId' },
              },
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
            { $sort: { 'usuario.nome': 1 } },
          ];

          const documents = await collection.aggregate(pipeline).toArray();
          return res.status(200).json(documents);
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'getAll: Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // GET by ID (enriquecido)
      // -------------------------
      else if (req.query.type === 'getById' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const pipeline = [
            { $match: { _id: new ObjectId(reqId) } },
            {
              $addFields: {
                usuarioObjectId: { $toObjectId: '$usuarioId' },
              },
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

          const result = await collection.aggregate(pipeline).toArray();
          if (!result.length) {
            return res.status(404).json({ message: 'Funcionário não encontrado.' });
          }
          return res.status(200).json(result[0]);
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
      // CREATE Novo Funcionário CLT
      // -------------------------
      if (req.query.type === 'new') {
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const { usuarioId, contrato, createdBy } = body;

          if (!usuarioId) {
            return res.status(400).json({ message: 'Campo obrigatório ausente: usuarioId.' });
          }
          if (!contrato?.cargo || !contrato?.setor || !contrato?.salarioBase || !contrato?.tipoContrato || !contrato?.cargaHorariaSemanal || !contrato?.dataAdmissao) {
            return res.status(400).json({ message: 'Campos obrigatórios do contrato ausentes: cargo, setor, salarioBase, tipoContrato, cargaHorariaSemanal, dataAdmissao.' });
          }

          // Verifica se usuarioId existe
          const usuariosCollection = db.collection('usuario');
          const usuarioExiste = await usuariosCollection.findOne({ _id: new ObjectId(usuarioId) });
          if (!usuarioExiste) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
          }

          // Verifica se já existe registro CLT para esse usuário
          const jaExiste = await collection.findOne({ usuarioId });
          if (jaExiste) {
            return res.status(409).json({ message: 'Este usuário já possui um registro CLT.' });
          }

          const now = new Date().toISOString();
          const dataFields = {
            usuarioId,
            status: 'ativo',
            contrato,
            dadosPessoais: body.dadosPessoais ?? { cpf: '' },
            endereco: body.endereco ?? {},
            ctps: body.ctps ?? {},
            pisPasep: body.pisPasep ?? '',
            beneficios: body.beneficios ?? {
              valeTransporte: false,
              valeAlimentacao: false,
              planoSaude: false,
              planoOdontologico: false,
              seguroVida: false,
            },
            dadosBancarios: body.dadosBancarios ?? {},
            saudeOcupacional: { asos: [] },
            contatoEmergencia: body.contatoEmergencia ?? {},
            observacoes: body.observacoes ?? '',
            createdBy: createdBy ?? '',
            createdAt: now,
            updatedAt: now,
          };

          const result = await collection.insertOne(dataFields);
          return res.status(201).json({ id: result.insertedId, message: 'Funcionário CLT cadastrado com sucesso.' });
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
          if (result.matchedCount === 0) return res.status(404).json({ message: 'Funcionário não encontrado.' });
          return res.status(200).json({ message: 'Contrato atualizado com sucesso.' });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'updateContrato: Erro não identificado.' });
        }
      }

      // -------------------------
      // UPDATE Dados Pessoais + Endereço
      // -------------------------
      else if (req.query.type === 'updateDadosPessoais' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const result = await collection.updateOne(
            { _id: new ObjectId(reqId) },
            {
              $set: {
                dadosPessoais: body.dadosPessoais,
                endereco: body.endereco,
                ctps: body.ctps,
                pisPasep: body.pisPasep ?? '',
                updatedAt: new Date().toISOString(),
              },
            }
          );
          if (result.matchedCount === 0) return res.status(404).json({ message: 'Funcionário não encontrado.' });
          return res.status(200).json({ message: 'Dados pessoais atualizados com sucesso.' });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'updateDadosPessoais: Erro não identificado.' });
        }
      }

      // -------------------------
      // UPDATE Benefícios
      // -------------------------
      else if (req.query.type === 'updateBeneficios' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const result = await collection.updateOne(
            { _id: new ObjectId(reqId) },
            { $set: { beneficios: body.beneficios, updatedAt: new Date().toISOString() } }
          );
          if (result.matchedCount === 0) return res.status(404).json({ message: 'Funcionário não encontrado.' });
          return res.status(200).json({ message: 'Benefícios atualizados com sucesso.' });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'updateBeneficios: Erro não identificado.' });
        }
      }

      // -------------------------
      // UPDATE Dados Bancários
      // -------------------------
      else if (req.query.type === 'updateDadosBancarios' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const result = await collection.updateOne(
            { _id: new ObjectId(reqId) },
            { $set: { dadosBancarios: body.dadosBancarios, updatedAt: new Date().toISOString() } }
          );
          if (result.matchedCount === 0) return res.status(404).json({ message: 'Funcionário não encontrado.' });
          return res.status(200).json({ message: 'Dados bancários atualizados com sucesso.' });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'updateDadosBancarios: Erro não identificado.' });
        }
      }

      // -------------------------
      // UPDATE Contato de Emergência
      // -------------------------
      else if (req.query.type === 'updateEmergencia' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const result = await collection.updateOne(
            { _id: new ObjectId(reqId) },
            { $set: { contatoEmergencia: body.contatoEmergencia, updatedAt: new Date().toISOString() } }
          );
          if (result.matchedCount === 0) return res.status(404).json({ message: 'Funcionário não encontrado.' });
          return res.status(200).json({ message: 'Contato de emergência atualizado com sucesso.' });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'updateEmergencia: Erro não identificado.' });
        }
      }

      // -------------------------
      // ADD ASO
      // -------------------------
      else if (req.query.type === 'addASO' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const result = await collection.updateOne(
            { _id: new ObjectId(reqId) },
            {
              $push: { 'saudeOcupacional.asos': body.aso } as any,
              $set: { updatedAt: new Date().toISOString() },
            }
          );
          if (result.matchedCount === 0) return res.status(404).json({ message: 'Funcionário não encontrado.' });
          return res.status(200).json({ message: 'ASO adicionado com sucesso.' });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'addASO: Erro não identificado.' });
        }
      }

      // -------------------------
      // UPDATE ASO by index
      // -------------------------
      else if (req.query.type === 'updateASO' && req.query.id && req.query.asoIndex !== undefined) {
        const reqId = req.query.id as string;
        const asoIndex = parseInt(req.query.asoIndex as string, 10);
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const setFields: any = { updatedAt: new Date().toISOString() };
          setFields[`saudeOcupacional.asos.${asoIndex}`] = body.aso;
          const result = await collection.updateOne(
            { _id: new ObjectId(reqId) },
            { $set: setFields }
          );
          if (result.matchedCount === 0) return res.status(404).json({ message: 'Funcionário não encontrado.' });
          return res.status(200).json({ message: 'ASO atualizado com sucesso.' });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'updateASO: Erro não identificado.' });
        }
      }

      // -------------------------
      // DELETE ASO by index
      // -------------------------
      else if (req.query.type === 'deleteASO' && req.query.id && req.query.asoIndex !== undefined) {
        const reqId = req.query.id as string;
        const asoIndex = parseInt(req.query.asoIndex as string, 10);
        try {
          // Usar null + pull para remover pelo índice
          const unsetFields: any = {};
          unsetFields[`saudeOcupacional.asos.${asoIndex}`] = 1;
          await collection.updateOne({ _id: new ObjectId(reqId) }, { $unset: unsetFields });
          await collection.updateOne(
            { _id: new ObjectId(reqId) },
            { $pull: { 'saudeOcupacional.asos': null } as any, $set: { updatedAt: new Date().toISOString() } }
          );
          return res.status(200).json({ message: 'ASO removido com sucesso.' });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'deleteASO: Erro não identificado.' });
        }
      }

      // -------------------------
      // DEMITIR
      // -------------------------
      else if (req.query.type === 'demitir' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const result = await collection.updateOne(
            { _id: new ObjectId(reqId) },
            {
              $set: {
                status: 'demitido',
                dataDemissao: body.dataDemissao,
                tipoDemissao: body.tipoDemissao,
                motivoDemissao: body.motivoDemissao ?? '',
                updatedAt: new Date().toISOString(),
              },
            }
          );
          if (result.matchedCount === 0) return res.status(404).json({ message: 'Funcionário não encontrado.' });
          return res.status(200).json({ message: 'Funcionário demitido com sucesso.' });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'demitir: Erro não identificado.' });
        }
      }

      // -------------------------
      // REATIVAR
      // -------------------------
      else if (req.query.type === 'reativar' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const result = await collection.updateOne(
            { _id: new ObjectId(reqId) },
            {
              $set: { status: 'ativo', updatedAt: new Date().toISOString() },
              $unset: { dataDemissao: '', tipoDemissao: '', motivoDemissao: '' },
            }
          );
          if (result.matchedCount === 0) return res.status(404).json({ message: 'Funcionário não encontrado.' });
          return res.status(200).json({ message: 'Funcionário reativado com sucesso.' });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'reativar: Erro não identificado.' });
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
            { $set: { observacoes: body.observacoes ?? '', updatedAt: new Date().toISOString() } }
          );
          if (result.matchedCount === 0) return res.status(404).json({ message: 'Funcionário não encontrado.' });
          return res.status(200).json({ message: 'Observações atualizadas com sucesso.' });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'updateObservacoes: Erro não identificado.' });
        }
      }

      // -------------------------
      // UPDATE Status (afastado / ferias)
      // -------------------------
      else if (req.query.type === 'updateStatus' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const statusPermitidos = ['ativo', 'afastado', 'ferias'];
          if (!statusPermitidos.includes(body.status)) {
            return res.status(400).json({ message: 'Status inválido. Use: ativo, afastado ou ferias.' });
          }
          const result = await collection.updateOne(
            { _id: new ObjectId(reqId) },
            { $set: { status: body.status, updatedAt: new Date().toISOString() } }
          );
          if (result.matchedCount === 0) return res.status(404).json({ message: 'Funcionário não encontrado.' });
          return res.status(200).json({ message: 'Status atualizado com sucesso.' });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'updateStatus: Erro não identificado.' });
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
