export interface T_Rateio {
  _id?: string;
  movimentacaoId: string;
  categoriaId: string;
  subcategoriaId?: string;
  residenteId?: string;
  responsavelId?: string;
  contraparteId?: string;
  tituloId?: string;
  descricao: string;
  valor: number;
  createdAt?: string;
  updatedAt?: string;
}
