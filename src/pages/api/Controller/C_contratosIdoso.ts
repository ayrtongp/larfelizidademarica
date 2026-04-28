import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const collection = db.collection('contratos_idoso');

  switch (req.method) {

    case 'GET':

      // -------------------------
      // GET Contratos por IdosoDetalhesId
      // -------------------------
      if (req.query.type === 'getByIdosoId' && req.query.idosoId) {
        try {
          const idosoId = req.query.idosoId as string;
          const documents = await collection
            .find({ idosoDetalhesId: idosoId })
            .sort({ createdAt: -1 })
            .toArray();
          return res.status(200).json(documents);
        } catch (err) {
          console.error('[C_contratosIdoso]', err);
          return res.status(500).json({ message: 'getByIdosoId: Erro não identificado.' });
        }
      }

      // -------------------------
      // GET All (com lookup do usuario)
      // -------------------------
      else if (req.query.type === 'getAll') {
        try {
          const matchStage: any = {};
          if (req.query.status) matchStage.status = req.query.status;
          if (req.query.modalidade) matchStage.modalidade = req.query.modalidade;

          const pipeline = [
            { $match: matchStage },
            { $addFields: { usuarioObjectId: { $toObjectId: '$usuarioId' } } },
            {
              $lookup: {
                from: 'usuario',
                localField: 'usuarioObjectId',
                foreignField: '_id',
                as: 'idosoArr',
              },
            },
            {
              $addFields: {
                idoso: {
                  $let: {
                    vars: { u: { $arrayElemAt: ['$idosoArr', 0] } },
                    in: {
                      _id: { $toString: '$$u._id' },
                      nome: '$$u.nome',
                      sobrenome: '$$u.sobrenome',
                      foto_cdn: '$$u.foto_cdn',
                      foto_base64: '$$u.foto_base64',
                    },
                  },
                },
              },
            },
            { $project: { usuarioObjectId: 0, idosoArr: 0 } },
            { $sort: { createdAt: -1 } },
          ];

          const documents = await collection.aggregate(pipeline).toArray();
          return res.status(200).json(documents);
        } catch (err) {
          console.error('[C_contratosIdoso]', err);
          return res.status(500).json({ message: 'getAll: Erro não identificado.' });
        }
      }

      // -------------------------
      // GET by ID
      // -------------------------
      else if (req.query.type === 'getById' && req.query.id) {
        try {
          const doc = await collection.findOne({ _id: new ObjectId(req.query.id as string) });
          if (!doc) return res.status(404).json({ message: 'Contrato não encontrado.' });
          return res.status(200).json(doc);
        } catch (err) {
          console.error('[C_contratosIdoso]', err);
          return res.status(500).json({ message: 'getById: Erro não identificado.' });
        }
      }

      else {
        return res.status(400).json({ message: 'GET: Nenhum query.type identificado.' });
      }

    case 'POST':

      // -------------------------
      // CREATE Novo Contrato
      // -------------------------
      if (req.query.type === 'new') {
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const { usuarioId, idosoDetalhesId, modalidade, tipoBilling, createdBy } = body;

          if (!usuarioId || !idosoDetalhesId || !modalidade || !tipoBilling) {
            return res.status(400).json({ message: 'Campos obrigatórios ausentes: usuarioId, idosoDetalhesId, modalidade, tipoBilling.' });
          }

          // Validações por tipo de billing
          if (tipoBilling === 'contrato_fechado' && !body.contratado?.valorMensalBase) {
            return res.status(400).json({ message: 'Contrato fechado requer valorMensalBase.' });
          }
          if (tipoBilling === 'pacote_avulso' && (!body.pacote?.totalDias || !body.pacote?.valorPorDia)) {
            return res.status(400).json({ message: 'Pacote avulso requer totalDias e valorPorDia.' });
          }

          const now = new Date().toISOString();
          const doc: any = {
            usuarioId,
            idosoDetalhesId,
            status: 'ativo',
            modalidade,
            tipoBilling,
            observacoes: body.observacoes ?? '',
            createdBy: createdBy ?? '',
            createdAt: now,
            updatedAt: now,
          };

          if (tipoBilling === 'contrato_fechado') doc.contratado = body.contratado;
          if (tipoBilling === 'pacote_avulso') doc.pacote = { ...body.pacote, diasUtilizados: 0 };
          if (tipoBilling === 'avulso') doc.avulso = body.avulso;

          const result = await collection.insertOne(doc);
          return res.status(201).json({ id: result.insertedId, message: 'Contrato criado com sucesso.' });
        } catch (err) {
          console.error('[C_contratosIdoso]', err);
          return res.status(500).json({ message: 'new: Erro não identificado.' });
        }
      }

      // -------------------------
      // Gerar Cobrança (cria TituloFinanceiro)
      // -------------------------
      else if (req.query.type === 'gerarCobranca') {
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const { contratoId, competencia, createdBy } = body; // competencia: 'YYYY-MM'

          if (!contratoId || !competencia) {
            return res.status(400).json({ message: 'contratoId e competencia são obrigatórios.' });
          }

          const contrato = await collection.findOne({ _id: new ObjectId(contratoId) });
          if (!contrato) return res.status(404).json({ message: 'Contrato não encontrado.' });
          if (contrato.status !== 'ativo') return res.status(400).json({ message: 'Contrato não está ativo.' });

          // Buscar nome do idoso
          const usuario = await db.collection('usuario').findOne({ _id: new ObjectId(contrato.usuarioId) });
          const nomeIdoso = usuario ? `${usuario.nome} ${usuario.sobrenome}` : 'Idoso';

          // Calcular valor
          let valorFinal = 0;
          if (contrato.tipoBilling === 'contrato_fechado' && contrato.contratado) {
            const descontos = (contrato.contratado.descontos ?? []).reduce((s: number, d: any) => s + d.valor, 0);
            const extras = (contrato.contratado.taxasExtras ?? []).reduce((s: number, t: any) => s + t.valor, 0);
            valorFinal = contrato.contratado.valorMensalBase - descontos + extras;
          } else if (contrato.tipoBilling === 'pacote_avulso' && contrato.pacote) {
            valorFinal = contrato.pacote.diasUtilizados * contrato.pacote.valorPorDia;
          } else if (contrato.tipoBilling === 'avulso' && contrato.avulso) {
            valorFinal = contrato.avulso.valorDiaria;
          }

          if (valorFinal <= 0) return res.status(400).json({ message: 'Valor calculado inválido. Verifique os dados do contrato.' });

          // Data de vencimento
          const [anoComp, mesComp] = competencia.split('-');
          const diaVenc = contrato.contratado?.diaVencimento ?? 10;
          const dataVencimento = `${anoComp}-${mesComp}-${String(diaVenc).padStart(2, '0')}`;

          // Criar título financeiro
          const MODALIDADE_LABELS: Record<string, string> = {
            residencia_fixa: 'Residência Fixa',
            residencia_temporaria: 'Residência Temporária',
            centro_dia: 'Centro Dia',
            hotelaria: 'Hotelaria',
          };

          const now = new Date().toISOString();
          const titulo = {
            residenteId: contrato.usuarioId,
            descricao: `[${MODALIDADE_LABELS[contrato.modalidade] ?? contrato.modalidade}] ${nomeIdoso} — ${competencia}`,
            valor: valorFinal,
            dataVencimento,
            tipo: 'receber',
            status: 'aberto',
            contratoId: contrato._id.toString(),
            competencia,
            createdBy: createdBy ?? '',
            createdAt: now,
            updatedAt: now,
          };

          const titulosCollection = db.collection('financeiro_titulos');
          const resultTitulo = await titulosCollection.insertOne(titulo);
          return res.status(201).json({ id: resultTitulo.insertedId, valor: valorFinal, message: 'Cobrança gerada com sucesso.' });
        } catch (err) {
          console.error('[C_contratosIdoso]', err);
          return res.status(500).json({ message: 'gerarCobranca: Erro não identificado.' });
        }
      }

      // -------------------------
      // Registrar Check-in (pacote_avulso)
      // -------------------------
      else if (req.query.type === 'addCheckin') {
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const { contratoId } = body;

          const contrato = await collection.findOne({ _id: new ObjectId(contratoId) });
          if (!contrato) return res.status(404).json({ message: 'Contrato não encontrado.' });
          if (contrato.tipoBilling !== 'pacote_avulso') return res.status(400).json({ message: 'Check-in apenas para pacote avulso.' });
          if ((contrato.pacote?.diasUtilizados ?? 0) >= (contrato.pacote?.totalDias ?? 0)) {
            return res.status(400).json({ message: 'Pacote de dias esgotado.' });
          }

          await collection.updateOne(
            { _id: new ObjectId(contratoId) },
            { $inc: { 'pacote.diasUtilizados': 1 }, $set: { updatedAt: new Date().toISOString() } }
          );
          return res.status(200).json({ message: 'Check-in registrado.' });
        } catch (err) {
          console.error('[C_contratosIdoso]', err);
          return res.status(500).json({ message: 'addCheckin: Erro não identificado.' });
        }
      }

      else {
        return res.status(400).json({ message: 'POST: Nenhum query.type identificado.' });
      }

    case 'PUT':

      // -------------------------
      // UPDATE Status do Contrato
      // -------------------------
      if (req.query.type === 'updateStatus' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const validStatus = ['ativo', 'encerrado', 'suspenso'];
          if (!validStatus.includes(body.status)) return res.status(400).json({ message: 'Status inválido.' });
          const result = await collection.updateOne(
            { _id: new ObjectId(reqId) },
            { $set: { status: body.status, updatedAt: new Date().toISOString() } }
          );
          if (result.matchedCount === 0) return res.status(404).json({ message: 'Contrato não encontrado.' });
          return res.status(200).json({ message: 'Status atualizado.' });
        } catch (err) {
          console.error('[C_contratosIdoso]', err);
          return res.status(500).json({ message: 'updateStatus: Erro não identificado.' });
        }
      }

      // -------------------------
      // UPDATE Dados do Billing
      // -------------------------
      else if (req.query.type === 'updateBilling' && req.query.id) {
        const reqId = req.query.id as string;
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const setFields: any = { updatedAt: new Date().toISOString() };
          if (body.contratado !== undefined) setFields.contratado = body.contratado;
          if (body.pacote !== undefined) setFields.pacote = body.pacote;
          if (body.avulso !== undefined) setFields.avulso = body.avulso;

          const result = await collection.updateOne({ _id: new ObjectId(reqId) }, { $set: setFields });
          if (result.matchedCount === 0) return res.status(404).json({ message: 'Contrato não encontrado.' });
          return res.status(200).json({ message: 'Billing atualizado.' });
        } catch (err) {
          console.error('[C_contratosIdoso]', err);
          return res.status(500).json({ message: 'updateBilling: Erro não identificado.' });
        }
      }

      else {
        return res.status(400).json({ message: 'PUT: Nenhum query.type identificado.' });
      }

    default:
      return res.status(405).json({ message: 'Método não permitido.' });
  }
}
