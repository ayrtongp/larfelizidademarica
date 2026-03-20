export interface T_Contraparte {
  _id?: string;
  nome: string;
  tipo: 'cliente' | 'fornecedor' | 'funcionario' | 'outro';
  cpfCnpj?: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
}
