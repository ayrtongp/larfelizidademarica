import { T_Recorrencia } from '@/types/T_financeiroRecorrencias';

const BASE = '/api/Controller/C_financeiroRecorrencias';

export const S_financeiroRecorrencias = {
  async getAll(filtros?: { tipo?: string; ativo?: boolean }): Promise<T_Recorrencia[]> {
    const params = new URLSearchParams({ type: 'getAll' });
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    if (filtros?.ativo !== undefined) params.append('ativo', String(filtros.ativo));
    const res = await fetch(`${BASE}?${params.toString()}`);
    if (!res.ok) throw new Error('Erro ao buscar recorrências.');
    return res.json();
  },

  async getById(id: string): Promise<T_Recorrencia> {
    const res = await fetch(`${BASE}?type=getById&id=${id}`);
    if (!res.ok) throw new Error('Erro ao buscar recorrência.');
    return res.json();
  },

  async create(data: Partial<T_Recorrencia>): Promise<T_Recorrencia> {
    const res = await fetch(`${BASE}?type=new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erro ao criar recorrência.');
    return res.json();
  },

  async update(id: string, data: Partial<T_Recorrencia>): Promise<T_Recorrencia> {
    const res = await fetch(`${BASE}?type=update&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erro ao atualizar recorrência.');
    return res.json();
  },

  async toggleAtivo(id: string): Promise<void> {
    const res = await fetch(`${BASE}?type=toggleAtivo&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Erro ao alternar ativo.');
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${BASE}?type=delete&id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Erro ao excluir recorrência.');
  },
};
