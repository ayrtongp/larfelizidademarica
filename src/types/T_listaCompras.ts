export type TipoLista = 'mercado' | 'sacolao';
export type StatusLista = 'rascunho' | 'finalizada' | 'comprada';
export type UnidadeItem = 'kg' | 'g' | 'un' | 'l' | 'cx' | 'dz' | 'maco' | 'pct';
export type CategoriaItem =
  | 'hortifruti'
  | 'proteinas'
  | 'laticinios'
  | 'graos'
  | 'higiene'
  | 'limpeza'
  | 'outros';

export interface T_ItemLista {
  _id: string;
  nome: string;
  quantidade: number;
  unidade: UnidadeItem;
  categoria?: CategoriaItem;
  observacao?: string;
  comprado: boolean;
  precoEstimado?: number;
}

export interface T_ListaCompras {
  _id?: string;
  tipo: TipoLista;
  titulo: string;
  data: string; // YYYY-MM-DD — data prevista da compra
  status: StatusLista;
  observacoes?: string;
  itens: T_ItemLista[];
  criadoPor: string;
  criadoPorNome: string;
  baseadaEm?: string; // _id da lista de origem, se duplicada
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export const UNIDADES_ITEM: { value: UnidadeItem; label: string }[] = [
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'un', label: 'Unidade' },
  { value: 'l', label: 'Litro' },
  { value: 'cx', label: 'Caixa' },
  { value: 'dz', label: 'Dúzia' },
  { value: 'maco', label: 'Maço' },
  { value: 'pct', label: 'Pacote' },
];

export const CATEGORIAS_ITEM: { value: CategoriaItem; label: string }[] = [
  { value: 'hortifruti', label: 'Hortifruti' },
  { value: 'proteinas', label: 'Proteínas' },
  { value: 'laticinios', label: 'Laticínios' },
  { value: 'graos', label: 'Grãos e Cereais' },
  { value: 'higiene', label: 'Higiene' },
  { value: 'limpeza', label: 'Limpeza' },
  { value: 'outros', label: 'Outros' },
];

export const STATUS_LISTA_CONFIG: Record<StatusLista, { label: string; className: string }> = {
  rascunho: { label: 'Rascunho', className: 'bg-yellow-100 text-yellow-800' },
  finalizada: { label: 'Finalizada', className: 'bg-blue-100 text-blue-800' },
  comprada: { label: 'Comprada', className: 'bg-green-100 text-green-800' },
};

export const TIPO_LISTA_CONFIG: Record<TipoLista, { label: string; className: string; emoji: string }> = {
  mercado: { label: 'Mercado', className: 'bg-indigo-100 text-indigo-800', emoji: '🛒' },
  sacolao: { label: 'Sacolão', className: 'bg-emerald-100 text-emerald-800', emoji: '🥬' },
};
