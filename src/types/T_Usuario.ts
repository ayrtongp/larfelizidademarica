export interface T_Usuario {
  _id?: string;
  nome: string;
  sobrenome: string;
  cpf?: string;
  dataNascimento?: string;
  telefone?: string;
  usuario: string;
  email?: string;
  funcao?: string;
  funcoes?: string[];  // múltiplas áreas de atuação
  registro?: string;
  senha?: string;
  ativo: 'S' | 'N';
  admin: 'S' | 'N';
  foto_base64?: string;
  foto_cdn?: string;
  createdAt?: number;
  updatedAt?: number;
}
