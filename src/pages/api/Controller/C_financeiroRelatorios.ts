import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();

  switch (req.method) {
    case 'GET': {
      const { type } = req.query;

      if (type === 'fluxoCaixa') {
        const { dataInicio, dataFim, contaFinanceiraId } = req.query;

        if (!dataInicio || !dataFim) {
          return res.status(400).json({ message: 'dataInicio e dataFim são obrigatórios.' });
        }

        const filter: any = {
          dataMovimento: { $gte: dataInicio as string, $lte: dataFim as string },
        };
        if (contaFinanceiraId) filter.contaFinanceiraId = contaFinanceiraId as string;

        const movimentacoes = await db.collection('financeiro_movimentacoes').find(filter).sort({ dataMovimento: 1 }).toArray();

        // Agrupar por data
        const mapaData: Record<string, { data: string; entradas: number; saidas: number }> = {};
        for (const m of movimentacoes) {
          const data = m.dataMovimento.slice(0, 10);
          if (!mapaData[data]) mapaData[data] = { data, entradas: 0, saidas: 0 };
          if (m.tipo === 'entrada') mapaData[data].entradas += m.valor || 0;
          else mapaData[data].saidas += m.valor || 0;
        }

        const linhas = Object.values(mapaData).map((l) => ({
          ...l,
          saldo_dia: l.entradas - l.saidas,
        }));

        const totalEntradas = linhas.reduce((acc, l) => acc + l.entradas, 0);
        const totalSaidas = linhas.reduce((acc, l) => acc + l.saidas, 0);
        const resultado = totalEntradas - totalSaidas;

        return res.status(200).json({ linhas, totalEntradas, totalSaidas, resultado });
      }

      if (type === 'receitasPorCategoria') {
        const { dataInicio, dataFim } = req.query;
        if (!dataInicio || !dataFim) {
          return res.status(400).json({ message: 'dataInicio e dataFim são obrigatórios.' });
        }

        const movimentacoes = await db.collection('financeiro_movimentacoes').find({
          tipo: 'entrada',
          dataMovimento: { $gte: dataInicio as string, $lte: dataFim as string },
        }).toArray();

        const mapaCategoria: Record<string, number> = {};
        for (const m of movimentacoes) {
          const cat = m.categoriaId || 'sem_categoria';
          mapaCategoria[cat] = (mapaCategoria[cat] || 0) + (m.valor || 0);
        }

        const categorias = await db.collection('financeiro_categorias').find({}).toArray();
        const mapaNomes: Record<string, string> = {};
        for (const c of categorias) mapaNomes[c._id.toString()] = c.nome;

        const resultado = Object.entries(mapaCategoria).map(([categoriaId, total]) => ({
          categoriaId,
          nome: mapaNomes[categoriaId] || categoriaId,
          total,
        }));

        return res.status(200).json({ categorias: resultado });
      }

      if (type === 'despesasPorCategoria') {
        const { dataInicio, dataFim } = req.query;
        if (!dataInicio || !dataFim) {
          return res.status(400).json({ message: 'dataInicio e dataFim são obrigatórios.' });
        }

        const movimentacoes = await db.collection('financeiro_movimentacoes').find({
          tipo: 'saida',
          dataMovimento: { $gte: dataInicio as string, $lte: dataFim as string },
        }).toArray();

        const mapaCategoria: Record<string, number> = {};
        for (const m of movimentacoes) {
          const cat = m.categoriaId || 'sem_categoria';
          mapaCategoria[cat] = (mapaCategoria[cat] || 0) + (m.valor || 0);
        }

        const categorias = await db.collection('financeiro_categorias').find({}).toArray();
        const mapaNomes: Record<string, string> = {};
        for (const c of categorias) mapaNomes[c._id.toString()] = c.nome;

        const resultado = Object.entries(mapaCategoria).map(([categoriaId, total]) => ({
          categoriaId,
          nome: mapaNomes[categoriaId] || categoriaId,
          total,
        }));

        return res.status(200).json({ categorias: resultado });
      }

      if (type === 'inadimplencia') {
        const now = new Date();
        const mes = req.query.mes ? Number(req.query.mes) : now.getMonth() + 1;
        const ano = req.query.ano ? Number(req.query.ano) : now.getFullYear();

        const inicioMes = new Date(ano, mes - 1, 1).toISOString().slice(0, 10);
        const fimMes = new Date(ano, mes, 0).toISOString().slice(0, 10);

        const filter: any = {
          tipo: 'receber',
          status: 'vencido',
        };

        if (req.query.mes || req.query.ano) {
          filter.vencimento = { $gte: inicioMes, $lte: fimMes };
        }

        const titulos = await db.collection('financeiro_titulos').find(filter).toArray();
        const total = titulos.reduce((acc: number, t: any) => acc + (t.saldo || 0), 0);

        return res.status(200).json({ titulos, total });
      }

      return res.status(400).json({ message: 'GET: Nenhum query.type identificado.' });
    }

    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
