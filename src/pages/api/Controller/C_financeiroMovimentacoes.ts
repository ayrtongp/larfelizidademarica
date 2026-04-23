import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb';

// ── Filter helpers ────────────────────────────────────────────────────────────

const NUMERIC_FIELDS = new Set(['valor']);
const BOOLEAN_FIELDS = new Set(['temRateio']);

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function condToMongo(c: { field: string; operator: string; value: string; value2?: string }): Record<string, any> {
  const { field, operator, value, value2 } = c;
  const coerce = (v: string) => {
    if (BOOLEAN_FIELDS.has(field)) return v === 'true';
    if (NUMERIC_FIELDS.has(field)) return Number(v);
    return v;
  };
  switch (operator) {
    case 'eq':       return { [field]: coerce(value) };
    case 'neq':      return { [field]: { $ne: coerce(value) } };
    case 'contains': return { [field]: { $regex: escapeRegex(value), $options: 'i' } };
    case 'starts':   return { [field]: { $regex: `^${escapeRegex(value)}`, $options: 'i' } };
    case 'gt':       return { [field]: { $gt:  coerce(value) } };
    case 'gte':      return { [field]: { $gte: coerce(value) } };
    case 'lt':       return { [field]: { $lt:  coerce(value) } };
    case 'lte':      return { [field]: { $lte: coerce(value) } };
    case 'between':  return { [field]: { $gte: coerce(value), $lte: coerce(value2 ?? value) } };
    case 'empty':    return { $or: [{ [field]: { $exists: false } }, { [field]: null }, { [field]: '' }] };
    case 'notempty': return { $and: [{ [field]: { $exists: true } }, { [field]: { $ne: null } }, { [field]: { $ne: '' } }] };
    default:         return {};
  }
}

function buildMongoFilter(conditions: any[], logic: string): Record<string, any> {
  const active = (conditions ?? []).filter((c: any) =>
    c.operator === 'empty' || c.operator === 'notempty' || (c.value !== '' && c.value != null),
  );
  if (!active.length) return {};
  const clauses = active.map(condToMongo).filter((c: any) => Object.keys(c).length > 0);
  if (!clauses.length) return {};
  if (clauses.length === 1) return clauses[0];
  return logic === 'or' ? { $or: clauses } : { $and: clauses };
}

// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const collection = db.collection('financeiro_movimentacoes');
  const rateiosCollection = db.collection('financeiro_rateios');
  const contasCollection = db.collection('financeiro_contas');

  switch (req.method) {
    case 'GET': {
      // -------------------------
      // GET ALL (com filtros)
      // -------------------------
      if (req.query.type === 'getAll') {
        try {
          const { conditions: condStr, logic, skip: skipStr, limit: limitStr } = req.query;

          const conditions = condStr ? JSON.parse(condStr as string) : [];
          const filter = buildMongoFilter(conditions, (logic as string) ?? 'and');
          const skip  = Math.max(0, parseInt(skipStr  as string) || 0);
          const limit = Math.min(Math.max(1, parseInt(limitStr as string) || 100), 1000);

          const pipeline = [
            { $match: filter },
            {
              $lookup: {
                from: 'financeiro_rateios',
                let: { movId: { $toString: '$_id' } },
                pipeline: [
                  { $match: { $expr: { $eq: ['$movimentacaoId', '$$movId'] } } },
                  { $count: 'total' },
                ],
                as: '_rateiosAgg',
              },
            },
            {
              $addFields: {
                rateioCount: { $ifNull: [{ $arrayElemAt: ['$_rateiosAgg.total', 0] }, 0] },
              },
            },
            { $project: { _rateiosAgg: 0 } },
            { $sort: { dataMovimento: -1 } },
          ];

          const [items, total] = await Promise.all([
            collection.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]).toArray(),
            collection.countDocuments(filter),
          ]);

          return res.status(200).json({ items, total });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'getAll: Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // GET BY ID
      // -------------------------
      if (req.query.type === 'getById' && req.query.id) {
        const id = req.query.id as string;
        try {
          const result = await collection.findOne({ _id: new ObjectId(id) });
          if (!result) {
            return res.status(404).json({ message: 'Movimentação não encontrada.' });
          }
          return res.status(200).json(result);
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'getById: Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // GET RATEIOS BY MOVIMENTACAO ID
      // -------------------------
      if (req.query.type === 'getRateios' && req.query.id) {
        const id = req.query.id as string;
        try {
          const rateios = await rateiosCollection.find({ movimentacaoId: id }).toArray();
          return res.status(200).json(rateios);
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'getRateios: Erro não identificado. Procure um administrador.' });
        }
      }

      return res.status(400).json({ message: 'GET: Nenhum query.type identificado.' });
    }

    case 'POST': {
      // -------------------------
      // CRIAR MOVIMENTACAO (entrada/saida/ajuste)
      // -------------------------
      if (req.query.type === 'new') {
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const {
            tipoMovimento,
            contaFinanceiraId,
            dataMovimento,
            competencia,
            valor,
            historico,
            formaPagamento,
            numeroDocumento,
            observacoes,
            descricaoOriginal,
            comprovanteUrl,
            categoriaId,
            tituloIds,
            emprestimoId,
            temRateio,
            rateios,
            vinculadoId,
            vinculadoTipo,
            // campos para criação inline de empréstimo
            criarEmprestimo,
            emprestimoTipo,
            emprestimoContraparte_tipo,
            emprestimoContraparteId,
            emprestimoContraparteNome,
            emprestimoVencimento,
          } = body;

          // Validar campos obrigatórios
          if (!tipoMovimento || !contaFinanceiraId || !dataMovimento || valor === undefined || valor === null || !historico) {
            return res.status(400).json({ message: 'Campos obrigatórios ausentes: tipoMovimento, contaFinanceiraId, dataMovimento, valor, historico.' });
          }

          if (!['entrada', 'saida', 'ajuste'].includes(tipoMovimento)) {
            return res.status(400).json({ message: 'Use o endpoint type=transferencia para movimentações do tipo transferência.' });
          }

          // Validar que a conta existe e está ativa
          const conta = await contasCollection.findOne({ _id: new ObjectId(contaFinanceiraId) });
          if (!conta) {
            return res.status(400).json({ message: 'Conta financeira não encontrada.' });
          }
          if (conta.ativo === false || conta.status === 'inativo') {
            return res.status(400).json({ message: 'Conta financeira está inativa e não pode ser usada em movimentações.' });
          }

          // Validar rateios se temRateio=true
          if (temRateio && Array.isArray(rateios) && rateios.length > 0) {
            const somaRateios = rateios.reduce((acc: number, r: any) => acc + (Number(r.valor) || 0), 0);
            if (Math.abs(somaRateios - Number(valor)) > 0.001) {
              return res.status(400).json({ message: `A soma dos rateios (${somaRateios}) deve ser igual ao valor da movimentação (${valor}).` });
            }
          }

          const now = new Date().toISOString();
          // competencia default = YYYY-MM de dataMovimento
          const competenciaFinal = competencia || (dataMovimento as string).substring(0, 7);

          // se criarEmprestimo=true, cria o empréstimo primeiro e vincula
          let emprestimoIdFinal = emprestimoId;
          if (criarEmprestimo) {
            if (!emprestimoTipo || !['concedido', 'recebido'].includes(emprestimoTipo)) {
              return res.status(400).json({ message: 'criarEmprestimo requer emprestimoTipo: "concedido" ou "recebido".' });
            }
            const emprestimosCollection = db.collection('financeiro_emprestimos');
            const valorNum = Number(valor);
            const novoEmprestimo: Record<string, any> = {
              tipo: emprestimoTipo,
              contraparte_tipo: emprestimoContraparte_tipo || null,
              contraparteId: emprestimoContraparteId || null,
              contraparteNome: emprestimoContraparteNome || '',
              descricao: historico,
              valorOriginal: valorNum,
              valorEmAberto: valorNum,
              dataEmprestimo: dataMovimento,
              status: 'aberto',
              ...(emprestimoVencimento && { vencimento: emprestimoVencimento }),
              createdAt: now,
              updatedAt: now,
            };
            const empResult = await emprestimosCollection.insertOne(novoEmprestimo);
            emprestimoIdFinal = empResult.insertedId.toString();
          }

          const movimentacaoDoc: Record<string, any> = {
            tipoMovimento,
            contaFinanceiraId,
            dataMovimento,
            competencia: competenciaFinal,
            valor: Number(valor),
            historico,
            origem: 'manual',
            temRateio: temRateio === true,
            createdAt: now,
            updatedAt: now,
          };

          if (formaPagamento) movimentacaoDoc.formaPagamento = formaPagamento;
          if (numeroDocumento) movimentacaoDoc.numeroDocumento = numeroDocumento;
          if (observacoes) movimentacaoDoc.observacoes = observacoes;
          if (descricaoOriginal) movimentacaoDoc.descricaoOriginal = descricaoOriginal;
          if (comprovanteUrl) movimentacaoDoc.comprovanteUrl = comprovanteUrl;
          if (categoriaId) movimentacaoDoc.categoriaId = categoriaId;
          if (tituloIds) movimentacaoDoc.tituloIds = tituloIds;
          if (emprestimoIdFinal) movimentacaoDoc.emprestimoId = emprestimoIdFinal;
          if (vinculadoId) movimentacaoDoc.vinculadoId = vinculadoId;
          if (vinculadoTipo) movimentacaoDoc.vinculadoTipo = vinculadoTipo;

          const insertResult = await collection.insertOne(movimentacaoDoc);
          const movimentacaoId = insertResult.insertedId.toString();

          // Inserir rateios se houver
          if (temRateio && Array.isArray(rateios) && rateios.length > 0) {
            const rateiosDocs = rateios.map((r: any) => ({
              movimentacaoId,
              categoriaId: r.categoriaId,
              subcategoriaId: r.subcategoriaId || undefined,
              residenteId: r.vinculadoTipo === 'residente' ? (r.vinculadoId || undefined) : (r.residenteId || undefined),
              responsavelId: r.vinculadoTipo === 'usuario' ? (r.vinculadoId || undefined) : (r.responsavelId || undefined),
              contraparteId: r.contraparteId || undefined,
              tituloId: r.tituloId || undefined,
              descricao: r.descricao,
              valor: Number(r.valor),
              createdAt: now,
              updatedAt: now,
            }));
            await rateiosCollection.insertMany(rateiosDocs);
          }

          return res.status(201).json({ id: movimentacaoId });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'new: Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // CRIAR TRANSFERENCIA
      // -------------------------
      if (req.query.type === 'transferencia') {
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const {
            contaFinanceiraId,
            contaDestinoId,
            dataMovimento,
            competencia,
            valor,
            historico,
            observacoes,
          } = body;

          if (!contaFinanceiraId || !contaDestinoId || !dataMovimento || valor === undefined || valor === null || !historico) {
            return res.status(400).json({ message: 'Campos obrigatórios ausentes: contaFinanceiraId, contaDestinoId, dataMovimento, valor, historico.' });
          }

          // Validar contas
          const contaOrigem = await contasCollection.findOne({ _id: new ObjectId(contaFinanceiraId) });
          if (!contaOrigem) {
            return res.status(400).json({ message: 'Conta de origem não encontrada.' });
          }
          if (contaOrigem.ativo === false || contaOrigem.status === 'inativo') {
            return res.status(400).json({ message: 'Conta de origem está inativa e não pode ser usada em transferências.' });
          }

          const contaDestino = await contasCollection.findOne({ _id: new ObjectId(contaDestinoId) });
          if (!contaDestino) {
            return res.status(400).json({ message: 'Conta de destino não encontrada.' });
          }
          if (contaDestino.ativo === false || contaDestino.status === 'inativo') {
            return res.status(400).json({ message: 'Conta de destino está inativa e não pode ser usada em transferências.' });
          }

          const now = new Date().toISOString();
          const valorNum = Number(valor);
          const competenciaFinal = competencia || (dataMovimento as string).substring(0, 7);

          const docSaida: Record<string, any> = {
            tipoMovimento: 'transferencia',
            contaFinanceiraId,
            contaDestinoId,
            dataMovimento,
            competencia: competenciaFinal,
            valor: valorNum,
            historico,
            origem: 'manual',
            temRateio: false,
            createdAt: now,
            updatedAt: now,
          };
          if (observacoes) docSaida.observacoes = observacoes;

          const docEntrada: Record<string, any> = {
            tipoMovimento: 'transferencia',
            contaFinanceiraId: contaDestinoId,
            contaDestinoId: contaFinanceiraId,
            dataMovimento,
            competencia: competenciaFinal,
            valor: valorNum,
            historico,
            origem: 'manual',
            temRateio: false,
            createdAt: now,
            updatedAt: now,
          };
          if (observacoes) docEntrada.observacoes = observacoes;

          const resultSaida = await collection.insertOne(docSaida);
          const resultEntrada = await collection.insertOne(docEntrada);

          return res.status(201).json({
            idSaida: resultSaida.insertedId.toString(),
            idEntrada: resultEntrada.insertedId.toString(),
          });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'transferencia: Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // IMPORTAR EXTRATO EM LOTE
      // -------------------------
      if (req.query.type === 'importar') {
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const { contaFinanceiraId, movimentacoes } = body;

          if (!contaFinanceiraId || !Array.isArray(movimentacoes) || movimentacoes.length === 0) {
            return res.status(400).json({ message: 'Campos obrigatórios: contaFinanceiraId, movimentacoes[].' });
          }

          const conta = await contasCollection.findOne({ _id: new ObjectId(contaFinanceiraId) });
          if (!conta) return res.status(400).json({ message: 'Conta financeira não encontrada.' });
          if (conta.ativo === false) return res.status(400).json({ message: 'Conta financeira está inativa.' });

          const now = new Date().toISOString();
          const docs = movimentacoes.map((m: any) => {
            const competencia = (m.dataMovimento as string).substring(0, 7);
            return {
              tipoMovimento: m.tipoMovimento,
              contaFinanceiraId,
              dataMovimento: m.dataMovimento,
              competencia,
              valor: Number(m.valor),
              historico: m.historico || 'Importado',
              origem: 'importacao',
              temRateio: false,
              ...(m.categoriaId && { categoriaId: m.categoriaId }),
              ...(m.observacoes && { observacoes: m.observacoes }),
              createdAt: now,
              updatedAt: now,
            };
          });

          const result = await collection.insertMany(docs);
          return res.status(201).json({ inseridos: result.insertedCount });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'importar: Erro não identificado. Procure um administrador.' });
        }
      }

      return res.status(400).json({ message: 'POST: Nenhum query.type identificado.' });
    }

    case 'PUT': {
      // -------------------------
      // UPDATE
      // -------------------------
      if (req.query.type === 'update' && req.query.id) {
        const id = req.query.id as string;
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

          // Verificar se há rateios antes de permitir alterar valor/tipo
          const existingDoc = await collection.findOne({ _id: new ObjectId(id) });
          if (!existingDoc) {
            return res.status(404).json({ message: 'Movimentação não encontrada.' });
          }

          const now = new Date().toISOString();
          const { rateios: rateiosBody, ...restBody } = body;

          const updateFields: Record<string, any> = { ...restBody, updatedAt: now };

          // Não permitir alterar campos de controle via update genérico
          delete updateFields._id;
          delete updateFields.createdAt;

          await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateFields });

          // Se rateios foram enviados, substituir os existentes
          if (Array.isArray(rateiosBody)) {
            await rateiosCollection.deleteMany({ movimentacaoId: id });
            if (rateiosBody.length > 0) {
              const rateiosDocs = rateiosBody.map((r: any) => ({
                movimentacaoId: id,
                categoriaId: r.categoriaId,
                residenteId: r.vinculadoTipo === 'residente' ? (r.vinculadoId || undefined) : undefined,
                responsavelId: r.vinculadoTipo === 'usuario' ? (r.vinculadoId || undefined) : undefined,
                descricao: r.descricao,
                valor: Number(r.valor),
                createdAt: now,
                updatedAt: now,
              }));
              await rateiosCollection.insertMany(rateiosDocs);
            }
          }

          return res.status(200).json({ message: 'Movimentação atualizada com sucesso.' });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'update: Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // UPDATE MANY (bulk)
      // -------------------------
      if (req.query.type === 'updateMany') {
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const { ids, update } = body;

          if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'ids deve ser um array não-vazio.' });
          }

          const allowedFields = ['categoriaId', 'competencia', 'vinculadoId', 'vinculadoTipo'];
          const hasField = allowedFields.some((f) => f in update);
          if (!hasField) {
            return res.status(400).json({ message: 'update deve conter ao menos um campo válido.' });
          }

          const setFields: Record<string, any> = { updatedAt: new Date().toISOString() };
          const unsetFields: Record<string, string> = {};

          for (const field of allowedFields) {
            if (!(field in update)) continue;
            if (update[field] === null || update[field] === '') {
              unsetFields[field] = '';
            } else {
              setFields[field] = update[field];
            }
          }

          const objectIds = ids.map((id: string) => new ObjectId(id));
          const updateOp: Record<string, any> = { $set: setFields };
          if (Object.keys(unsetFields).length > 0) updateOp.$unset = unsetFields;

          const result = await collection.updateMany({ _id: { $in: objectIds } }, updateOp);
          return res.status(200).json({ updated: result.modifiedCount });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'updateMany: Erro não identificado. Procure um administrador.' });
        }
      }

      return res.status(400).json({ message: 'PUT: Nenhum query.type identificado.' });
    }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
