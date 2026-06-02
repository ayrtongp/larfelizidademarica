import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb';
import { SistemaAmortizacao, T_SimulacaoParcela } from '../../../types/T_financeiroParcelamentos';

function calcularStatusTitulo(saldo: number, vencimento: string): string {
  if (saldo <= 0) return 'liquidado';
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataVenc = new Date(vencimento);
  dataVenc.setHours(0, 0, 0, 0);
  return dataVenc < hoje ? 'vencido' : 'aberto';
}

function addMeses(dataISO: string, meses: number): string {
  const [anoStr, mesStr, diaStr] = dataISO.split('-');
  const ano = parseInt(anoStr);
  const mes = parseInt(mesStr) - 1;
  const dia = parseInt(diaStr);
  const totalMeses = mes + meses;
  const novoAno = ano + Math.floor(totalMeses / 12);
  const novoMes = totalMeses % 12;
  const ultimoDia = new Date(novoAno, novoMes + 1, 0).getDate();
  const diaFinal = Math.min(dia, ultimoDia);
  return `${novoAno}-${String(novoMes + 1).padStart(2, '0')}-${String(diaFinal).padStart(2, '0')}`;
}

function gerarParcelas(
  valorFinanciado: number,
  numeroParcelas: number,
  taxaJuros: number,
  sistemaAmortizacao: SistemaAmortizacao,
  primeiroPagamento: string
): T_SimulacaoParcela[] {
  const resultado: T_SimulacaoParcela[] = [];

  if (sistemaAmortizacao === 'fixo' || taxaJuros === 0) {
    const base = Math.floor((valorFinanciado / numeroParcelas) * 100) / 100;
    const resto = Math.round((valorFinanciado - base * numeroParcelas) * 100) / 100;
    let saldo = valorFinanciado;
    for (let k = 0; k < numeroParcelas; k++) {
      const isLast = k === numeroParcelas - 1;
      const valor = isLast ? base + resto : base;
      saldo = Math.round((saldo - valor) * 100) / 100;
      resultado.push({ numeroParcela: k + 1, vencimento: addMeses(primeiroPagamento, k), valor, juros: 0, amortizacao: valor, saldoDevedor: saldo });
    }
  } else if (sistemaAmortizacao === 'price') {
    const i = taxaJuros / 100;
    const pmt = (valorFinanciado * i) / (1 - Math.pow(1 + i, -numeroParcelas));
    const pmtRounded = Math.round(pmt * 100) / 100;
    let saldo = valorFinanciado;
    for (let k = 0; k < numeroParcelas; k++) {
      const isLast = k === numeroParcelas - 1;
      const juros = Math.round(saldo * i * 100) / 100;
      const amortizacao = isLast ? saldo : Math.round((pmtRounded - juros) * 100) / 100;
      const valor = isLast ? Math.round((amortizacao + juros) * 100) / 100 : pmtRounded;
      saldo = Math.round((saldo - amortizacao) * 100) / 100;
      resultado.push({ numeroParcela: k + 1, vencimento: addMeses(primeiroPagamento, k), valor, juros, amortizacao, saldoDevedor: saldo });
    }
  } else if (sistemaAmortizacao === 'sac') {
    const i = taxaJuros / 100;
    const amortBase = Math.floor((valorFinanciado / numeroParcelas) * 100) / 100;
    const amortResto = Math.round((valorFinanciado - amortBase * numeroParcelas) * 100) / 100;
    let saldo = valorFinanciado;
    for (let k = 0; k < numeroParcelas; k++) {
      const isLast = k === numeroParcelas - 1;
      const amortizacao = isLast ? amortBase + amortResto : amortBase;
      const juros = Math.round(saldo * i * 100) / 100;
      const valor = Math.round((amortizacao + juros) * 100) / 100;
      saldo = Math.round((saldo - amortizacao) * 100) / 100;
      resultado.push({ numeroParcela: k + 1, vencimento: addMeses(primeiroPagamento, k), valor, juros, amortizacao, saldoDevedor: saldo });
    }
  }

  return resultado;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const collection = db.collection('financeiro_parcelamentos');

  switch (req.method) {
    case 'GET': {
      const { type, id } = req.query;

      if (type === 'getAll') {
        const filtro: Record<string, any> = {};
        if (req.query.tipo) filtro.tipo = req.query.tipo;
        if (req.query.status) filtro.status = req.query.status;
        const data = await collection.find(filtro).sort({ primeiroPagamento: -1 }).toArray();
        return res.status(200).json(data);
      }

      if (type === 'getById' && id) {
        const parcelamento = await collection.findOne({ _id: new ObjectId(id as string) });
        if (!parcelamento) return res.status(404).json({ message: 'Parcelamento não encontrado.' });
        const parcelas = await db.collection('financeiro_titulos')
          .find({ parcelamentoId: id as string })
          .sort({ numeroParcela: 1 })
          .toArray();
        return res.status(200).json({ ...parcelamento, parcelas });
      }

      if (type === 'getParcelas' && id) {
        const parcelas = await db.collection('financeiro_titulos')
          .find({ parcelamentoId: id as string })
          .sort({ numeroParcela: 1 })
          .toArray();
        return res.status(200).json(parcelas);
      }

      return res.status(400).json({ message: 'GET: Nenhum query.type identificado.' });
    }

    case 'POST': {
      const { type } = req.query;

      if (type === 'simular') {
        const { valorFinanciado, numeroParcelas, taxaJuros, sistemaAmortizacao, primeiroPagamento } = req.body;
        if (!valorFinanciado || !numeroParcelas || !sistemaAmortizacao || !primeiroPagamento) {
          return res.status(400).json({ message: 'Campos obrigatórios: valorFinanciado, numeroParcelas, sistemaAmortizacao, primeiroPagamento.' });
        }
        const parcelas = gerarParcelas(Number(valorFinanciado), Number(numeroParcelas), Number(taxaJuros) || 0, sistemaAmortizacao, primeiroPagamento);
        const valorTotal = Math.round(parcelas.reduce((acc, p) => acc + p.valor, 0) * 100) / 100;
        return res.status(200).json({ parcelas, valorTotal });
      }

      if (type === 'new') {
        const {
          tipo, descricao, categoriaId, residenteId, responsavelId, fornecedorId, funcionarioId,
          contraparteId, contaFinanceiraPrevistaId, valorFinanciado, taxaJuros, sistemaAmortizacao,
          numeroParcelas, parcelasJaPagas, primeiroPagamento, observacoes,
        } = req.body;

        if (!tipo || !descricao || !categoriaId || !sistemaAmortizacao) {
          return res.status(400).json({ message: 'Campos obrigatórios: tipo, descricao, categoriaId, sistemaAmortizacao.' });
        }
        if (sistemaAmortizacao !== 'variavel' && !primeiroPagamento) {
          return res.status(400).json({ message: 'primeiroPagamento é obrigatório para sistemas fixo, price e sac.' });
        }

        if (sistemaAmortizacao !== 'variavel' && (!numeroParcelas || Number(numeroParcelas) < 2)) {
          return res.status(400).json({ message: 'numeroParcelas é obrigatório e deve ser >= 2 para este sistema de amortização.' });
        }

        if (sistemaAmortizacao !== 'variavel' && Number(valorFinanciado) <= 0) {
          return res.status(400).json({ message: 'valorFinanciado deve ser maior que zero.' });
        }

        const taxaJurosNum = Number(taxaJuros) || 0;
        const numParcelas = Number(numeroParcelas) || 0;
        const valFinanciado = Number(valorFinanciado) || 0;
        const jaPargas = Number(parcelasJaPagas) || 0;

        const now = new Date().toISOString();
        const camposOpcionais = {
          ...(residenteId && { residenteId }),
          ...(responsavelId && { responsavelId }),
          ...(fornecedorId && { fornecedorId }),
          ...(funcionarioId && { funcionarioId }),
          ...(contraparteId && { contraparteId }),
          ...(contaFinanceiraPrevistaId && { contaFinanceiraPrevistaId }),
          ...(observacoes && { observacoes }),
        };

        // Para variável: não gera títulos, apenas o header
        if (sistemaAmortizacao === 'variavel') {
          const novoParcelamento: any = {
            tipo, descricao, categoriaId,
            ...camposOpcionais,
            valorFinanciado: valFinanciado,
            valorTotal: 0,
            taxaJuros: 0,
            sistemaAmortizacao,
            numeroParcelas: numParcelas,
            parcelasJaPagas: jaPargas,
            parcelasPagas: 0,
            status: 'ativo',
            createdAt: now,
            updatedAt: now,
          };
          if (primeiroPagamento) novoParcelamento.primeiroPagamento = primeiroPagamento;
          const result = await collection.insertOne(novoParcelamento);
          return res.status(201).json({ _id: result.insertedId.toString(), ...novoParcelamento, parcelas: [] });
        }

        // Para fixo/price/sac: gera todos os títulos de uma vez
        if (numParcelas > 360) {
          return res.status(400).json({ message: 'numeroParcelas não pode ser maior que 360.' });
        }

        const primeiraParcelaNum = jaPargas + 1;
        const parcelasGeradas = gerarParcelas(valFinanciado, numParcelas, taxaJurosNum, sistemaAmortizacao, primeiroPagamento);
        const valorTotal = Math.round(parcelasGeradas.reduce((acc, p) => acc + p.valor, 0) * 100) / 100;

        const novoParcelamento = {
          tipo, descricao, categoriaId,
          ...camposOpcionais,
          valorFinanciado: valFinanciado,
          valorTotal,
          taxaJuros: taxaJurosNum,
          sistemaAmortizacao,
          numeroParcelas: numParcelas,
          parcelasJaPagas: jaPargas,
          parcelasPagas: 0,
          primeiroPagamento,
          status: 'ativo',
          createdAt: now,
          updatedAt: now,
        };

        const resultParcelamento = await collection.insertOne(novoParcelamento);
        const parcelamentoId = resultParcelamento.insertedId.toString();

        const titulosParaInserir = parcelasGeradas.map((p) => ({
          tipo,
          descricao: `${descricao} — ${primeiraParcelaNum + p.numeroParcela - 1}/${numParcelas}`,
          categoriaId,
          vencimento: p.vencimento,
          valorOriginal: p.valor,
          descontos: 0, juros: 0, multa: 0,
          valorLiquidado: 0,
          saldo: p.valor,
          status: calcularStatusTitulo(p.valor, p.vencimento),
          parcelamentoId,
          numeroParcela: primeiraParcelaNum + p.numeroParcela - 1,
          totalParcelas: numParcelas,
          ...camposOpcionais,
          createdAt: now,
          updatedAt: now,
        }));

        await db.collection('financeiro_titulos').insertMany(titulosParaInserir);

        return res.status(201).json({ _id: parcelamentoId, ...novoParcelamento, parcelas: parcelasGeradas });
      }

      // Adiciona uma parcela avulsa a um parcelamento variável (ou pré-calculado)
      if (type === 'addParcela') {
        const { id } = req.query;
        if (!id) return res.status(400).json({ message: 'id do parcelamento é obrigatório.' });

        const { valor, vencimento, numeroParcela, observacoes } = req.body;
        if (!valor || !vencimento) {
          return res.status(400).json({ message: 'Campos obrigatórios: valor, vencimento.' });
        }

        const parcelamento = await collection.findOne({ _id: new ObjectId(id as string) });
        if (!parcelamento) return res.status(404).json({ message: 'Parcelamento não encontrado.' });
        if (parcelamento.status === 'cancelado') {
          return res.status(400).json({ message: 'Não é possível adicionar parcelas a um parcelamento cancelado.' });
        }

        const now = new Date().toISOString();
        const numParcela = Number(numeroParcela) || parcelamento.parcelasJaPagas + parcelamento.parcelasPagas + 1;
        const totalParcelas = parcelamento.numeroParcelas || 0;

        const novoTitulo = {
          tipo: parcelamento.tipo,
          descricao: `${parcelamento.descricao} — ${numParcela}${totalParcelas > 0 ? `/${totalParcelas}` : ''}`,
          categoriaId: parcelamento.categoriaId,
          vencimento,
          valorOriginal: Number(valor),
          descontos: 0, juros: 0, multa: 0,
          valorLiquidado: 0,
          saldo: Number(valor),
          status: calcularStatusTitulo(Number(valor), vencimento),
          parcelamentoId: id as string,
          numeroParcela: numParcela,
          ...(totalParcelas > 0 && { totalParcelas }),
          ...(parcelamento.residenteId && { residenteId: parcelamento.residenteId }),
          ...(parcelamento.responsavelId && { responsavelId: parcelamento.responsavelId }),
          ...(parcelamento.fornecedorId && { fornecedorId: parcelamento.fornecedorId }),
          ...(parcelamento.funcionarioId && { funcionarioId: parcelamento.funcionarioId }),
          ...(parcelamento.contraparteId && { contraparteId: parcelamento.contraparteId }),
          ...(parcelamento.contaFinanceiraPrevistaId && { contaFinanceiraPrevistaId: parcelamento.contaFinanceiraPrevistaId }),
          ...(observacoes && { observacoes }),
          createdAt: now,
          updatedAt: now,
        };

        const result = await db.collection('financeiro_titulos').insertOne(novoTitulo);

        // Atualiza valorTotal do parcelamento variável
        if (parcelamento.sistemaAmortizacao === 'variavel') {
          const novoValorTotal = Math.round((parcelamento.valorTotal + Number(valor)) * 100) / 100;
          await collection.updateOne(
            { _id: new ObjectId(id as string) },
            { $set: { valorTotal: novoValorTotal, updatedAt: now } }
          );
        }

        return res.status(201).json({ _id: result.insertedId.toString(), ...novoTitulo });
      }

      return res.status(400).json({ message: 'POST: Nenhum query.type identificado.' });
    }

    case 'PUT': {
      const { type, id } = req.query;

      if (type === 'update' && id) {
        const { descricao, categoriaId, numeroParcelas, observacoes } = req.body;
        const update: Record<string, any> = { updatedAt: new Date().toISOString() };
        if (descricao !== undefined) update.descricao = descricao;
        if (categoriaId !== undefined) update.categoriaId = categoriaId;
        if (numeroParcelas !== undefined) update.numeroParcelas = Number(numeroParcelas);
        if (observacoes !== undefined) update.observacoes = observacoes;
        const result = await collection.updateOne({ _id: new ObjectId(id as string) }, { $set: update });
        if (result.matchedCount === 0) return res.status(404).json({ message: 'Parcelamento não encontrado.' });
        return res.status(200).json({ message: 'Parcelamento atualizado com sucesso.' });
      }

      if (type === 'cancelar' && id) {
        const parcelamento = await collection.findOne({ _id: new ObjectId(id as string) });
        if (!parcelamento) return res.status(404).json({ message: 'Parcelamento não encontrado.' });
        if (parcelamento.status === 'cancelado') {
          return res.status(400).json({ message: 'Parcelamento já está cancelado.' });
        }
        const now = new Date().toISOString();
        await collection.updateOne(
          { _id: new ObjectId(id as string) },
          { $set: { status: 'cancelado', updatedAt: now } }
        );
        await db.collection('financeiro_titulos').updateMany(
          { parcelamentoId: id as string, status: { $in: ['aberto', 'vencido', 'parcial'] } },
          { $set: { status: 'cancelado', updatedAt: now } }
        );
        return res.status(200).json({ message: 'Parcelamento cancelado com sucesso.' });
      }

      if (type === 'recalcularStatus' && id) {
        const parcelamento = await collection.findOne({ _id: new ObjectId(id as string) });
        if (!parcelamento) return res.status(404).json({ message: 'Parcelamento não encontrado.' });

        const parcelas = await db.collection('financeiro_titulos')
          .find({ parcelamentoId: id as string })
          .toArray();

        const pagasNoSistema = parcelas.filter((p: any) => p.status === 'liquidado').length;
        const totalPagas = pagasNoSistema + (parcelamento.parcelasJaPagas || 0);
        const numTotal = parcelamento.numeroParcelas || 0;
        const novoStatus = numTotal > 0 && totalPagas >= numTotal ? 'quitado' : 'ativo';
        const now = new Date().toISOString();

        await collection.updateOne(
          { _id: new ObjectId(id as string) },
          { $set: { parcelasPagas: pagasNoSistema, status: novoStatus, updatedAt: now } }
        );

        return res.status(200).json({ parcelasPagas: pagasNoSistema, totalPagas, status: novoStatus });
      }

      return res.status(400).json({ message: 'PUT: Nenhum query.type identificado.' });
    }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
