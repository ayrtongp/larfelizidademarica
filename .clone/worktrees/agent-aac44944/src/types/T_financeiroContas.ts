export interface T_ContaFinanceira {
  _id?: string;
  nome: string;
  tipo: 'banco' | 'caixa' | 'aplicacao';
  banco?: string;
  saldoInicial: number;
  ativo: boolean;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
}
