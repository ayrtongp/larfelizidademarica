import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  // Idosos sem anotação de enfermagem nas últimas 24h
  if (req.query.type === 'semAnotacao24h') {
    try {
      const residentesCol = db.collection('residentes');

      const pipeline = [
        { $match: { is_ativo: 'S' } },
        { $addFields: { residente_id: { $toString: '$_id' } } },
        {
          $lookup: {
            from: 'anotacoesenfermagem',
            localField: 'residente_id',
            foreignField: 'residente_id',
            pipeline: [
              { $sort: { createdAt: -1 } },
              { $limit: 1 },
              { $project: { createdAt: 1 } },
            ],
            as: 'ultimaAnotacao',
          },
        },
        {
          $project: {
            nome: 1,
            apelido: 1,
            foto_base64: 1,
            foto_cdn: 1,
            ultimaAnotacaoAt: { $arrayElemAt: ['$ultimaAnotacao.createdAt', 0] },
          },
        },
        { $sort: { nome: 1 } },
      ];

      const todos = await residentesCol.aggregate(pipeline).toArray();

      const agora = new Date();
      const cutoff = new Date(agora.getTime() - 24 * 60 * 60 * 1000);

      const semAnotacao = todos.filter((r: any) => {
        if (!r.ultimaAnotacaoAt) return true;
        const data = new Date(r.ultimaAnotacaoAt);
        return isNaN(data.getTime()) || data < cutoff;
      });

      return res.status(200).json({
        total: semAnotacao.length,
        totalAtivos: todos.length,
        idosos: semAnotacao.map((r: any) => ({
          _id: r._id,
          nome: r.nome,
          apelido: r.apelido,
          foto_base64: r.foto_base64,
          foto_cdn: r.foto_cdn,
          ultimaAnotacao: r.ultimaAnotacaoAt ?? null,
        })),
      });
    } catch (err) {
      console.error('[C_gestao] semAnotacao24h:', err);
      return res.status(500).json({ message: 'Erro ao consultar anotações.' });
    }
  }

  // Idosos sem sinais vitais nas últimas 24h
  if (req.query.type === 'semSinaisVitais24h') {
    try {
      const residentesCol = db.collection('residentes');

      const pipeline = [
        { $match: { is_ativo: 'S' } },
        { $addFields: { residente_id: { $toString: '$_id' } } },
        {
          $lookup: {
            from: 'sinaisvitais',
            localField: 'residente_id',
            foreignField: 'residente_id',
            pipeline: [
              { $sort: { createdAt: -1 } },
              { $limit: 1 },
              { $project: { createdAt: 1 } },
            ],
            as: 'ultimoSinal',
          },
        },
        {
          $project: {
            nome: 1,
            apelido: 1,
            foto_base64: 1,
            foto_cdn: 1,
            ultimoSinalAt: { $arrayElemAt: ['$ultimoSinal.createdAt', 0] },
          },
        },
        { $sort: { nome: 1 } },
      ];

      const todos = await residentesCol.aggregate(pipeline).toArray();

      const agora = new Date();
      const cutoff = new Date(agora.getTime() - 24 * 60 * 60 * 1000);

      const semSinal = todos.filter((r: any) => {
        if (!r.ultimoSinalAt) return true;
        const data = new Date(r.ultimoSinalAt);
        return isNaN(data.getTime()) || data < cutoff;
      });

      return res.status(200).json({
        total: semSinal.length,
        totalAtivos: todos.length,
        idosos: semSinal.map((r: any) => ({
          _id: r._id,
          nome: r.nome,
          apelido: r.apelido,
          foto_base64: r.foto_base64,
          foto_cdn: r.foto_cdn,
          ultimoRegistro: r.ultimoSinalAt ?? null,
        })),
      });
    } catch (err) {
      console.error('[C_gestao] semSinaisVitais24h:', err);
      return res.status(500).json({ message: 'Erro ao consultar sinais vitais.' });
    }
  }

  // Funcionários CLT sem contracheque — a partir de junho/2026, ref. 3 meses antes
  if (req.query.type === 'semContracheque') {
    try {
      const funcionariosCol = db.collection('funcionarios_clt');
      const docsCol = db.collection('rh_documentos_periodo');

      const agora = new Date();
      const mesAtual = agora.getMonth() + 1;
      const anoAtual = agora.getFullYear();

      // Meses que deveriam ter contracheque: a partir de jun/2026
      // periodo armazenado = referência (mês anterior ao lançamento)
      // Ex: lançamento junho → referência maio → periodo.mes=5
      const mesesEsperados: { mesLancamento: number; anoLancamento: number; mesRef: number; anoRef: number; label: string }[] = [];
      const MES_INICIO = 6;
      const ANO_INICIO = 2026;
      const MESES_NOME = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      let m = MES_INICIO;
      let a = ANO_INICIO;
      while (a < anoAtual || (a === anoAtual && m <= mesAtual)) {
        const mesRef = m === 1 ? 12 : m - 1;
        const anoRef = m === 1 ? a - 1 : a;
        mesesEsperados.push({ mesLancamento: m, anoLancamento: a, mesRef, anoRef, label: `${MESES_NOME[m]}/${a}` });
        m++;
        if (m > 12) { m = 1; a++; }
      }

      if (mesesEsperados.length === 0) {
        return res.status(200).json({ total: 0, totalAtivos: 0, funcionarios: [], mesesEsperados: [] });
      }

      // Buscar funcionários ativos
      const funcionarios = await funcionariosCol.aggregate([
        { $match: { status: 'ativo' } },
        {
          $addFields: { usuarioObjectId: { $toObjectId: '$usuarioId' } },
        },
        {
          $lookup: {
            from: 'usuario',
            localField: 'usuarioObjectId',
            foreignField: '_id',
            as: 'usuarioArr',
          },
        },
        {
          $addFields: {
            usuario: { $arrayElemAt: ['$usuarioArr', 0] },
          },
        },
        {
          $project: {
            usuarioObjectId: 0,
            usuarioArr: 0,
          },
        },
      ]).toArray();

      // Buscar contracheques existentes
      const contracheques = await docsCol.find({
        tipo: 'contracheque',
      }).project({ funcionarioId: 1, 'periodo.mes': 1, 'periodo.ano': 1 }).toArray();

      const contrachequeSet = new Set(
        contracheques.map((c: any) => `${c.funcionarioId}_${c.periodo.mes}_${c.periodo.ano}`)
      );

      const faltando: any[] = [];
      for (const func of funcionarios) {
        const faltam = mesesEsperados.filter(
          me => !contrachequeSet.has(`${func._id.toString()}_${me.mesRef}_${me.anoRef}`)
        );
        if (faltam.length > 0) {
          const nome = func.usuario
            ? `${func.usuario.nome ?? ''} ${func.usuario.sobrenome ?? ''}`.trim()
            : '—';
          faltando.push({
            _id: func._id,
            nome,
            cargo: func.contrato?.cargo ?? '',
            foto_base64: func.usuario?.foto_base64 ?? null,
            foto_cdn: func.usuario?.foto_cdn ?? null,
            faltam: faltam.length,
            mesesFaltando: faltam.map(m => m.label),
          });
        }
      }

      faltando.sort((a, b) => b.faltam - a.faltam);

      return res.status(200).json({
        total: faltando.length,
        totalAtivos: funcionarios.length,
        funcionarios: faltando,
        mesesEsperados: mesesEsperados.map(m => m.label),
      });
    } catch (err) {
      console.error('[C_gestao] semContracheque:', err);
      return res.status(500).json({ message: 'Erro ao consultar contracheques.' });
    }
  }

  // Evoluções atrasadas — mesma lógica do FindSemEvolucao7dService do Express
  if (req.query.type === 'evolucaoAtrasada') {
    try {
      const residentesCol = db.collection('residentes');

      const pipeline = [
        { $match: { $or: [{ is_ativo: 'S' }, { is_ativo: true }] } },
        { $match: { $or: [{ tipo_contrato: 'Residência Fixa' }, { tipo_contrato: 'Centro Dia' }] } },
        { $addFields: { ridStr: { $toString: '$_id' } } },
        {
          $lookup: {
            from: 'evolucao',
            let: { rid: '$ridStr' },
            pipeline: [
              { $match: { $expr: { $and: [{ $eq: ['$residente_id', '$$rid'] }, { $eq: ['$categoria', 'Evolução'] }] } } },
              { $addFields: { dataEvolucaoDate: { $cond: [{ $eq: [{ $type: '$dataEvolucao' }, 'date'] }, '$dataEvolucao', { $convert: { input: '$dataEvolucao', to: 'date', onError: null, onNull: null } }] } } },
              { $group: { _id: '$area', ultimaEvolucao: { $max: '$dataEvolucaoDate' } } },
            ],
            as: 'evols',
          },
        },
        { $unwind: { path: '$evols', preserveNullAndEmptyArrays: false } },
        {
          $addFields: {
            corte7d: { $dateSubtract: { startDate: '$$NOW', unit: 'day', amount: 7 } },
            ultimaEvolucao: '$evols.ultimaEvolucao',
            area: '$evols._id',
          },
        },
        { $match: { $expr: { $lt: ['$ultimaEvolucao', '$corte7d'] } } },
        { $match: { area: { $nin: ['Cuidador de Idosos', 'Téc. de Enfermagem', 'Téc de Enfermagem', 'Responsável Técnico(a)'] } } },
        {
          $addFields: {
            daysSince: { $dateDiff: { startDate: '$ultimaEvolucao', endDate: '$$NOW', unit: 'day' } },
            ultimaEvolucao_fmt: { $dateToString: { date: '$ultimaEvolucao', format: '%d/%m/%Y', timezone: 'America/Sao_Paulo' } },
          },
        },
        {
          $project: {
            _id: 0, area: 1, nome: 1, apelido: 1,
            foto_base64: 1, foto_cdn: 1,
            ultimaEvolucao_fmt: 1, daysSince: 1,
          },
        },
        { $sort: { area: 1, nome: 1 } },
        {
          $group: {
            _id: '$area',
            residentes: {
              $push: {
                nome: '$nome', apelido: '$apelido',
                foto_base64: '$foto_base64', foto_cdn: '$foto_cdn',
                ultimaEvolucao: '$ultimaEvolucao_fmt', daysSince: '$daysSince',
              },
            },
          },
        },
        { $project: { _id: 0, area: '$_id', residentes: 1 } },
        { $sort: { area: 1 } },
      ];

      const porArea = await residentesCol.aggregate(pipeline).toArray();
      const totalPendentes = porArea.reduce((acc: number, a: any) => acc + a.residentes.length, 0);
      const totalAtivos = await residentesCol.countDocuments({
        $and: [
          { $or: [{ is_ativo: 'S' }, { is_ativo: true }] },
          { $or: [{ tipo_contrato: 'Residência Fixa' }, { tipo_contrato: 'Centro Dia' }] },
        ],
      });

      const porAreaMap: Record<string, any[]> = {};
      for (const a of porArea) porAreaMap[a.area] = a.residentes;

      return res.status(200).json({
        totalPendentes,
        totalAtivos,
        totalAreas: porArea.length,
        porArea: porAreaMap,
      });
    } catch (err) {
      console.error('[C_gestao] evolucaoAtrasada:', err);
      return res.status(500).json({ message: 'Erro ao consultar evoluções.' });
    }
  }

  // Evacuação ausente — mesma lógica do ElimAusenteService do backend Express
  // Usa anotacoesenfermagem.eliminacoesintestinais === "Ausente", threshold 4+
  if (req.query.type === 'evacuacaoAusente') {
    try {
      const residentesCol = db.collection('residentes');

      const pipeline = [
        { $match: { is_ativo: 'S' } },
        {
          $lookup: {
            from: 'anotacoesenfermagem',
            let: { rid_str: { $toString: '$_id' } },
            pipeline: [
              { $match: { $expr: { $eq: ['$residente_id', '$$rid_str'] } } },
              { $sort: { createdAt: -1 } },
              { $limit: 20 },
            ],
            as: 'ultimasAnotacoes',
          },
        },
        {
          $addFields: {
            consecutiveCount: {
              $let: {
                vars: {
                  result: {
                    $reduce: {
                      input: '$ultimasAnotacoes.eliminacoesintestinais',
                      initialValue: { count: 0, broken: false },
                      in: {
                        count: {
                          $cond: [
                            '$$value.broken',
                            '$$value.count',
                            { $cond: [{ $eq: ['$$this', 'Ausente'] }, { $add: ['$$value.count', 1] }, '$$value.count'] },
                          ],
                        },
                        broken: {
                          $cond: ['$$value.broken', true, { $ne: ['$$this', 'Ausente'] }],
                        },
                      },
                    },
                  },
                },
                in: '$$result.count',
              },
            },
          },
        },
        { $match: { consecutiveCount: { $gte: 4 } } },
        {
          $project: {
            _id: 1,
            nome: 1,
            apelido: 1,
            foto_base64: 1,
            foto_cdn: 1,
            consecutiveCount: 1,
            ultimasAnotacoes: {
              $slice: [
                { $map: { input: '$ultimasAnotacoes', as: 'a', in: '$$a.createdAt' } },
                '$consecutiveCount',
              ],
            },
          },
        },
        { $sort: { consecutiveCount: -1 } },
      ];

      const alertas = await residentesCol.aggregate(pipeline).toArray();
      const totalAtivos = await residentesCol.countDocuments({ is_ativo: 'S' });

      return res.status(200).json({
        total: alertas.length,
        totalAtivos,
        alertas: alertas.map((a: any) => ({
          _id: a._id,
          nome: a.nome,
          apelido: a.apelido,
          foto_base64: a.foto_base64,
          foto_cdn: a.foto_cdn,
          consecutivos: a.consecutiveCount,
          registros: a.ultimasAnotacoes ?? [],
        })),
      });
    } catch (err) {
      console.error('[C_gestao] evacuacaoAusente:', err);
      return res.status(500).json({ message: 'Erro ao consultar evacuações.' });
    }
  }

  // Feridas abertas — mesma lógica do FeridasAbertasService do Express
  if (req.query.type === 'feridasAbertas') {
    try {
      const lesoesCol = db.collection('lesoes');
      const STATUS_FECHADO = /^(encerrada|cancelada)$/i;

      const feridas = await lesoesCol
        .find({ status: { $not: STATUS_FECHADO } })
        .toArray();

      const agora = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));

      const atrasadas: any[] = [];
      const emDia: any[] = [];

      for (const f of feridas) {
        const comentarios: { createdAt: string }[] = f.comentarios ?? [];

        const ultimaAt = comentarios.length > 0
          ? comentarios.reduce((max: any, c: any) => c.createdAt > max.createdAt ? c : max).createdAt
          : null;

        const dataRefStr = ultimaAt ?? f.createdAt;
        const dataRef = new Date(dataRefStr.replace(' ', 'T'));
        const dias = Math.floor((agora.getTime() - dataRef.getTime()) / (1000 * 60 * 60 * 24));

        const tipo = (f.tipoLesao ?? '').replace(/_/g, ' ');
        const status = f.status ?? '';
        const dataLesao = f.dataLesao ?? '';

        const item = {
          _id: f._id,
          nome: f.userName,
          regiaoCorpo: f.regiaoCorpo,
          tipo,
          status,
          dataLesao,
          dias,
          ultimaAtualizacao: ultimaAt ? dataRefStr : null,
        };

        if (dias > 7) {
          atrasadas.push(item);
        } else {
          emDia.push(item);
        }
      }

      atrasadas.sort((a, b) => b.dias - a.dias);
      emDia.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

      return res.status(200).json({
        totalAbertas: feridas.length,
        atrasadas: atrasadas.length,
        emDia: emDia.length,
        listaAtrasadas: atrasadas,
        listaEmDia: emDia,
      });
    } catch (err) {
      console.error('[C_gestao] feridasAbertas:', err);
      return res.status(500).json({ message: 'Erro ao consultar feridas.' });
    }
  }

  // Folha de ponto pendente — mesmo esquema do contracheque
  if (req.query.type === 'semFolhaPonto') {
    try {
      const funcionariosCol = db.collection('funcionarios_clt');
      const docsCol = db.collection('rh_documentos_periodo');

      const agora = new Date();
      const mesAtual = agora.getMonth() + 1;
      const anoAtual = agora.getFullYear();

      const mesesEsperados: { mesLancamento: number; anoLancamento: number; mesRef: number; anoRef: number; label: string }[] = [];
      const MES_INICIO = 6;
      const ANO_INICIO = 2026;
      const MESES_NOME = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      let m = MES_INICIO;
      let a = ANO_INICIO;
      while (a < anoAtual || (a === anoAtual && m <= mesAtual)) {
        const mesRef = m === 1 ? 12 : m - 1;
        const anoRef = m === 1 ? a - 1 : a;
        mesesEsperados.push({ mesLancamento: m, anoLancamento: a, mesRef, anoRef, label: `${MESES_NOME[m]}/${a}` });
        m++;
        if (m > 12) { m = 1; a++; }
      }

      if (mesesEsperados.length === 0) {
        return res.status(200).json({ total: 0, totalAtivos: 0, funcionarios: [], mesesEsperados: [] });
      }

      const funcionarios = await funcionariosCol.aggregate([
        { $match: { status: 'ativo' } },
        { $addFields: { usuarioObjectId: { $toObjectId: '$usuarioId' } } },
        { $lookup: { from: 'usuario', localField: 'usuarioObjectId', foreignField: '_id', as: 'usuarioArr' } },
        { $addFields: { usuario: { $arrayElemAt: ['$usuarioArr', 0] } } },
        { $project: { usuarioObjectId: 0, usuarioArr: 0 } },
      ]).toArray();

      const docs = await docsCol.find({ tipo: 'folha_ponto' }).project({ funcionarioId: 1, 'periodo.mes': 1, 'periodo.ano': 1 }).toArray();
      const docSet = new Set(docs.map((c: any) => `${c.funcionarioId}_${c.periodo.mes}_${c.periodo.ano}`));

      const faltando: any[] = [];
      for (const func of funcionarios) {
        const faltam = mesesEsperados.filter(me => !docSet.has(`${func._id.toString()}_${me.mesRef}_${me.anoRef}`));
        if (faltam.length > 0) {
          const nome = func.usuario ? `${func.usuario.nome ?? ''} ${func.usuario.sobrenome ?? ''}`.trim() : '—';
          faltando.push({
            _id: func._id, nome,
            cargo: func.contrato?.cargo ?? '',
            foto_base64: func.usuario?.foto_base64 ?? null,
            foto_cdn: func.usuario?.foto_cdn ?? null,
            faltam: faltam.length,
            mesesFaltando: faltam.map(m => m.label),
          });
        }
      }

      faltando.sort((a, b) => b.faltam - a.faltam);

      return res.status(200).json({
        total: faltando.length,
        totalAtivos: funcionarios.length,
        funcionarios: faltando,
        mesesEsperados: mesesEsperados.map(m => m.label),
      });
    } catch (err) {
      console.error('[C_gestao] semFolhaPonto:', err);
      return res.status(500).json({ message: 'Erro ao consultar folhas de ponto.' });
    }
  }

  // Estoque da empresa abaixo do mínimo
  if (req.query.type === 'estoqueBaixo') {
    try {
      const estoqueCol = db.collection('estoque_empresa');

      const todos = await estoqueCol.find({ estoqueMinimo: { $gt: 0 } }).toArray();
      const abaixo = todos
        .filter((d: any) => d.quantidade < d.estoqueMinimo)
        .map((d: any) => ({ nome: d.nome, categoria: d.categoria, saldo: d.quantidade, minimo: d.estoqueMinimo }))
        .sort((a: any, b: any) => a.saldo - b.saldo);

      const totalItens = await estoqueCol.countDocuments({});

      return res.status(200).json({
        total: abaixo.length,
        totalInsumos: totalItens,
        itens: abaixo,
      });
    } catch (err) {
      console.error('[C_gestao] estoqueBaixo:', err);
      return res.status(500).json({ message: 'Erro ao consultar estoque.' });
    }
  }

  // Usuários ativos sem login há mais de 3 dias
  if (req.query.type === 'semLogin3d') {
    try {
      const usuariosCol = db.collection('usuario');

      const agora = new Date();
      const cutoff = new Date(agora.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

      const ativos = await usuariosCol
        .find({ ativo: 'S' })
        .project({ nome: 1, sobrenome: 1, funcao: 1, email: 1, lastLogin: 1, foto_cdn: 1, foto_base64: 1 })
        .sort({ nome: 1 })
        .toArray();

      const semLogin = ativos.filter((u: any) => {
        if (!u.lastLogin) return true;
        return u.lastLogin < cutoff;
      });

      return res.status(200).json({
        total: semLogin.length,
        totalAtivos: ativos.length,
        usuarios: semLogin.map((u: any) => ({
          _id: u._id,
          nome: `${u.nome ?? ''} ${u.sobrenome ?? ''}`.trim(),
          funcao: u.funcao ?? '',
          email: u.email ?? '',
          foto: u.foto_cdn || u.foto_base64 || null,
          lastLogin: u.lastLogin ?? null,
        })),
      });
    } catch (err) {
      console.error('[C_gestao] semLogin3d:', err);
      return res.status(500).json({ message: 'Erro ao consultar logins.' });
    }
  }

  return res.status(400).json({ message: 'GET: type não identificado.' });
}
