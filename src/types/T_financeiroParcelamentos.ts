export type StatusParcelamento = 'ativo' | 'quitado' | 'cancelado';
// 'variavel': valores não são pré-calculados — cada parcela é inserida manualmente
export type SistemaAmortizacao = 'fixo' | 'price' | 'sac' | 'variavel';

export interface T_Parcelamento {
  _id?: string;
  tipo: 'pagar' | 'receber';
  descricao: string;
  categoriaId: string;
  residenteId?: string;
  responsavelId?: string;
  fornecedorId?: string;
  funcionarioId?: string;
  contraparteId?: string;
  contaFinanceiraPrevistaId?: string;

  valorFinanciado: number;
  valorTotal: number;
  taxaJuros: number;
  sistemaAmortizacao: SistemaAmortizacao;

  // Para 'variavel', numeroParcelas pode ser 0 (total desconhecido) ou o total acordado
  numeroParcelas: number;
  // Parcelas pagas ANTES de entrar no sistema (para parcelamentos em andamento)
  parcelasJaPagas: number;
  // Parcelas liquidadas no sistema (calculado automaticamente)
  parcelasPagas: number;

  primeiroPagamento?: string;

  status: StatusParcelamento;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface T_SimulacaoParcela {
  numeroParcela: number;
  vencimento: string;
  valor: number;
  juros: number;
  amortizacao: number;
  saldoDevedor: number;
}
