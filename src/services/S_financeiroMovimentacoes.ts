import { T_Movimentacao } from '@/types/T_financeiroMovimentacoes';
import { T_Rateio } from '@/types/T_financeiroRateios';

const baseUrl = '/api/Controller/C_financeiroMovimentacoes';

export interface GetAllParams {
  conditions?: { field: string; operator: string; value: string; value2?: string }[];
  logic?: 'and' | 'or';
  skip?: number;
  limit?: number;
}

export interface GetAllResult {
  items: T_Movimentacao[];
  total: number;
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
  getAll: async (p?: GetAllParams): Promise<GetAllResult> => {
    const params = new URLSearchParams({ type: 'getAll' });
    const active = (p?.conditions ?? []).filter(c =>
      c.operator === 'empty' || c.operator === 'notempty' || c.value !== '',
    );
    if (active.length)     params.append('conditions', JSON.stringify(active));
    if (p?.logic)          params.append('logic', p.logic);
    if (p?.skip  != null)  params.append('skip',  String(p.skip));
    if (p?.limit != null)  params.append('limit', String(p.limit));

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

  updateMany: async (
    ids: string[],
    update: { categoriaId?: string | null; vinculadoId?: string | null; vinculadoTipo?: string | null },
  ): Promise<void> => {
    const params = new URLSearchParams({ type: 'updateMany' });
    const res = await fetch(`${baseUrl}?${params.toString()}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, update }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Erro ao atualizar movimentações: ${text}`);
    }
  },
};

export default S_financeiroMovimentacoes;
