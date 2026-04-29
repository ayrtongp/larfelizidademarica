export type TipoExcecao = 'falta' | 'extra' | 'troca';

export interface T_EscalaExcecao {
  _id?: string;
  equipeId: string;
  equipeNome: string;
  funcionarioId: string;
  nome: string;
  data: string; // YYYY-MM-DD
  tipo: TipoExcecao;
  observacao?: string;
  createdAt?: string;
}
