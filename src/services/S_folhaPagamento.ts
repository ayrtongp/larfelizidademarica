import { T_FolhaPagamento } from '@/types/T_folhaPagamento';

const BASE = '/api/Controller/C_folhaPagamento';

const S_folhaPagamento = {
  async getAll(): Promise<Omit<T_FolhaPagamento, 'itens'>[]> {
    const res = await fetch(`${BASE}?type=getAll`);
    if (!res.ok) throw new Error('Erro ao buscar folhas');
    return res.json();
  },

  async getById(id: string): Promise<T_FolhaPagamento> {
    const res = await fetch(`${BASE}?type=getById&id=${id}`);
    if (!res.ok) throw new Error('Erro ao buscar folha');
    return res.json();
  },

  async criar(data: Omit<T_FolhaPagamento, '_id' | 'totalBruto' | 'totalDescontos' | 'totalLiquido' | 'createdAt' | 'updatedAt'>): Promise<T_FolhaPagamento> {
    const res = await fetch(`${BASE}?type=new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.status === 409) throw new Error('Já existe folha para este período');
    if (!res.ok) throw new Error('Erro ao criar folha');
    return res.json();
  },

  async atualizar(id: string, itens: T_FolhaPagamento['itens']): Promise<void> {
    const res = await fetch(`${BASE}?type=update&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itens }),
    });
    if (!res.ok) throw new Error('Erro ao atualizar folha');
  },

  async anexarArquivo(id: string, arquivo: { cloudURL: string; filename: string; cloudFilename: string; size: string; format: string; descricao?: string }): Promise<void> {
    const res = await fetch(`${BASE}?type=anexarArquivo&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(arquivo),
    });
    if (!res.ok) throw new Error('Erro ao anexar arquivo');
  },

  async remover(id: string): Promise<void> {
    const res = await fetch(`${BASE}?type=delete&id=${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao remover folha');
  },
};

export default S_folhaPagamento;
