/**
 * Model definitions for Insumos
 */

/**
 * Interface representando um Insumo básico conforme a collection 'insumos'
 */
export interface Insumo {
    _id: string;             // ObjectId vindo como string via JSON
    nome_insumo: string;
    unidade: string;
    cod_categoria: string;
    descricao: string;
    createdAt: string;       // formato: YYYY-MM-DD HH:mm:ss
    updatedAt: string;       // formato: YYYY-MM-DD HH:mm:ss
}

/**
 * Extensão de Insumo adicionando o total de quantidade em estoque
 */
export interface InsumoWithInventory extends Insumo {
    totalQuantidade: number;
}

/**
 * Resultado paginado padrão para APIs que retornam dados com paginação
 */
export interface PaginatedResult<T> {
    page: number;             // página atual
    pageSize: number;         // itens por página
    total: number;            // total de registros disponíveis
    data: T[];                // array de dados
}

/**
 * Opções possíveis para o campo cod_categoria (exemplos)
 * Ajuste ou expanda conforme necessidade do seu domínio.
 */
export const CATEGORIA_OPTIONS = [
    { label: 'Medicamentos', value: 'medicamentos' },
    { label: 'Materiais de Consumo', value: 'materiais_consumo' },
    { label: 'Equipamentos', value: 'equipamentos' },
] as const;

export type CategoriaOption = typeof CATEGORIA_OPTIONS[number]['value'];
