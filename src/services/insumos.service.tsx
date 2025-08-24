import { Insumo, InsumoWithInventory, PaginatedResult } from "@/models/insumos.model";

const dbName = 'Insumos';
const baseUrl = `/api/Controller/${dbName}`;

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`API ${response.url} error: ${response.status} ${text}`);
    }
    return response.json();
}

// ####################################
// GET METHODS
// ####################################

/** Busca todos os insumos sem paginação. */
export async function getAllInsumos(): Promise<Insumo[]> {
    const res = await fetch(`${baseUrl}?type=getAll`);
    return handleResponse<Insumo[]>(res);
}

/**
 * Retorna insumos paginados com o total de estoque de cada um.
 * @param page Número da página (inicia em 1).
 * @param pageSize Quantidade de itens por página.
 */
export async function getInsumosWithInventory(
    page: number = 1,
    pageSize: number = 10
): Promise<PaginatedResult<InsumoWithInventory>> {
    const query = new URLSearchParams({
        type: 'getPagesWithInventory',
        page: String(page),
        limit: String(pageSize)
    });

    const res = await fetch(`${baseUrl}?${query.toString()}`);
    return handleResponse<PaginatedResult<InsumoWithInventory>>(res);
}

/**
 * Exemplo de uso:
 * const { page, pageSize, total, data } = await getInsumosWithInventory(2, 10);
 */
