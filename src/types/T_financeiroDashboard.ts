export interface T_DashboardResumo {
  saldoTotal: number;
  totalAReceberMes: number;
  totalAPagarMes: number;
  totalRecebidoMes: number;
  totalPagoMes: number;
  inadimplenciaMes: number;
  resultadoMes: number;
}

export interface T_SaldoConta {
  _id: string;
  nome: string;
  tipo: 'banco' | 'caixa' | 'aplicacao';
  banco?: string;
  saldoInicial: number;
  saldoAtual: number;
}

export interface T_EvolucaoMensal {
  mes: string; // YYYY-MM
  entradas: number;
  saidas: number;
}

export interface T_TituloVencimento {
  _id: string;
  descricao: string;
  tipo: string;
  vencimento: string;
  valorOriginal: number;
  saldo: number;
  status: string;
}
