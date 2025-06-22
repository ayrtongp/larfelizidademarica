import { Lesao } from "@/models/lesoes.model";

const BASE_URL = '/api/Controller/Lesoes';

interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    erros?: string[];
}

// GET: Lista todas as lesões
export async function getLesoes(): Promise<APIResponse<Lesao[]>> {
    try {
        const res = await fetch(`${BASE_URL}?type=getAll`);
        if (!res.ok) throw new Error('Erro ao buscar lesões');
        const data = await res.json();
        return { success: true, data };
    } catch (error) {
        return { success: false, message: 'Erro ao buscar lesões.' };
    }
}

// GET: Busca uma lesão por ID
export async function getLesaoById(id: string): Promise<APIResponse<Lesao>> {
    try {
        const res = await fetch(`${BASE_URL}/${id}`);
        const data = await res.json();

        if (!res.ok) {
            return { success: false, message: data.message || 'Erro ao buscar lesão.' };
        }

        return { success: true, data };
    } catch (error) {
        return { success: false, message: 'Erro ao buscar lesão.' };
    }
}

// POST: Cria uma nova lesão
export async function createLesao(novaLesao: Lesao): Promise<APIResponse<{ insertedId: string }>> {
    try {
        const res = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(novaLesao),
        });

        const data = await res.json();

        if (!res.ok) {
            return {
                success: false,
                message: data.message || 'Erro ao criar lesão.',
                erros: data.erros || [],
            };
        }

        return { success: true, data: { insertedId: data.insertedId } };
    } catch (error) {
        return { success: false, message: 'Erro ao conectar com o servidor.' };
    }
}

// PUT: Atualiza uma lesão existente
export async function updateLesao(id: string, updates: Partial<Lesao>): Promise<APIResponse> {
    try {
        const res = await fetch(`${BASE_URL}?id=${id}&type=updateLesao`, {
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
                message: data.message || 'Erro ao atualizar lesão.',
                erros: data.erros || [],
            };
        }

        return { success: true, data };
    } catch (error) {
        return { success: false, message: 'Erro ao atualizar lesão.' };
    }
}

// DELETE: Remove uma lesão
export async function deleteLesao(id: string): Promise<APIResponse> {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: 'DELETE',
        });

        const data = await res.json();

        if (!res.ok) {
            return {
                success: false,
                message: data.message || 'Erro ao deletar lesão.',
            };
        }

        return { success: true, data };
    } catch (error) {
        return { success: false, message: 'Erro ao deletar lesão.' };
    }
}
