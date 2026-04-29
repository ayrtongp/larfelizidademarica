import { T_EscalaExcecao } from '@/types/T_escalaExcecao';

const BASE = '/api/Controller/C_escalaExcecoes';

const S_escalaExcecoes = {
  async getByRange(inicio: string, fim: string, equipeId?: string): Promise<T_EscalaExcecao[]> {
    const params = new URLSearchParams({ type: 'getByRange', inicio, fim });
    if (equipeId) params.append('equipeId', equipeId);
    const r = await fetch(`${BASE}?${params}`);
    if (!r.ok) throw new Error('Erro ao buscar exceções.');
    return r.json();
  },

  async salvar(data: Omit<T_EscalaExcecao, '_id' | 'createdAt'>): Promise<{ _id: string }> {
    const r = await fetch(`${BASE}?type=new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!r.ok) {
      const e = await r.json();
      throw new Error(e.message ?? 'Erro ao salvar exceção.');
    }
    return r.json();
  },

  async remover(id: string): Promise<void> {
    const r = await fetch(`${BASE}?id=${id}`, { method: 'DELETE' });
    if (!r.ok) throw new Error('Erro ao remover exceção.');
  },
};

export default S_escalaExcecoes;
