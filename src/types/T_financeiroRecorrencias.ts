export interface T_Recorrencia {
  _id?: string;
  tipo: 'pagar' | 'receber';
  descricaoPadrao: string;
  categoriaId: string;
  contraparteId?: string;
  residenteId?: string;
  responsavelId?: string;
  valorPadrao: number;
  diaVencimento: number; // 1-28
  frequencia: 'mensal';
  dataInicio: string;
  dataFim?: string;
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
}
