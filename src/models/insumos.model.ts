export interface Insumo {
    _id: string;
    nome_insumo: string;
    unidade_base: string;         // menor unidade dispensável (comprimido, ml, g, unidade…)
    unidade_entrada?: string;     // embalagem de compra (cx, frasco, pct, ampola…)
    fator_conversao?: number;     // quantas unidade_base por unidade_entrada — default 1
    estoque_minimo?: number;      // alerta de reposição — 0 = sem alerta
    cod_categoria: string;
    descricao: string;
    createdAt: string;
    updatedAt: string;
}

export interface InsumoWithInventory extends Insumo {
    totalQuantidade: number;
}

export interface PaginatedResult<T> {
    page: number;
    pageSize: number;
    total: number;
    data: T[];
}

export const UNIDADE_BASE_OPTIONS = [
    'comprimido', 'cápsula', 'drágea', 'ml', 'L', 'g', 'mg', 'kg', 'unidade', 'ampola',
] as const;

export const UNIDADE_ENTRADA_OPTIONS = [
    'cx', 'frasco', 'pct', 'ampola', 'saco', 'envelope', 'bisnaga', 'un',
] as const;

export const CATEGORIA_OPTIONS = [
    { label: 'Medicamentos',        value: 'medicamentos' },
    { label: 'Materiais de Consumo', value: 'materiais_consumo' },
    { label: 'Equipamentos',        value: 'equipamentos' },
] as const;

export type CategoriaOption = typeof CATEGORIA_OPTIONS[number]['value'];
