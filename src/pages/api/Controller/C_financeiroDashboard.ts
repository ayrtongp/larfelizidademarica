import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();

  switch (req.method) {
    case 'GET': {
      const { type } = req.query;

      if (type === 'resumo') {
        const now = new Date();
        const mes = req.query.mes ? Number(req.query.mes) : now.getMonth() + 1;
        const ano = req.query.ano ? Number(req.query.ano) : now.getFullYear();

        const inicioMes = new Date(ano, mes - 1, 1).toISOString().slice(0, 10);
        const fimMes = new Date(ano, mes, 0).toISOString().slice(0, 10);

        // Saldo total: soma de saldoInicial de contas ativas
        const contas = await db.collection('financeiro_contas').find({ ativo: true }).toArray();
        const saldoTotal = contas.reduce((acc: number, c: any) => acc + (c.saldoInicial || 0), 0);

        // Títulos do mês
        const titulosReceber = await db.collection('financeiro_titulos').find({
          tipo: 'receber',
          status: { $ne: 'cancelado' },
          vencimento: { $gte: inicioMes, $lte: fimMes },
        }).toArray();

        const titulosPagar = await db.collection('financeiro_titulos').find({
          tipo: 'pagar',
          status: { $ne: 'cancelado' },
          vencimento: { $gte: inicioMes, $lte: fimMes },
        }).toArray();

        const totalAReceberMes = titulosReceber.reduce((acc: number, t: any) => acc + (t.valorOriginal || 0), 0);
        const totalAPagarMes = titulosPagar.reduce((acc: number, t: any) => acc + (t.valorOriginal || 0), 0);

        // Movimentações do mês
        const movEntradas = await db.collection('financeiro_movimentacoes').find({
          tipo: 'entrada',
          dataMovimento: { $gte: inicioMes, $lte: fimMes },
        }).toArray();

        const movSaidas = await db.collection('financeiro_movimentacoes').find({
          tipo: 'saida',
          dataMovimento: { $gte: inicioMes, $lte: fimMes },
        }).toArray();

        const totalRecebidoMes = movEntradas.reduce((acc: number, m: any) => acc + (m.valor || 0), 0);
        const totalPagoMes = movSaidas.reduce((acc: number, m: any) => acc + (m.valor || 0), 0);

        // Inadimplência: títulos vencidos do tipo receber no mês
        const titulosVencidosMes = await db.collection('financeiro_titulos').find({
          tipo: 'receber',
          status: 'vencido',
          vencimento: { $gte: inicioMes, $lte: fimMes },
        }).toArray();

        const inadimplenciaMes = titulosVencidosMes.reduce((acc: number, t: any) => acc + (t.saldo || 0), 0);
        const resultadoMes = totalRecebidoMes - totalPagoMes;

        return res.status(200).json({
          saldoTotal,
          totalAReceberMes,
          totalAPagarMes,
          totalRecebidoMes,
          totalPagoMes,
          inadimplenciaMes,
          resultadoMes,
        });
      }

      if (type === 'proximosVencimentos') {
        const hoje = new Date();
        const em7Dias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);
        const hojeStr = hoje.toISOString().slice(0, 10);
        const em7DiasStr = em7Dias.toISOString().slice(0, 10);

        const titulos = await db.collection('financeiro_titulos').find({
          status: { $in: ['aberto', 'parcial'] },
          vencimento: { $gte: hojeStr, $lte: em7DiasStr },
        }).sort({ vencimento: 1 }).limit(10).toArray();

        return res.status(200).json(titulos);
      }

      if (type === 'vencidos') {
        const titulos = await db.collection('financeiro_titulos').find({
          status: 'vencido',
        }).sort({ vencimento: 1 }).limit(10).toArray();

        return res.status(200).json(titulos);
      }

      if (type === 'saldoContas') {
        const contas = await db.collection('financeiro_contas').find({ ativo: true }).toArray();

        const contasComSaldo = await Promise.all(
          contas.map(async (conta: any) => {
            const id = conta._id.toString();

            const entradas = await db.collection('financeiro_movimentacoes')
              .aggregate([
                { $match: { contaFinanceiraId: id, tipoMovimento: 'entrada' } },
                { $group: { _id: null, total: { $sum: '$valor' } } },
              ]).toArray();

            const saidas = await db.collection('financeiro_movimentacoes')
              .aggregate([
                { $match: { contaFinanceiraId: id, tipoMovimento: 'saida' } },
                { $group: { _id: null, total: { $sum: '$valor' } } },
              ]).toArray();

            const totalEntradas = entradas[0]?.total ?? 0;
            const totalSaidas = saidas[0]?.total ?? 0;
            const saldoAtual = (conta.saldoInicial || 0) + totalEntradas - totalSaidas;

            return {
              _id: id,
              nome: conta.nome,
              tipo: conta.tipo,
              banco: conta.banco,
              saldoInicial: conta.saldoInicial || 0,
              saldoAtual,
            };
          })
        );

        return res.status(200).json(contasComSaldo);
      }

      return res.status(400).json({ message: 'GET: Nenhum query.type identificado.' });
    }

    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
