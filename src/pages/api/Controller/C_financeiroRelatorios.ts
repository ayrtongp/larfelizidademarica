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

      if (type === 'matrizIdosos') {
        const ano = req.query.ano ? Number(req.query.ano) : new Date().getFullYear();
        const dataInicio = `${ano}-01-01`;
        const dataFim    = `${ano}-12-31`;
        const { ObjectId } = await import('mongodb');
        const mesesRef = ['01','02','03','04','05','06','07','08','09','10','11','12'];

        // ── 1. Todos os residentes ativos + os que tiveram movimento no ano ─
        const [residentesAtivos, movDiretas, movRateios] = await Promise.all([
          db.collection('residentes')
            .find({ is_ativo: 'S' })
            .project({ _id: 1, nome: 1 })
            .toArray(),

          // movimentações diretas vinculadas a residente
          db.collection('financeiro_movimentacoes').aggregate([
            {
              $match: {
                dataMovimento: { $gte: dataInicio, $lte: dataFim },
                vinculadoTipo: 'residente',
                vinculadoId:   { $exists: true, $nin: [null, ''] },
              },
            },
            {
              $group: {
                _id: { residenteId: '$vinculadoId', mes: { $substr: ['$dataMovimento', 5, 2] } },
                receita: { $sum: { $cond: [{ $eq: ['$tipoMovimento', 'entrada'] }, '$valor', 0] } },
                despesa: { $sum: { $cond: [{ $eq: ['$tipoMovimento', 'saida'] },   '$valor', 0] } },
              },
            },
          ]).toArray(),

          // rateios por residente
          db.collection('financeiro_rateios').aggregate([
            { $match: { residenteId: { $exists: true, $nin: [null, ''] } } },
            {
              $lookup: {
                from: 'financeiro_movimentacoes',
                let: { movId: '$movimentacaoId' },
                pipeline: [
                  { $match: { $expr: { $eq: [{ $toString: '$_id' }, '$$movId'] } } },
                  { $match: { dataMovimento: { $gte: dataInicio, $lte: dataFim } } },
                ],
                as: '_mov',
              },
            },
            { $unwind: '$_mov' },
            {
              $group: {
                _id: { residenteId: '$residenteId', mes: { $substr: ['$_mov.dataMovimento', 5, 2] } },
                receita: { $sum: { $cond: [{ $eq: ['$_mov.tipoMovimento', 'entrada'] }, '$valor', 0] } },
                despesa: { $sum: { $cond: [{ $eq: ['$_mov.tipoMovimento', 'saida'] },   '$valor', 0] } },
              },
            },
          ]).toArray(),
        ]);

        // ── 2. Merge de movimentações por residenteId + mês ──────────────
        const mapaMovs: Record<string, Record<string, { receita: number; despesa: number }>> = {};
        for (const row of [...movDiretas, ...movRateios]) {
          const rid = row._id.residenteId;
          const mes = row._id.mes;
          if (!mapaMovs[rid]) mapaMovs[rid] = {};
          if (!mapaMovs[rid][mes]) mapaMovs[rid][mes] = { receita: 0, despesa: 0 };
          mapaMovs[rid][mes].receita += row.receita;
          mapaMovs[rid][mes].despesa += row.despesa;
        }

        // ── 3. Ids com movimento mas não ativos (saíram no decorrer do ano) ─
        const idsComMov = Object.keys(mapaMovs);
        const idsAtivos = new Set(residentesAtivos.map((r: any) => r._id.toString()));
        const idsExtraIds = idsComMov.filter((id) => !idsAtivos.has(id) && ObjectId.isValid(id));

        const residentesExtra = idsExtraIds.length
          ? await db.collection('residentes').find({
              _id: { $in: idsExtraIds.map((id) => new ObjectId(id)) },
            }).project({ _id: 1, nome: 1 }).toArray()
          : [];

        // ── 4. Lista final de residentes (ativos + com movimento no ano) ──
        const todos = [...residentesAtivos, ...residentesExtra];
        const mapaNomes: Record<string, string> = {};
        for (const r of todos) mapaNomes[r._id.toString()] = r.nome ?? r._id.toString();

        // ── 5. Monta a resposta ───────────────────────────────────────────
        const resultado = todos.map((r: any) => {
          const rid  = r._id.toString();
          const mapaM = mapaMovs[rid] ?? {};
          const meses = mesesRef.map((mes) => ({
            mes,
            receita: mapaM[mes]?.receita ?? 0,
            despesa: mapaM[mes]?.despesa ?? 0,
            saldo:   (mapaM[mes]?.receita ?? 0) - (mapaM[mes]?.despesa ?? 0),
          }));
          const totalReceita = meses.reduce((a, m) => a + m.receita, 0);
          const totalDespesa = meses.reduce((a, m) => a + m.despesa, 0);
          return {
            residenteId:  rid,
            nome:         r.nome ?? rid,
            ativo:        true,
            meses,
            totalReceita,
            totalDespesa,
            totalSaldo:   totalReceita - totalDespesa,
          };
        }).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

        return res.status(200).json(resultado);
      }

      return res.status(400).json({ message: 'GET: Nenhum query.type identificado.' });
    }

    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
