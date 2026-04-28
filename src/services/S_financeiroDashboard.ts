import { T_DashboardResumo, T_TituloVencimento, T_SaldoConta, T_EvolucaoMensal } from '@/types/T_financeiroDashboard';

const BASE = '/api/Controller/C_financeiroDashboard';

export const S_financeiroDashboard = {
  async getResumo(mes?: number, ano?: number): Promise<T_DashboardResumo> {
    const params = new URLSearchParams({ type: 'resumo' });
    if (mes) params.append('mes', String(mes));
    if (ano) params.append('ano', String(ano));
    const res = await fetch(`${BASE}?${params.toString()}`);
    if (!res.ok) throw new Error('Erro ao buscar resumo do dashboard.');
    return res.json();
  },

  async getProximosVencimentos(): Promise<T_TituloVencimento[]> {
    const res = await fetch(`${BASE}?type=proximosVencimentos`);
    if (!res.ok) throw new Error('Erro ao buscar próximos vencimentos.');
    return res.json();
  },

  async getVencidos(): Promise<T_TituloVencimento[]> {
    const res = await fetch(`${BASE}?type=vencidos`);
    if (!res.ok) throw new Error('Erro ao buscar títulos vencidos.');
    return res.json();
  },

  async getSaldoContas(): Promise<T_SaldoConta[]> {
    const res = await fetch(`${BASE}?type=saldoContas`);
    if (!res.ok) throw new Error('Erro ao buscar saldo das contas.');
    return res.json();
  },

  async getEvolucaoMensal(meses = 6): Promise<T_EvolucaoMensal[]> {
    const res = await fetch(`${BASE}?type=evolucaoMensal&meses=${meses}`);
    if (!res.ok) throw new Error('Erro ao buscar evolução mensal.');
    return res.json();
  },

  async getSaldoNaData(data: string): Promise<{ data: string; contas: (T_SaldoConta & { saldoNaData: number })[]; totalGeral: number }> {
    const res = await fetch(`${BASE}?type=saldoNaData&data=${encodeURIComponent(data)}`);
    if (!res.ok) throw new Error('Erro ao buscar saldo na data.');
    return res.json();
  },
};
