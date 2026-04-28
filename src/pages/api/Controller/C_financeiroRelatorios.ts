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
          if (m.tipoMovimento === 'entrada') mapaData[data].entradas += m.valor || 0;
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
          tipoMovimento: 'entrada',
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
          tipoMovimento: 'saida',
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
        const competenciaInicio = `${ano}-01`;
        const competenciaFim   = `${ano}-12`;
        const { ObjectId } = await import('mongodb');
        const mesesRef = ['01','02','03','04','05','06','07','08','09','10','11','12'];

        // ── 1. Todos os residentes ativos + os que tiveram movimento no ano ─
        const [residentesAtivos, movDiretas, movRateios] = await Promise.all([
          db.collection('residentes')
            .find({ is_ativo: 'S' })
            .project({ _id: 1, nome: 1 })
            .toArray(),

          // movimentações diretas vinculadas a residente — agrupadas por competência
          db.collection('financeiro_movimentacoes').aggregate([
            {
              $match: {
                competencia:  { $gte: competenciaInicio, $lte: competenciaFim },
                vinculadoTipo: 'residente',
                vinculadoId:   { $exists: true, $nin: [null, ''] },
              },
            },
            {
              $group: {
                _id: { residenteId: '$vinculadoId', mes: { $substr: ['$competencia', 5, 2] } },
                receita: { $sum: { $cond: [{ $eq: ['$tipoMovimento', 'entrada'] }, '$valor', 0] } },
                despesa: { $sum: { $cond: [{ $eq: ['$tipoMovimento', 'saida'] },   '$valor', 0] } },
              },
            },
          ]).toArray(),

          // rateios por residente — agrupados pela competência da movimentação pai
          db.collection('financeiro_rateios').aggregate([
            { $match: { residenteId: { $exists: true, $nin: [null, ''] } } },
            {
              $lookup: {
                from: 'financeiro_movimentacoes',
                let: { movId: '$movimentacaoId' },
                pipeline: [
                  { $match: { $expr: { $eq: [{ $toString: '$_id' }, '$$movId'] } } },
                  { $match: { competencia: { $gte: competenciaInicio, $lte: competenciaFim } } },
                ],
                as: '_mov',
              },
            },
            { $unwind: '$_mov' },
            {
              $group: {
                _id: { residenteId: '$residenteId', mes: { $substr: ['$_mov.competencia', 5, 2] } },
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

      if (type === 'matrizCategorias') {
        const ano = req.query.ano ? Number(req.query.ano) : new Date().getFullYear();
        const competenciaInicio = `${ano}-01`;
        const competenciaFim   = `${ano}-12`;

        const [movAgg, categorias] = await Promise.all([
          db.collection('financeiro_movimentacoes').aggregate([
            {
              $match: {
                competencia: { $gte: competenciaInicio, $lte: competenciaFim },
                tipoMovimento: { $in: ['entrada', 'saida'] },
              },
            },
            {
              $group: {
                _id: {
                  categoriaId:   { $ifNull: ['$categoriaId', '__sem_categoria__'] },
                  tipoMovimento: '$tipoMovimento',
                  mes:           { $substr: ['$competencia', 5, 2] },
                },
                total: { $sum: '$valor' },
              },
            },
          ]).toArray(),
          db.collection('financeiro_categorias').find({}).toArray(),
        ]);

        const mapaCat: Record<string, any> = {};
        for (const c of categorias) mapaCat[c._id.toString()] = c;

        // Acumula por categoria + tipo + mes
        const mapaLinhas: Record<string, Record<string, Record<string, number>>> = {};
        for (const row of movAgg) {
          const catId = row._id.categoriaId === '__sem_categoria__' ? '__sem_categoria__' : row._id.categoriaId;
          const tipo  = row._id.tipoMovimento;
          const mes   = row._id.mes;
          if (!mapaLinhas[catId]) mapaLinhas[catId] = {};
          if (!mapaLinhas[catId][tipo]) mapaLinhas[catId][tipo] = {};
          mapaLinhas[catId][tipo][mes] = (mapaLinhas[catId][tipo][mes] ?? 0) + row.total;
        }

        const mesesRef = ['01','02','03','04','05','06','07','08','09','10','11','12'];

        const resultado = Object.entries(mapaLinhas).map(([catId, porTipo]) => {
          const cat = catId === '__sem_categoria__' ? null : mapaCat[catId];
          const pai = cat?.categoriaPaiId ? mapaCat[cat.categoriaPaiId] : null;

          const meses = mesesRef.map((mes) => ({
            mes,
            receita: porTipo['entrada']?.[mes] ?? 0,
            despesa: porTipo['saida']?.[mes]   ?? 0,
            saldo:  (porTipo['entrada']?.[mes] ?? 0) - (porTipo['saida']?.[mes] ?? 0),
          }));

          const totalReceita = meses.reduce((a, m) => a + m.receita, 0);
          const totalDespesa = meses.reduce((a, m) => a + m.despesa, 0);

          return {
            categoriaId:    catId,
            nome:           cat?.nome ?? 'Sem categoria',
            tipo:           cat?.tipo ?? 'despesa',
            categoriaPaiId: cat?.categoriaPaiId ?? null,
            categoriaPaiNome: pai?.nome ?? null,
            meses,
            totalReceita,
            totalDespesa,
            totalSaldo: totalReceita - totalDespesa,
          };
        }).sort((a, b) => {
          const paiA = a.categoriaPaiNome ?? a.nome;
          const paiB = b.categoriaPaiNome ?? b.nome;
          if (paiA !== paiB) return paiA.localeCompare(paiB, 'pt-BR');
          return a.nome.localeCompare(b.nome, 'pt-BR');
        });

        return res.status(200).json(resultado);
      }

      if (type === 'matrizIdososDetalhe') {
        const { residenteId, ano, mes } = req.query;
        if (!residenteId || !ano || !mes) {
          return res.status(400).json({ message: 'residenteId, ano e mes são obrigatórios.' });
        }
        const { ObjectId } = await import('mongodb');
        const competencia = `${ano}-${mes}`;

        const [movDiretas, rateios] = await Promise.all([
          db.collection('financeiro_movimentacoes').find({
            competencia,
            vinculadoTipo: 'residente',
            vinculadoId: residenteId as string,
          }).toArray(),

          db.collection('financeiro_rateios').aggregate([
            { $match: { residenteId: residenteId as string } },
            {
              $lookup: {
                from: 'financeiro_movimentacoes',
                let: { movId: '$movimentacaoId' },
                pipeline: [
                  { $match: { $expr: { $eq: [{ $toString: '$_id' }, '$$movId'] } } },
                  { $match: { competencia } },
                ],
                as: '_mov',
              },
            },
            { $unwind: '$_mov' },
          ]).toArray(),
        ]);

        const residente = ObjectId.isValid(residenteId as string)
          ? await db.collection('residentes').findOne({ _id: new ObjectId(residenteId as string) })
          : null;

        const items = [
          ...movDiretas.map((m: any) => ({
            _id: m._id.toString(),
            historico: m.historico || '',
            tipoMovimento: m.tipoMovimento,
            valor: m.valor || 0,
            dataMovimento: m.dataMovimento || '',
            competencia: m.competencia || '',
            fonte: 'direta' as const,
          })),
          ...rateios.map((r: any) => ({
            _id: r._id.toString(),
            movimentacaoId: r.movimentacaoId,
            historico: r._mov.historico || '',
            tipoMovimento: r._mov.tipoMovimento,
            valor: r.valor || 0,
            dataMovimento: r._mov.dataMovimento || '',
            competencia: r._mov.competencia || '',
            fonte: 'rateio' as const,
          })),
        ].sort((a, b) => a.dataMovimento.localeCompare(b.dataMovimento));

        return res.status(200).json({
          residenteId,
          nome: residente?.nome ?? residenteId,
          ano: Number(ano),
          mes,
          items,
        });
      }

      if (type === 'matrizCategoriasDetalhe') {
        const { categoriaId, ano, mes } = req.query;
        if (!ano || !mes) {
          return res.status(400).json({ message: 'ano e mes são obrigatórios.' });
        }
        const competencia = `${ano}-${mes}`;
        const isSemCategoria = !categoriaId || categoriaId === '__sem_categoria__';

        const matchMov: any = { competencia, tipoMovimento: { $in: ['entrada', 'saida'] } };
        if (isSemCategoria) {
          matchMov.categoriaId = { $exists: false };
        } else {
          matchMov.categoriaId = categoriaId as string;
        }

        const matchRateio: any = isSemCategoria
          ? { categoriaId: { $exists: false } }
          : { categoriaId: categoriaId as string };

        const [movDiretas, rateios, cat] = await Promise.all([
          db.collection('financeiro_movimentacoes').find(matchMov).sort({ dataMovimento: 1 }).toArray(),
          db.collection('financeiro_rateios').aggregate([
            { $match: matchRateio },
            {
              $lookup: {
                from: 'financeiro_movimentacoes',
                let: { movId: '$movimentacaoId' },
                pipeline: [
                  { $match: { $expr: { $eq: [{ $toString: '$_id' }, '$$movId'] } } },
                  { $match: { competencia } },
                ],
                as: '_mov',
              },
            },
            { $unwind: '$_mov' },
          ]).toArray(),
          isSemCategoria
            ? Promise.resolve(null)
            : db.collection('financeiro_categorias').findOne({ _id: { $toString: categoriaId } })
              .catch(() => null),
        ]);

        const items = [
          ...movDiretas.map((m: any) => ({
            _id: m._id.toString(),
            historico: m.historico || '',
            tipoMovimento: m.tipoMovimento,
            valor: m.valor || 0,
            dataMovimento: m.dataMovimento || '',
            fonte: 'direta' as const,
          })),
          ...rateios.map((r: any) => ({
            _id: r._id.toString(),
            movimentacaoId: r.movimentacaoId,
            historico: r._mov?.historico || '',
            tipoMovimento: r._mov?.tipoMovimento,
            valor: r.valor || 0,
            dataMovimento: r._mov?.dataMovimento || '',
            fonte: 'rateio' as const,
          })),
        ].sort((a, b) => a.dataMovimento.localeCompare(b.dataMovimento));

        return res.status(200).json({ categoriaId: categoriaId ?? '__sem_categoria__', nome: cat?.nome ?? 'Sem categoria', ano: Number(ano), mes, items });
      }

      return res.status(400).json({ message: 'GET: Nenhum query.type identificado.' });
    }

    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
