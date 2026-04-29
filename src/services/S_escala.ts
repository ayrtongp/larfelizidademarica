import { T_Equipe } from '@/types/T_escala';

const BASE = '/api/Controller/C_escala';

const S_escala = {
  async getAll(): Promise<T_Equipe[]> {
    const r = await fetch(`${BASE}?type=getAll`);
    if (!r.ok) throw new Error('Erro ao buscar equipes.');
    return r.json();
  },

  async getById(id: string): Promise<T_Equipe> {
    const r = await fetch(`${BASE}?type=getById&id=${id}`);
    if (!r.ok) throw new Error('Equipe não encontrada.');
    return r.json();
  },

  async criar(data: Omit<T_Equipe, '_id' | 'createdAt' | 'updatedAt'>): Promise<{ _id: string }> {
    const r = await fetch(`${BASE}?type=new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!r.ok) {
      const e = await r.json();
      throw new Error(e.message ?? 'Erro ao criar equipe.');
    }
    return r.json();
  },

  async atualizar(
    id: string,
    data: Pick<T_Equipe, 'nome' | 'descricao' | 'cor' | 'regra'>
  ): Promise<void> {
    const r = await fetch(`${BASE}?type=update&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!r.ok) {
      const e = await r.json();
      throw new Error(e.message ?? 'Erro ao atualizar equipe.');
    }
  },

  async atualizarMembros(id: string, membros: T_Equipe['membros']): Promise<void> {
    const r = await fetch(`${BASE}?type=updateMembros&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ membros }),
    });
    if (!r.ok) {
      const e = await r.json();
      throw new Error(e.message ?? 'Erro ao atualizar membros.');
    }
  },

  async toggleAtivo(id: string): Promise<void> {
    const r = await fetch(`${BASE}?type=toggleAtivo&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!r.ok) {
      const e = await r.json();
      throw new Error(e.message ?? 'Erro ao alternar status.');
    }
  },
};

export default S_escala;
