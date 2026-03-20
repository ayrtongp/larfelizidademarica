export type TituloStatus = 'aberto' | 'parcial' | 'liquidado' | 'vencido' | 'cancelado';

export interface T_TituloFinanceiro {
  _id?: string;
  tipo: 'receber' | 'pagar';
  descricao: string;
  categoriaId: string;
  residenteId?: string;
  responsavelId?: string;
  fornecedorId?: string;
  funcionarioId?: string;
  contraparteId?: string;
  contaFinanceiraPrevistaId?: string;
  competencia?: string;
  vencimento: string;
  valorOriginal: number;
  descontos: number;
  juros: number;
  multa: number;
  valorLiquidado: number;
  saldo: number;
  status: TituloStatus;
  recorrenciaId?: string;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface T_BaixaTitulo {
  _id?: string;
  tituloId: string;
  valor: number;
  dataBaixa: string;
  contaFinanceiraId: string;
  formaPagamento?: string;
  observacoes?: string;
  createdAt?: string;
}
