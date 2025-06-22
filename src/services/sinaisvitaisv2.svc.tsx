import { SinalVitalV2 } from "@/models/sinaisvitaisv2.model";

const BASE_URL = '/api/Controller/SinaisVitaisV2.ctrl';

interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    erro?: string;
}

// GET: Lista todos os sinais vitais
export async function getSinaisVitais(): Promise<APIResponse<SinalVitalV2[]>> {
    try {
        const res = await fetch(`${BASE_URL}?type=getAll`);
        if (!res.ok) throw new Error('Erro ao buscar sinais vitais');
        const data = await res.json();
        return { success: true, data };
    } catch (error) {
        return { success: false, message: 'Erro ao buscar sinais vitais.' };
    }
}

// GET: Lista sinais vitais paginados
export async function getSinaisVitaisPages(page = 1, pageSize = 10): Promise<APIResponse<{ total: number; page: number; pageSize: number; sinais: SinalVitalV2[] }>> {
    try {
        const res = await fetch(`${BASE_URL}?type=getPages&page=${page}&pageSize=${pageSize}`);
        if (!res.ok) throw new Error('Erro ao buscar sinais vitais paginados');
        const data = await res.json();
        return { success: true, data };
    } catch (error) {
        return { success: false, message: 'Erro ao buscar sinais vitais paginados.' };
    }
}

// GET: Busca um sinal vital por ID
export async function getSinalVitalById(id: string): Promise<APIResponse<SinalVitalV2>> {
    try {
        const res = await fetch(`${BASE_URL}?type=getById&id=${id}`);
        const data = await res.json();

        if (!res.ok) {
            return { success: false, message: data.message || 'Erro ao buscar sinal vital.' };
        }

        return { success: true, data };
    } catch (error) {
        return { success: false, message: 'Erro ao buscar sinal vital.' };
    }
}

// POST: Cria um novo sinal vital
export async function createSinalVital(novoSinal: SinalVitalV2): Promise<APIResponse<{ insertedId: string }>> {
    try {
        const res = await fetch(`${BASE_URL}?type=insert`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(novoSinal),
        });

        const data = await res.json();

        if (!res.ok) {
            return {
                success: false,
                message: data.message || 'Erro ao criar sinal vital.',
                erro: data.erro || '',
            };
        }

        return { success: true, data: { insertedId: data.insertedId } };
    } catch (error) {
        return { success: false, message: 'Erro ao conectar com o servidor.' };
    }
}

// PUT: Atualiza um sinal vital existente
export async function updateSinalVital(id: string, updates: Partial<SinalVitalV2>): Promise<APIResponse> {
    try {
        const res = await fetch(`${BASE_URL}?type=update&id=${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
        });

        const data = await res.json();

        if (!res.ok) {
            return {
                success: false,
                message: data.message || 'Erro ao atualizar sinal vital.',
                erro: data.erro || '',
            };
        }

        return { success: true, data };
    } catch (error) {
        return { success: false, message: 'Erro ao atualizar sinal vital.' };
    }
}

// DELETE: Remove um sinal vital
export async function deleteSinalVital(id: string): Promise<APIResponse> {
    try {
        const res = await fetch(`${BASE_URL}?id=${id}`, {
            method: 'DELETE',
        });

        const data = await res.json();

        if (!res.ok) {
            return {
                success: false,
                message: data.message || 'Erro ao deletar sinal vital.',
            };
        }

        return { success: true, data };
    } catch (error) {
        return { success: false, message: 'Erro ao deletar sinal vital.' };
    }
}