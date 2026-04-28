import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb';

// ── Filter helpers ────────────────────────────────────────────────────────────

const NUMERIC_FIELDS = new Set(['valor']);
const BOOLEAN_FIELDS = new Set(['temRateio']);
const BALANCE_DATE_FIELDS = new Set(['dataMovimento', 'competencia']);

type FilterCondition = {
  field: string;
  operator: string;
  value: string;
  value2?: string;
};

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

function isActiveCondition(c: FilterCondition): boolean {
  return c.operator === 'empty' || c.operator === 'notempty' || (c.value !== '' && c.value != null);
}

function matchStringCondition(raw: string, c: FilterCondition): boolean {
  const value = String(raw ?? '');

  switch (c.operator) {
    case 'eq':
      return value === c.value;
    case 'neq':
      return value !== c.value;
    case 'contains':
      return value.toLowerCase().includes(String(c.value ?? '').toLowerCase());
    case 'starts':
      return value.toLowerCase().startsWith(String(c.value ?? '').toLowerCase());
    case 'gt':
      return value > c.value;
    case 'gte':
      return value >= c.value;
    case 'lt':
      return value < c.value;
    case 'lte':
      return value <= c.value;
    case 'between': {
      const value2 = c.value2 ?? c.value;
      return value >= c.value && value <= value2;
    }
    case 'empty':
      return value === '';
    case 'notempty':
      return value !== '';
    default:
      return true;
  }
}

function filterAccountsForBalance(contas: any[], conditions: FilterCondition[], logic: string) {
  const accountConditions = (conditions ?? []).filter((c) => c.field === 'contaFinanceiraId' && isActiveCondition(c));
  if (!accountConditions.length) return contas;

  return contas.filter((conta) => {
    const contaId = conta._id?.toString?.() ?? String(conta._id ?? '');
    const matches = accountConditions.map((condition) => matchStringCondition(contaId, condition));
    return logic === 'or' ? matches.some(Boolean) : matches.every(Boolean);
  });
}

function buildBalanceDateFilter(conditions: FilterCondition[], logic: string): Record<string, any> {
  if (logic !== 'and') return {};

  const transformed = (conditions ?? [])
    .filter((c) => BALANCE_DATE_FIELDS.has(c.field) && isActiveCondition(c))
    .flatMap((c): FilterCondition[] => {
      switch (c.operator) {
        case 'eq':
          return [{ ...c, operator: 'lte' }];
        case 'lt':
        case 'lte':
          return [c];
        case 'between':
          return [{ ...c, operator: 'lte', value: c.value2 ?? c.value, value2: undefined }];
        case 'gt':
        case 'gte':
          return [];
        default:
          return [];
      }
    });

  return buildMongoFilter(transformed, 'and');
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
      // TOTAIS (somatórios do filtro atual)
      // -------------------------
      if (req.query.type === 'totals') {
        try {
          const { conditions: condStr, logic } = req.query;
          const conditions: FilterCondition[] = condStr ? JSON.parse(condStr as string) : [];
          const filterLogic = (logic as string) ?? 'and';
          const filter = buildMongoFilter(conditions, filterLogic);

          // Exclude transfer-category records from P&L totals
          const categoriasCollection = db.collection('financeiro_categorias');
          const transferCatDocs = await categoriasCollection
            .find({ tipo: 'transferencia' }, { projection: { _id: 1 } })
            .toArray();
          const transferCatIds = transferCatDocs.map((c: any) => c._id.toString());

          const plExclude = transferCatIds.length > 0 ? { categoriaId: { $nin: transferCatIds } } : {};
          const plFilter = Object.keys(filter).length
            ? (Object.keys(plExclude).length ? { $and: [filter, plExclude] } : filter)
            : (Object.keys(plExclude).length ? plExclude : {});

          const agg = await collection.aggregate([
            { $match: plFilter },
            {
              $group: {
                _id:   '$tipoMovimento',
                total: { $sum: '$valor' },
                count: { $sum: 1 },
              },
            },
          ]).toArray();

          const contas = await contasCollection
            .find({}, { projection: { saldoInicial: 1 } })
            .toArray();
          const contasSaldo = filterAccountsForBalance(contas, conditions, filterLogic);
          const saldoInicial = contasSaldo.reduce((acc: number, conta: any) => acc + Number(conta.saldoInicial || 0), 0);

          const accountConditions = conditions.filter((c) => c.field === 'contaFinanceiraId' && isActiveCondition(c));
          const balanceDateFilter = buildBalanceDateFilter(conditions, filterLogic);
          const balanceClauses: Record<string, any>[] = [];

          if (accountConditions.length > 0) {
            balanceClauses.push({
              contaFinanceiraId: { $in: contasSaldo.map((conta: any) => conta._id.toString()) },
            });
          }
          if (Object.keys(balanceDateFilter).length > 0) {
            balanceClauses.push(balanceDateFilter);
          }

          const balanceFilter =
            balanceClauses.length === 0
              ? {}
              : balanceClauses.length === 1
                ? balanceClauses[0]
                : { $and: balanceClauses };

          const balanceAgg = await collection.aggregate([
            { $match: balanceFilter },
            {
              $group: {
                _id: '$tipoMovimento',
                total: { $sum: '$valor' },
              },
            },
          ]).toArray();

          let totalEntradas = 0;
          let totalSaidas   = 0;
          let count         = 0;
          for (const row of agg) {
            count += row.count;
            if (row._id === 'entrada') totalEntradas = row.total;
            if (row._id === 'saida')   totalSaidas   = row.total;
          }

          let totalEntradasSaldo = 0;
          let totalSaidasSaldo   = 0;
          for (const row of balanceAgg) {
            if (row._id === 'entrada') totalEntradasSaldo = row.total;
            if (row._id === 'saida')   totalSaidasSaldo   = row.total;
          }

          const resultado = totalEntradas - totalSaidas;
          const saldo = saldoInicial + totalEntradasSaldo - totalSaidasSaldo;

          return res.status(200).json({ totalEntradas, totalSaidas, resultado, saldoInicial, saldo, count });
        } catch (err) {
          console.error('[C_financeiroMovimentacoes]', err);
          return res.status(500).json({ message: 'totals: Erro interno.' });
        }
      }

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
          console.error('[C_financeiroMovimentacoes]', err);
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
          console.error('[C_financeiroMovimentacoes]', err);
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
          console.error('[C_financeiroMovimentacoes]', err);
          return res.status(500).json({ message: 'getRateios: Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // TRANSFERÊNCIA STATUS (balanço de categorias de transferência)
      // -------------------------
      if (req.query.type === 'transferenciaStatus') {
        try {
          const categoriasCollection2 = db.collection('financeiro_categorias');
          const transferCatDocs2 = await categoriasCollection2
            .find({ tipo: 'transferencia' }, { projection: { _id: 1 } })
            .toArray();
          const transferCatIds2 = transferCatDocs2.map((c: any) => c._id.toString());

          if (!transferCatIds2.length) return res.status(200).json({ net: 0, entradas: 0, saidas: 0 });

          const agg = await collection.aggregate([
            { $match: { categoriaId: { $in: transferCatIds2 } } },
            { $group: { _id: '$tipoMovimento', total: { $sum: '$valor' } } },
          ]).toArray();

          let entradas = 0, saidas = 0;
          for (const row of agg) {
            if (row._id === 'entrada') entradas = row.total;
            if (row._id === 'saida')   saidas   = row.total;
          }
          return res.status(200).json({ net: entradas - saidas, entradas, saidas });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'transferenciaStatus: Erro interno.' });
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
            // par de transferência entre contas
            criarPar,
            contaParId,
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

          // Criar registro par de transferência se solicitado
          if (criarPar && contaParId) {
            const tipoPar = tipoMovimento === 'entrada' ? 'saida' : tipoMovimento === 'saida' ? 'entrada' : tipoMovimento;
            const parDoc: Record<string, any> = {
              tipoMovimento: tipoPar,
              contaFinanceiraId: contaParId,
              dataMovimento,
              competencia: competenciaFinal,
              valor: Number(valor),
              historico,
              origem: 'manual',
              temRateio: false,
              createdAt: now,
              updatedAt: now,
            };
            if (categoriaId) parDoc.categoriaId = categoriaId;
            await collection.insertOne(parDoc);
          }

          return res.status(201).json({ id: movimentacaoId });
        } catch (err) {
          console.error('[C_financeiroMovimentacoes]', err);
          return res.status(500).json({ message: 'new: Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
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
          console.error('[C_financeiroMovimentacoes]', err);
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
          const { rateios: rateiosBody, criarPar, contaParId, ...restBody } = body;

          // Campos que podem ser explicitamente zerados (null → $unset)
          const NULLABLE = new Set(['vinculadoId', 'vinculadoTipo', 'categoriaId', 'emprestimoId', 'observacoes', 'formaPagamento', 'numeroDocumento', 'contaDestinoId']);

          const setFields: Record<string, any> = { updatedAt: now };
          const unsetFields: Record<string, any> = {};

          for (const [key, val] of Object.entries(restBody)) {
            if (key === '_id' || key === 'createdAt') continue;
            if (val === null && NULLABLE.has(key)) {
              unsetFields[key] = '';
            } else if (val !== undefined) {
              setFields[key] = val;
            }
          }

          const updateOp: Record<string, any> = { $set: setFields };
          if (Object.keys(unsetFields).length) updateOp.$unset = unsetFields;

          await collection.updateOne({ _id: new ObjectId(id) }, updateOp);

          // Criar par de transferência se solicitado
          if (criarPar && contaParId) {
            const tipoAtual = restBody.tipoMovimento ?? existingDoc.tipoMovimento;
            const tipoPar   = tipoAtual === 'entrada' ? 'saida' : tipoAtual === 'saida' ? 'entrada' : tipoAtual;
            const parDoc: Record<string, any> = {
              tipoMovimento:     tipoPar,
              contaFinanceiraId: contaParId,
              dataMovimento:     restBody.dataMovimento  ?? existingDoc.dataMovimento,
              competencia:       restBody.competencia    ?? existingDoc.competencia,
              valor:             Number(restBody.valor   ?? existingDoc.valor),
              historico:         restBody.historico      ?? existingDoc.historico,
              origem:            'manual',
              temRateio:         false,
              createdAt:         now,
              updatedAt:         now,
            };
            const catId = restBody.categoriaId ?? existingDoc.categoriaId;
            if (catId) parDoc.categoriaId = catId;
            await collection.insertOne(parDoc);
          }

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
          console.error('[C_financeiroMovimentacoes]', err);
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
          console.error('[C_financeiroMovimentacoes]', err);
          return res.status(500).json({ message: 'updateMany: Erro não identificado. Procure um administrador.' });
        }
      }

      return res.status(400).json({ message: 'PUT: Nenhum query.type identificado.' });
    }

    case 'DELETE': {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ message: 'id é obrigatório.' });
      try {
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) return res.status(404).json({ message: 'Movimentação não encontrada.' });
        await rateiosCollection.deleteMany({ movimentacaoId: id });
        return res.status(200).json({ message: 'Movimentação excluída com sucesso.' });
      } catch (err) {
        console.error('[C_financeiroMovimentacoes]', err);
        return res.status(500).json({ message: 'delete: Erro não identificado.' });
      }
    }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
