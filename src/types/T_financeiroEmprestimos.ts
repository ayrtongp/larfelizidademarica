export type StatusEmprestimo = 'aberto' | 'parcial' | 'quitado' | 'cancelado';
export type TipoEmprestimo = 'concedido' | 'recebido';

export type Contraparte_tipo = 'usuario' | 'residente';

export interface T_Emprestimo {
  _id?: string;
  tipo: TipoEmprestimo;
  contraparte_tipo?: Contraparte_tipo;
  contraparteId?: string;
  contraparteNome?: string;
  descricao: string;
  valorOriginal: number;
  valorEmAberto: number;
  dataEmprestimo: string;
  vencimento?: string;
  status: StatusEmprestimo;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface T_DevolucaoEmprestimo {
  _id?: string;
  emprestimoId: string;
  valor: number;
  dataDevolucao: string;
  contaFinanceiraId: string;
  formaPagamento?: string;
  observacoes?: string;
  createdAt?: string;
}
