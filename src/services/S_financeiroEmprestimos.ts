import { T_Emprestimo, T_DevolucaoEmprestimo } from '@/types/T_financeiroEmprestimos';

const BASE = '/api/Controller/C_financeiroEmprestimos';

export const S_financeiroEmprestimos = {
  async getAll(filtros?: { tipo?: string; status?: string }): Promise<T_Emprestimo[]> {
    const params = new URLSearchParams({ type: 'getAll' });
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    if (filtros?.status) params.append('status', filtros.status);
    const res = await fetch(`${BASE}?${params.toString()}`);
    if (!res.ok) throw new Error('Erro ao buscar empréstimos.');
    return res.json();
  },

  async getById(id: string): Promise<T_Emprestimo> {
    const res = await fetch(`${BASE}?type=getById&id=${id}`);
    if (!res.ok) throw new Error('Erro ao buscar empréstimo.');
    return res.json();
  },

  async getDevolucoesByEmprestimoId(id: string): Promise<T_DevolucaoEmprestimo[]> {
    const res = await fetch(`${BASE}?type=getDevolucoes&id=${id}`);
    if (!res.ok) throw new Error('Erro ao buscar devoluções.');
    return res.json();
  },

  async create(data: Partial<T_Emprestimo> & { contaFinanceiraId?: string }): Promise<T_Emprestimo> {
    const res = await fetch(`${BASE}?type=new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erro ao criar empréstimo.');
    return res.json();
  },

  async devolver(id: string, data: { valor: number; dataDevolucao: string; contaFinanceiraId: string; formaPagamento?: string; observacoes?: string }): Promise<T_Emprestimo> {
    const res = await fetch(`${BASE}?type=devolver&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erro ao registrar devolução.');
    return res.json();
  },

  async cancelar(id: string): Promise<void> {
    const res = await fetch(`${BASE}?type=cancelar&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Erro ao cancelar empréstimo.');
  },
};
