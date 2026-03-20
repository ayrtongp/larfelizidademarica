const BASE = '/api/Controller/C_financeiroRelatorios';

export interface FluxoCaixaLinha {
  data: string;
  entradas: number;
  saidas: number;
  saldo_dia: number;
}

export interface FluxoCaixaResult {
  linhas: FluxoCaixaLinha[];
  totalEntradas: number;
  totalSaidas: number;
  resultado: number;
}

export interface CategoriaRelatorio {
  categoriaId: string;
  nome: string;
  total: number;
}

export interface InadimplenciaResult {
  titulos: any[];
  total: number;
}

export const S_financeiroRelatorios = {
  async getFluxoCaixa(params: { dataInicio: string; dataFim: string; contaFinanceiraId?: string }): Promise<FluxoCaixaResult> {
    const qs = new URLSearchParams({ type: 'fluxoCaixa', dataInicio: params.dataInicio, dataFim: params.dataFim });
    if (params.contaFinanceiraId) qs.append('contaFinanceiraId', params.contaFinanceiraId);
    const res = await fetch(`${BASE}?${qs.toString()}`);
    if (!res.ok) throw new Error('Erro ao buscar fluxo de caixa.');
    return res.json();
  },

  async getReceitasPorCategoria(params: { dataInicio: string; dataFim: string }): Promise<{ categorias: CategoriaRelatorio[] }> {
    const qs = new URLSearchParams({ type: 'receitasPorCategoria', dataInicio: params.dataInicio, dataFim: params.dataFim });
    const res = await fetch(`${BASE}?${qs.toString()}`);
    if (!res.ok) throw new Error('Erro ao buscar receitas por categoria.');
    return res.json();
  },

  async getDespesasPorCategoria(params: { dataInicio: string; dataFim: string }): Promise<{ categorias: CategoriaRelatorio[] }> {
    const qs = new URLSearchParams({ type: 'despesasPorCategoria', dataInicio: params.dataInicio, dataFim: params.dataFim });
    const res = await fetch(`${BASE}?${qs.toString()}`);
    if (!res.ok) throw new Error('Erro ao buscar despesas por categoria.');
    return res.json();
  },

  async getInadimplencia(params?: { mes?: number; ano?: number }): Promise<InadimplenciaResult> {
    const qs = new URLSearchParams({ type: 'inadimplencia' });
    if (params?.mes) qs.append('mes', String(params.mes));
    if (params?.ano) qs.append('ano', String(params.ano));
    const res = await fetch(`${BASE}?${qs.toString()}`);
    if (!res.ok) throw new Error('Erro ao buscar inadimplência.');
    return res.json();
  },
};
