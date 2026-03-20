import { T_ContaFinanceira } from '@/types/T_financeiroContas';

const baseUrl = '/api/Controller/C_financeiroContas';

const S_financeiroContas = {
  getAll: async (): Promise<T_ContaFinanceira[]> => {
    const res = await fetch(`${baseUrl}?type=getAll`);
    return res.json();
  },

  getAtivas: async (): Promise<T_ContaFinanceira[]> => {
    const res = await fetch(`${baseUrl}?type=getAtivas`);
    return res.json();
  },

  getById: async (id: string): Promise<T_ContaFinanceira> => {
    const res = await fetch(`${baseUrl}?type=getById&id=${id}`);
    return res.json();
  },

  createNew: async (payload: Omit<T_ContaFinanceira, '_id' | 'createdAt' | 'updatedAt'>): Promise<{ id: string; message: string }> => {
    const res = await fetch(`${baseUrl}?type=new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  update: async (id: string, payload: Partial<T_ContaFinanceira>): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=update&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  toggleAtivo: async (id: string): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=toggleAtivo&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },
};

export default S_financeiroContas;
