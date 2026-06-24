import { T_CupomFiscal } from '@/types/T_cupomFiscal';

const BASE = '/api/Controller/C_cupomFiscal';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro desconhecido.' }));
    throw new Error(err.message || 'Erro na requisição.');
  }
  return res.json();
}

const S_cupomFiscal = {
  getAll: async (filtros?: { from?: string; to?: string }): Promise<T_CupomFiscal[]> => {
    const params = new URLSearchParams({ type: 'getAll' });
    if (filtros?.from) params.set('from', filtros.from);
    if (filtros?.to) params.set('to', filtros.to);
    const res = await fetch(`${BASE}?${params}`);
    return handleResponse(res);
  },

  getById: async (id: string): Promise<T_CupomFiscal> => {
    const res = await fetch(`${BASE}?type=getById&id=${id}`);
    return handleResponse(res);
  },

  criar: async (payload: Omit<T_CupomFiscal, '_id' | 'createdAt' | 'updatedAt'>): Promise<{ id: string }> => {
    const res = await fetch(`${BASE}?type=criar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  update: async (id: string, data: Partial<T_CupomFiscal>): Promise<void> => {
    const res = await fetch(`${BASE}?type=update&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await handleResponse(res);
  },

  excluir: async (id: string, realizadoPor: string): Promise<void> => {
    const res = await fetch(`${BASE}?type=excluir&id=${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ realizadoPor }),
    });
    await handleResponse(res);
  },
};

export default S_cupomFiscal;
