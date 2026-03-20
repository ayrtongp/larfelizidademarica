export type ModeloImportacao = 'inter_pj' | '';

export interface T_ContaFinanceira {
  _id?: string;
  nome: string;
  tipo: 'banco' | 'caixa' | 'aplicacao';
  banco?: string;
  saldoInicial: number;
  ativo: boolean;
  modeloImportacao?: ModeloImportacao;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
}
