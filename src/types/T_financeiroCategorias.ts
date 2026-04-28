export interface T_Categoria {
  _id?: string;
  nome: string;
  tipo: 'receita' | 'despesa' | 'transferencia' | 'sistema';
  categoriaPaiId?: string | null;
  cor?: string;
  icone?: string;
  ordem?: number;
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
}
