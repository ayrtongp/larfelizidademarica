export type T_CategoriaEstoque =
  | 'alimentacao'
  | 'limpeza'
  | 'higiene'
  | 'medicamentos'
  | 'manutencao'
  | 'descartaveis'
  | 'escritorio'
  | 'outros';

export const CATEGORIAS_ESTOQUE: { value: T_CategoriaEstoque; label: string }[] = [
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'limpeza', label: 'Limpeza' },
  { value: 'higiene', label: 'Higiene' },
  { value: 'medicamentos', label: 'Medicamentos' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'descartaveis', label: 'Descartáveis' },
  { value: 'escritorio', label: 'Escritório' },
  { value: 'outros', label: 'Outros' },
];

export interface T_ItemEstoque {
  _id?: string;
  nome: string;
  quantidade: number;
  locais: Record<string, number>;
  unidade: string;
  categoria: T_CategoriaEstoque;
  estoqueMinimo: number;
  observacoes?: string;
  criadoPor?: string;
  criadoPorNome?: string;
  createdAt?: string;
  updatedAt?: string;
}
