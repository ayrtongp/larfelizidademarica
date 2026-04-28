import { T_Categoria } from '@/types/T_financeiroCategorias';

const baseUrl = '/api/Controller/C_financeiroCategorias';

const S_financeiroCategorias = {
  getAll: async (): Promise<T_Categoria[]> => {
    const res = await fetch(`${baseUrl}?type=getAll`);
    return res.json();
  },

  getById: async (id: string): Promise<T_Categoria> => {
    const res = await fetch(`${baseUrl}?type=getById&id=${id}`);
    return res.json();
  },

  createNew: async (payload: Omit<T_Categoria, '_id' | 'createdAt' | 'updatedAt'>): Promise<{ id: string; message: string }> => {
    const res = await fetch(`${baseUrl}?type=new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Erro ao criar categoria.');
    }
    return res.json();
  },

  update: async (id: string, payload: Partial<T_Categoria>): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=update&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Erro ao atualizar categoria.');
    }
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

export default S_financeiroCategorias;
