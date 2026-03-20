import { T_Movimentacao } from '@/types/T_financeiroMovimentacoes';
import { T_Rateio } from '@/types/T_financeiroRateios';

const baseUrl = '/api/Controller/C_financeiroMovimentacoes';

export interface FiltrosMovimentacao {
  contaFinanceiraId?: string;
  tipoMovimento?: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface DadosTransferencia {
  contaFinanceiraId: string;
  contaDestinoId: string;
  dataMovimento: string;
  valor: number;
  historico: string;
  observacoes?: string;
}

const S_financeiroMovimentacoes = {
  getAll: async (filtros?: FiltrosMovimentacao): Promise<T_Movimentacao[]> => {
    const params = new URLSearchParams({ type: 'getAll' });
    if (filtros?.contaFinanceiraId) params.append('contaFinanceiraId', filtros.contaFinanceiraId);
    if (filtros?.tipoMovimento) params.append('tipoMovimento', filtros.tipoMovimento);
    if (filtros?.dataInicio) params.append('dataInicio', filtros.dataInicio);
    if (filtros?.dataFim) params.append('dataFim', filtros.dataFim);

    const res = await fetch(`${baseUrl}?${params.toString()}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Erro ao buscar movimentações: ${text}`);
    }
    return res.json();
  },

  getById: async (id: string): Promise<T_Movimentacao> => {
    const params = new URLSearchParams({ type: 'getById', id });
    const res = await fetch(`${baseUrl}?${params.toString()}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Erro ao buscar movimentação: ${text}`);
    }
    return res.json();
  },

  getRateiosByMovimentacaoId: async (id: string): Promise<T_Rateio[]> => {
    const params = new URLSearchParams({ type: 'getRateios', id });
    const res = await fetch(`${baseUrl}?${params.toString()}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Erro ao buscar rateios: ${text}`);
    }
    return res.json();
  },

  create: async (data: Partial<T_Movimentacao> & { rateios?: any[] }): Promise<{ id: string }> => {
    const params = new URLSearchParams({ type: 'new' });
    const res = await fetch(`${baseUrl}?${params.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Erro ao criar movimentação: ${text}`);
    }
    return res.json();
  },

  createTransferencia: async (data: DadosTransferencia): Promise<{ idSaida: string; idEntrada: string }> => {
    const params = new URLSearchParams({ type: 'transferencia' });
    const res = await fetch(`${baseUrl}?${params.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Erro ao criar transferência: ${text}`);
    }
    return res.json();
  },

  update: async (id: string, data: Partial<T_Movimentacao>): Promise<void> => {
    const params = new URLSearchParams({ type: 'update', id });
    const res = await fetch(`${baseUrl}?${params.toString()}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Erro ao atualizar movimentação: ${text}`);
    }
  },
};

export default S_financeiroMovimentacoes;
