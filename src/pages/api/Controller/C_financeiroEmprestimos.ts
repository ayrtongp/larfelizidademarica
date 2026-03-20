import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const collection = db.collection('financeiro_emprestimos');

  switch (req.method) {
    case 'GET': {
      const { type, id } = req.query;

      if (type === 'getAll') {
        const filter: any = {};
        if (req.query.tipo) filter.tipo = req.query.tipo;
        if (req.query.status) filter.status = req.query.status;
        const data = await collection.find(filter).sort({ dataEmprestimo: -1 }).toArray();
        return res.status(200).json(data);
      }

      if (type === 'getById' && id) {
        const item = await collection.findOne({ _id: new ObjectId(id as string) });
        if (!item) return res.status(404).json({ message: 'Empréstimo não encontrado.' });
        return res.status(200).json(item);
      }

      if (type === 'getDevolucoes' && id) {
        const devolucoes = await db.collection('financeiro_devolucoes_emprestimo')
          .find({ emprestimoId: id as string })
          .sort({ dataDevolucao: -1 })
          .toArray();
        return res.status(200).json(devolucoes);
      }

      return res.status(400).json({ message: 'GET: Nenhum query.type identificado.' });
    }

    case 'POST': {
      const { type } = req.query;

      if (type === 'new') {
        const { tipo, contraparte_tipo, contraparteId, contraparteNome, descricao, valorOriginal, dataEmprestimo, vencimento, observacoes, contaFinanceiraId } = req.body;

        if (!tipo || !descricao || !valorOriginal || !dataEmprestimo) {
          return res.status(400).json({ message: 'Campos obrigatórios: tipo, descricao, valorOriginal, dataEmprestimo.' });
        }

        const now = new Date().toISOString();
        const novoEmprestimo = {
          tipo,
          contraparte_tipo: contraparte_tipo || null,
          contraparteId: contraparteId || null,
          contraparteNome: contraparteNome || null,
          descricao,
          valorOriginal: Number(valorOriginal),
          valorEmAberto: Number(valorOriginal),
          dataEmprestimo,
          vencimento: vencimento || null,
          status: 'aberto',
          observacoes: observacoes || null,
          createdAt: now,
          updatedAt: now,
        };

        const result = await collection.insertOne(novoEmprestimo);
        const emprestimoId = result.insertedId.toString();

        // Gera movimentação automática
        if (contaFinanceiraId) {
          const tipoMovimentacao = tipo === 'concedido' ? 'saida' : 'entrada';
          const movimentacao = {
            tipo: tipoMovimentacao,
            descricao: `Empréstimo: ${descricao}`,
            valor: Number(valorOriginal),
            dataMovimento: dataEmprestimo,
            contaFinanceiraId,
            origem: 'sistema',
            conciliado: false,
            statusConciliacao: 'pendente',
            temRateio: false,
            emprestimoId,
            createdAt: now,
            updatedAt: now,
          };
          await db.collection('financeiro_movimentacoes').insertOne(movimentacao);
        }

        return res.status(201).json({ _id: emprestimoId, ...novoEmprestimo });
      }

      return res.status(400).json({ message: 'POST: Nenhum query.type identificado.' });
    }

    case 'PUT': {
      const { type, id } = req.query;

      if (type === 'devolver' && id) {
        const { valor, dataDevolucao, contaFinanceiraId, formaPagamento, observacoes } = req.body;

        if (!valor || valor <= 0) {
          return res.status(400).json({ message: 'Valor deve ser maior que zero.' });
        }

        const emprestimo = await collection.findOne({ _id: new ObjectId(id as string) });
        if (!emprestimo) return res.status(404).json({ message: 'Empréstimo não encontrado.' });

        if (Number(valor) > emprestimo.valorEmAberto) {
          return res.status(400).json({ message: 'Valor de devolução não pode ser maior que o valor em aberto.' });
        }

        const now = new Date().toISOString();
        const devolucao = {
          emprestimoId: id as string,
          valor: Number(valor),
          dataDevolucao,
          contaFinanceiraId,
          formaPagamento: formaPagamento || null,
          observacoes: observacoes || null,
          createdAt: now,
        };

        await db.collection('financeiro_devolucoes_emprestimo').insertOne(devolucao);

        const novoValorEmAberto = emprestimo.valorEmAberto - Number(valor);
        let novoStatus: string;
        if (novoValorEmAberto <= 0) {
          novoStatus = 'quitado';
        } else if (novoValorEmAberto < emprestimo.valorOriginal) {
          novoStatus = 'parcial';
        } else {
          novoStatus = 'aberto';
        }

        await collection.updateOne(
          { _id: new ObjectId(id as string) },
          { $set: { valorEmAberto: novoValorEmAberto, status: novoStatus, updatedAt: now } }
        );

        // Gera movimentação oposta
        if (contaFinanceiraId) {
          const tipoMovimentacao = emprestimo.tipo === 'concedido' ? 'entrada' : 'saida';
          const movimentacao = {
            tipo: tipoMovimentacao,
            descricao: `Devolução de empréstimo: ${emprestimo.descricao}`,
            valor: Number(valor),
            dataMovimento: dataDevolucao,
            contaFinanceiraId,
            origem: 'sistema',
            conciliado: false,
            statusConciliacao: 'pendente',
            temRateio: false,
            emprestimoId: id as string,
            createdAt: now,
            updatedAt: now,
          };
          await db.collection('financeiro_movimentacoes').insertOne(movimentacao);
        }

        const emprestimoAtualizado = await collection.findOne({ _id: new ObjectId(id as string) });
        return res.status(200).json(emprestimoAtualizado);
      }

      if (type === 'cancelar' && id) {
        const now = new Date().toISOString();
        await collection.updateOne(
          { _id: new ObjectId(id as string) },
          { $set: { status: 'cancelado', updatedAt: now } }
        );
        return res.status(200).json({ message: 'Empréstimo cancelado com sucesso.' });
      }

      return res.status(400).json({ message: 'PUT: Nenhum query.type identificado.' });
    }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
