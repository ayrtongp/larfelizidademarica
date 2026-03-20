import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb';

function calcularStatus(saldo: number, vencimento: string, valorLiquidado?: number, cancelado?: boolean): string {
  if (cancelado) return 'cancelado';
  if (saldo <= 0) return 'liquidado';
  if (valorLiquidado && valorLiquidado > 0) return 'parcial';

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataVencimento = new Date(vencimento);
  dataVencimento.setHours(0, 0, 0, 0);

  if (dataVencimento < hoje) return 'vencido';

  return 'aberto';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const collection = db.collection('financeiro_titulos');

  switch (req.method) {
    case 'GET': {
      if (req.query.type === 'getAll') {
        const filtro: Record<string, any> = {};
        if (req.query.tipo) filtro.tipo = req.query.tipo;
        if (req.query.status) filtro.status = req.query.status;
        const titulos = await collection.find(filtro).sort({ vencimento: 1 }).toArray();
        return res.status(200).json(titulos);
      }

      if (req.query.type === 'getById' && req.query.id) {
        const titulo = await collection.findOne({ _id: new ObjectId(req.query.id as string) });
        if (!titulo) return res.status(404).json({ message: 'Título não encontrado.' });
        return res.status(200).json(titulo);
      }

      if (req.query.type === 'getBaixas' && req.query.id) {
        const baixas = await db
          .collection('financeiro_baixas')
          .find({ tituloId: req.query.id as string })
          .sort({ dataBaixa: -1 })
          .toArray();
        return res.status(200).json(baixas);
      }

      return res.status(400).json({ message: 'GET: Nenhum query.type identificado.' });
    }

    case 'POST': {
      if (req.query.type === 'new') {
        const {
          tipo,
          descricao,
          categoriaId,
          vencimento,
          valorOriginal,
          competencia,
          contaFinanceiraPrevistaId,
          residenteId,
          responsavelId,
          fornecedorId,
          funcionarioId,
          contraparteId,
          recorrenciaId,
          observacoes,
          descontos,
          juros,
          multa,
        } = req.body;

        if (!tipo || !descricao || !categoriaId || !vencimento || valorOriginal === undefined) {
          return res.status(400).json({ message: 'Campos obrigatórios: tipo, descricao, categoriaId, vencimento, valorOriginal.' });
        }

        const descVal = Number(descontos) || 0;
        const jurosVal = Number(juros) || 0;
        const multaVal = Number(multa) || 0;
        const saldo = Number(valorOriginal);
        const status = calcularStatus(saldo, vencimento, 0);
        const now = new Date().toISOString();

        const novoTitulo = {
          tipo,
          descricao,
          categoriaId,
          vencimento,
          valorOriginal: Number(valorOriginal),
          descontos: descVal,
          juros: jurosVal,
          multa: multaVal,
          valorLiquidado: 0,
          saldo,
          status,
          ...(competencia && { competencia }),
          ...(contaFinanceiraPrevistaId && { contaFinanceiraPrevistaId }),
          ...(residenteId && { residenteId }),
          ...(responsavelId && { responsavelId }),
          ...(fornecedorId && { fornecedorId }),
          ...(funcionarioId && { funcionarioId }),
          ...(contraparteId && { contraparteId }),
          ...(recorrenciaId && { recorrenciaId }),
          ...(observacoes && { observacoes }),
          createdAt: now,
          updatedAt: now,
        };

        const result = await collection.insertOne(novoTitulo);
        return res.status(201).json({ id: result.insertedId });
      }

      return res.status(400).json({ message: 'POST: Nenhum query.type identificado.' });
    }

    case 'PUT': {
      if (req.query.type === 'update' && req.query.id) {
        const { valorLiquidado, saldo, status, createdAt, _id, ...dadosAtualizacao } = req.body;

        const dadosFinais = {
          ...dadosAtualizacao,
          updatedAt: new Date().toISOString(),
        };

        const result = await collection.updateOne(
          { _id: new ObjectId(req.query.id as string) },
          { $set: dadosFinais }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: 'Título não encontrado.' });
        }

        return res.status(200).json({ message: 'Título atualizado com sucesso.' });
      }

      if (req.query.type === 'baixa' && req.query.id) {
        const { valor, dataBaixa, contaFinanceiraId, formaPagamento, observacoes } = req.body;

        if (!valor || valor <= 0) {
          return res.status(400).json({ message: 'O valor da baixa deve ser maior que zero.' });
        }
        if (!dataBaixa) {
          return res.status(400).json({ message: 'A data da baixa é obrigatória.' });
        }
        if (!contaFinanceiraId) {
          return res.status(400).json({ message: 'A conta financeira é obrigatória.' });
        }

        const titulo = await collection.findOne({ _id: new ObjectId(req.query.id as string) });
        if (!titulo) return res.status(404).json({ message: 'Título não encontrado.' });

        if (Number(valor) > titulo.saldo) {
          return res.status(400).json({ message: 'O valor da baixa não pode ser maior que o saldo do título.' });
        }

        const conta = await db
          .collection('financeiro_contas')
          .findOne({ _id: new ObjectId(contaFinanceiraId) });

        if (!conta) return res.status(404).json({ message: 'Conta financeira não encontrada.' });
        if (!conta.ativo) return res.status(400).json({ message: 'A conta financeira está inativa.' });

        const now = new Date().toISOString();

        const novaBaixa = {
          tituloId: req.query.id as string,
          valor: Number(valor),
          dataBaixa,
          contaFinanceiraId,
          ...(formaPagamento && { formaPagamento }),
          ...(observacoes && { observacoes }),
          createdAt: now,
        };

        await db.collection('financeiro_baixas').insertOne(novaBaixa);

        const novoValorLiquidado = titulo.valorLiquidado + Number(valor);
        const novoSaldo = titulo.saldo - Number(valor);
        const novoStatus = calcularStatus(novoSaldo, titulo.vencimento, novoValorLiquidado);

        await collection.updateOne(
          { _id: new ObjectId(req.query.id as string) },
          {
            $set: {
              valorLiquidado: novoValorLiquidado,
              saldo: novoSaldo,
              status: novoStatus,
              updatedAt: now,
            },
          }
        );

        const tituloAtualizado = await collection.findOne({ _id: new ObjectId(req.query.id as string) });
        return res.status(200).json(tituloAtualizado);
      }

      if (req.query.type === 'cancelar' && req.query.id) {
        const titulo = await collection.findOne({ _id: new ObjectId(req.query.id as string) });
        if (!titulo) return res.status(404).json({ message: 'Título não encontrado.' });

        await collection.updateOne(
          { _id: new ObjectId(req.query.id as string) },
          { $set: { status: 'cancelado', updatedAt: new Date().toISOString() } }
        );

        return res.status(200).json({ message: 'Título cancelado com sucesso.' });
      }

      return res.status(400).json({ message: 'PUT: Nenhum query.type identificado.' });
    }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
