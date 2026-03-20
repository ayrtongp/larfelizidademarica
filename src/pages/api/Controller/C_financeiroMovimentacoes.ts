import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb';

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
          const { contaFinanceiraId, tipoMovimento, dataInicio, dataFim } = req.query;
          const filter: Record<string, any> = {};

          if (contaFinanceiraId) filter.contaFinanceiraId = contaFinanceiraId as string;
          if (tipoMovimento) filter.tipoMovimento = tipoMovimento as string;

          if (dataInicio || dataFim) {
            filter.dataMovimento = {};
            if (dataInicio) filter.dataMovimento.$gte = dataInicio as string;
            if (dataFim) filter.dataMovimento.$lte = dataFim as string;
          }

          const documents = await collection.find(filter).sort({ dataMovimento: -1 }).toArray();
          return res.status(200).json(documents);
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

      return res.status(400).json({ message: 'PUT: Nenhum query.type identificado.' });
    }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
