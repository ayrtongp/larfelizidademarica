export interface T_Lancamento {
  descricao: string;
  valor: number;
}

export interface T_FolhaPagamentoItem {
  funcionarioId: string;
  funcionarioNome: string;
  cargo: string;
  proventos: T_Lancamento[];    // tudo que entra
  descontos: T_Lancamento[];    // tudo que sai
  totalProventos: number;       // calculado
  totalDescontos: number;       // calculado
  salarioLiquido: number;       // totalProventos - totalDescontos
  observacao?: string;
}

export interface T_FolhaPagamento {
  _id?: string;
  periodo: { mes: number; ano: number };
  itens: T_FolhaPagamentoItem[];
  totalBruto: number;
  totalDescontos: number;
  totalLiquido: number;
  cloudURL?: string;
  filename?: string;
  cloudFilename?: string;
  size?: string;
  format?: string;
  descricao?: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}
