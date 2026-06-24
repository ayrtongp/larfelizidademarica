export type T_CategoriaCupom =
  | 'alimentacao'
  | 'limpeza'
  | 'higiene'
  | 'medicamentos'
  | 'manutencao'
  | 'descartaveis'
  | 'escritorio'
  | 'outros';

export const CATEGORIAS_CUPOM: { value: T_CategoriaCupom; label: string }[] = [
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'limpeza', label: 'Limpeza' },
  { value: 'higiene', label: 'Higiene' },
  { value: 'medicamentos', label: 'Medicamentos' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'descartaveis', label: 'Descartáveis' },
  { value: 'escritorio', label: 'Escritório' },
  { value: 'outros', label: 'Outros' },
];

export interface T_ItemCupom {
  localId: string;
  descricaoOriginal: string;
  descricaoNormalizada: string;
  quantidade: number;
  unidade: string;
  precoUnitario: number;
  precoTotal: number;
  categoria: T_CategoriaCupom;
  observacoes?: string;
}

export interface T_CupomFiscal {
  _id?: string;
  estabelecimento: {
    nome: string;
    cnpj?: string;
  };
  cupom: {
    dataCompra: string;
    horaCompra?: string;
    numeroCupom?: string;
    chaveAcesso?: string;
  };
  itens: T_ItemCupom[];
  totais: {
    subtotalCalculado: number;
    totalInformado: number;
    descontos: number;
    acrescimos: number;
    divergencia: number;
    formaPagamento?: string;
  };
  imagemRef?: {
    r2FileId: string;
    filename: string;
  };
  rawJsonAI?: string;
  rawTextAI?: string;
  criadoPor: string;
  criadoPorNome: string;
  createdAt?: string;
  updatedAt?: string;
}
