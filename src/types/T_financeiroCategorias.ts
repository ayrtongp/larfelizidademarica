export interface T_Categoria {
  _id?: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  categoriaPaiId?: string | null;
  cor?: string;
  icone?: string;
  ordem?: number;
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
}
