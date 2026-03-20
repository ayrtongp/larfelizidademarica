import { T_TituloFinanceiro, T_BaixaTitulo } from '@/types/T_financeiroTitulos';

const baseUrl = '/api/Controller/C_financeiroTitulos';

const S_financeiroTitulos = {
  getAll: async (filtros?: { tipo?: string; status?: string }): Promise<T_TituloFinanceiro[]> => {
    const params = new URLSearchParams({ type: 'getAll' });
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    if (filtros?.status) params.append('status', filtros.status);
    const res = await fetch(`${baseUrl}?${params.toString()}`);
    if (!res.ok) throw new Error('Erro ao buscar títulos');
    return res.json();
  },

  getById: async (id: string): Promise<T_TituloFinanceiro> => {
    const res = await fetch(`${baseUrl}?type=getById&id=${id}`);
    if (!res.ok) throw new Error('Erro ao buscar título');
    return res.json();
  },

  create: async (data: Omit<T_TituloFinanceiro, '_id' | 'valorLiquidado' | 'saldo' | 'status' | 'createdAt' | 'updatedAt'>): Promise<{ id: string }> => {
    const res = await fetch(`${baseUrl}?type=new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erro ao criar título');
    return res.json();
  },

  update: async (id: string, data: Partial<T_TituloFinanceiro>): Promise<void> => {
    const res = await fetch(`${baseUrl}?type=update&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erro ao atualizar título');
  },

  baixar: async (id: string, baixaData: Omit<T_BaixaTitulo, '_id' | 'tituloId' | 'createdAt'>): Promise<T_TituloFinanceiro> => {
    const res = await fetch(`${baseUrl}?type=baixa&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(baixaData),
    });
    if (!res.ok) throw new Error('Erro ao registrar baixa');
    return res.json();
  },

  cancelar: async (id: string): Promise<void> => {
    const res = await fetch(`${baseUrl}?type=cancelar&id=${id}`, {
      method: 'PUT',
    });
    if (!res.ok) throw new Error('Erro ao cancelar título');
  },

  getBaixasByTituloId: async (id: string): Promise<T_BaixaTitulo[]> => {
    const res = await fetch(`${baseUrl}?type=getBaixas&id=${id}`);
    if (!res.ok) throw new Error('Erro ao buscar baixas');
    return res.json();
  },
};

export default S_financeiroTitulos;
