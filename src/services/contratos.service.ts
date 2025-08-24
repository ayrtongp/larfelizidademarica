import { Contrato } from '@/models/contratos.model';
import { PaginatedResult } from '@/models/insumos.model';

const baseUrl = `/api/Controller/Contratos.controller`;

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`API error ${response.status}: ${text}`);
    }
    return response.json();
}

// ############################
// GET METHODS
// ############################

/**
 * Retorna todos os contratos.
 */
export async function getAllContratos(): Promise<Contrato[]> {
    const res = await fetch(`${baseUrl}?type=getAll`);
    return handleResponse<Contrato[]>(res);
}

/**
 * Retorna contratos de um usuário específico.
 * @param usuarioId ID do usuário
 */
export async function getContratosByUser(usuarioId: string): Promise<Contrato[]> {
    const params = new URLSearchParams({ type: 'getByUser', usuario_id: usuarioId });
    const res = await fetch(`${baseUrl}?${params}`);
    return handleResponse<Contrato[]>(res);
}

/**
 * Retorna um contrato pelo seu ID.
 * @param id ID do contrato
 */
export async function getContratoById(id: string): Promise<Contrato> {
    const params = new URLSearchParams({ type: 'getID', id });
    const res = await fetch(`${baseUrl}?${params}`);
    return handleResponse<Contrato>(res);
}

/**
 * Retorna a contagem total de contratos.
 */
export async function getContratosCount(): Promise<number> {
    const res = await fetch(`${baseUrl}?type=countDocuments`);
    const json = await handleResponse<{ count: number }>(res);
    return json.count;
}

/**
 * Retorna contratos paginados.
 * @param page Página (inicia em 1)
 * @param pageSize Itens por página
 */
export async function getContratosPaginated(
    page: number = 1,
    pageSize: number = 10
): Promise<PaginatedResult<Contrato>> {
    const params = new URLSearchParams({
        type: 'pages',
        page: String(page),
        limit: String(pageSize),
    });
    const res = await fetch(`${baseUrl}?${params}`);
    return handleResponse<PaginatedResult<Contrato>>(res);
}

// ############################
// POST METHODS
// ############################

/**
 * Cria um novo contrato.
 * @param payload Dados do contrato, sem _id, createdAt e updatedAt
 */
export async function createContrato(
    payload: Omit<Contrato, '_id' | 'createdAt' | 'updatedAt' | 'numero_contrato'>
): Promise<string> {
    const params = new URLSearchParams({ type: 'new' });
    const res = await fetch(`${baseUrl}?${params}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const json = await handleResponse<{ id: string }>(res);
    return json.id;
}

// ############################
// PUT METHODS
// ############################

/**
 * Atualiza um contrato existente.
 * @param id ID do contrato
 * @param updates Campos a serem atualizados
 */
export async function updateContrato(
    id: string,
    updates: Partial<Contrato>
): Promise<void> {
    const params = new URLSearchParams({ type: 'update', id });
    const res = await fetch(`${baseUrl}?${params}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });
    await handleResponse<void>(res);
}

// ############################
// DELETE METHODS
// ############################

/**
 * Remove um contrato pelo ID.
 * @param id ID do contrato
 */
export async function deleteContrato(id: string): Promise<void> {
    const params = new URLSearchParams({ id });
    const res = await fetch(`${baseUrl}?${params}`, { method: 'DELETE' });
    await handleResponse<void>(res);
}
