import { T_Parcelamento, T_SimulacaoParcela } from '@/types/T_financeiroParcelamentos';
import { T_TituloFinanceiro } from '@/types/T_financeiroTitulos';

const baseUrl = '/api/Controller/C_financeiroParcelamentos';

export interface T_ParcelamentoComParcelas extends T_Parcelamento {
  parcelas: T_TituloFinanceiro[];
}

export interface T_SimulacaoResult {
  parcelas: T_SimulacaoParcela[];
  valorTotal: number;
}

export interface T_AddParcelaPayload {
  valor: number;
  vencimento: string;
  numeroParcela?: number;
  observacoes?: string;
}

export type T_NovoParcelamento = Omit<T_Parcelamento, '_id' | 'valorTotal' | 'parcelasPagas' | 'status' | 'createdAt' | 'updatedAt'>;

const S_financeiroParcelamentos = {
  getAll: async (filtros?: { tipo?: string; status?: string }): Promise<T_Parcelamento[]> => {
    const params = new URLSearchParams({ type: 'getAll' });
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    if (filtros?.status) params.append('status', filtros.status);
    const res = await fetch(`${baseUrl}?${params.toString()}`);
    if (!res.ok) throw new Error('Erro ao buscar parcelamentos');
    return res.json();
  },

  getById: async (id: string): Promise<T_ParcelamentoComParcelas> => {
    const res = await fetch(`${baseUrl}?type=getById&id=${id}`);
    if (!res.ok) throw new Error('Erro ao buscar parcelamento');
    return res.json();
  },

  getParcelas: async (id: string): Promise<T_TituloFinanceiro[]> => {
    const res = await fetch(`${baseUrl}?type=getParcelas&id=${id}`);
    if (!res.ok) throw new Error('Erro ao buscar parcelas');
    return res.json();
  },

  simular: async (dados: {
    valorFinanciado: number;
    numeroParcelas: number;
    taxaJuros?: number;
    sistemaAmortizacao: string;
    primeiroPagamento: string;
  }): Promise<T_SimulacaoResult> => {
    const res = await fetch(`${baseUrl}?type=simular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    if (!res.ok) throw new Error('Erro ao simular parcelamento');
    return res.json();
  },

  create: async (data: T_NovoParcelamento): Promise<T_ParcelamentoComParcelas> => {
    const res = await fetch(`${baseUrl}?type=new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Erro ao criar parcelamento');
    }
    return res.json();
  },

  addParcela: async (id: string, data: T_AddParcelaPayload): Promise<T_TituloFinanceiro> => {
    const res = await fetch(`${baseUrl}?type=addParcela&id=${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Erro ao adicionar parcela');
    }
    return res.json();
  },

  update: async (id: string, data: { descricao?: string; categoriaId?: string; numeroParcelas?: number; observacoes?: string }): Promise<void> => {
    const res = await fetch(`${baseUrl}?type=update&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erro ao atualizar parcelamento');
  },

  cancelar: async (id: string): Promise<void> => {
    const res = await fetch(`${baseUrl}?type=cancelar&id=${id}`, {
      method: 'PUT',
    });
    if (!res.ok) throw new Error('Erro ao cancelar parcelamento');
  },

  recalcularStatus: async (id: string): Promise<{ parcelasPagas: number; totalPagas: number; status: string }> => {
    const res = await fetch(`${baseUrl}?type=recalcularStatus&id=${id}`, {
      method: 'PUT',
    });
    if (!res.ok) throw new Error('Erro ao recalcular status do parcelamento');
    return res.json();
  },
};

export default S_financeiroParcelamentos;
