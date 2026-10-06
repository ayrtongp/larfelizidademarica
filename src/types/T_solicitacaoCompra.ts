export type StatusSolicitacaoCompra =
  | 'pendente'
  | 'em_analise'
  | 'aprovada'
  | 'recusada'
  | 'comprada'
  | 'cancelada';

export type PrioridadeSolicitacaoCompra = 'normal' | 'urgente';

export interface T_ItemSolicitacaoCompra {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  observacao?: string;
}

export interface T_SolicitacaoCompra {
  _id?: string;
  numero?: number;
  solicitanteId: string;
  solicitanteNome: string;
  status: StatusSolicitacaoCompra;
  prioridade: PrioridadeSolicitacaoCompra;
  necessarioAte?: string | null;
  itens: T_ItemSolicitacaoCompra[];
  comentarioSolicitante?: string;
  comentarioCompras?: string;
  criadoEm?: string;
  atualizadoEm?: string;
  createdAt?: string;
  updatedAt?: string;
}


