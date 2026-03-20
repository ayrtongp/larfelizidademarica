export type TipoMovimento = 'entrada' | 'saida' | 'transferencia' | 'ajuste';
export type FormaPagamento = 'pix' | 'dinheiro' | 'transferencia' | 'boleto' | 'cartao' | 'cheque' | 'outro';
export type OrigemMovimentacao = 'manual' | 'baixa_titulo' | 'sistema' | 'importacao';

export interface T_Movimentacao {
  _id?: string;
  tipoMovimento: TipoMovimento;
  contaFinanceiraId: string;
  contaDestinoId?: string;
  dataMovimento: string;
  competencia?: string; // YYYY-MM — mês de referência, default = mês de dataMovimento
  valor: number;
  historico: string;
  descricaoOriginal?: string;
  formaPagamento?: FormaPagamento;
  numeroDocumento?: string;
  origem: OrigemMovimentacao;
  tituloIds?: string[];
  categoriaId?: string;
  emprestimoId?: string;
  comprovanteUrl?: string;
  observacoes?: string;
  vinculadoId?: string;
  vinculadoTipo?: 'usuario' | 'residente';
  temRateio: boolean;
  createdAt?: string;
  updatedAt?: string;
}
