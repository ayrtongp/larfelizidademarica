import { Prescricao } from "@/models/prescricao.model";

const BASE_URL = '/api/Controller/prescricao.controller';

interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    erros?: string[];
}

// GET: Lista todas as prescrições
export async function getPrescricoes(): Promise<APIResponse<Prescricao[]>> {
    try {
        const res = await fetch(`${BASE_URL}?type=getAll`);
        const data = await res.json();
        if (!res.ok) throw data;
        return { success: true, data };
    } catch (error: any) {
        return { success: false, message: error.message || 'Erro ao buscar prescrições.' };
    }
}

// GET: Prescrição por ID
export async function getPrescricaoById(id: string): Promise<APIResponse<Prescricao>> {
    try {
        const res = await fetch(`${BASE_URL}?type=getById&id=${id}`);
        const data = await res.json();
        if (!res.ok) throw data;
        return { success: true, data };
    } catch (error: any) {
        return { success: false, message: error.message || 'Erro ao buscar prescrição.' };
    }
}

// GET: Prescrições por residente
export async function getPrescricoesByResidente(residenteId: string): Promise<APIResponse<Prescricao[]>> {
    try {
        const res = await fetch(`${BASE_URL}?type=getByResidente&residenteId=${residenteId}`);
        const data = await res.json();
        if (!res.ok) throw data;
        return { success: true, data };
    } catch (error: any) {
        return { success: false, message: error.message || 'Erro ao buscar prescrições do residente.' };
    }
}

// POST: Criar nova prescrição
export async function createPrescricao(novaPrescricao: Prescricao): Promise<APIResponse<{ insertedId: string }>> {
    try {
        const res = await fetch(`${BASE_URL}?type=postPrescricao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaPrescricao),
        });

        const data = await res.json();
        if (!res.ok) throw data;

        return { success: true, data: { insertedId: data.insertedId } };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Erro ao criar prescrição.',
            erros: error.erros || [],
        };
    }
}

// PUT: Atualizar prescrição inteira
export async function updatePrescricao(id: string, updates: Partial<Prescricao>): Promise<APIResponse> {
    try {
        const res = await fetch(`${BASE_URL}?type=updatePrescricao&id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });

        const data = await res.json();
        if (!res.ok) throw data;
        return { success: true, data };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Erro ao atualizar prescrição.',
            erros: error.erros || [],
        };
    }
}

// PUT: Atualizar apenas o status
export async function updateStatusPrescricao(id: string, status: string): Promise<APIResponse> {
    try {
        const res = await fetch(`${BASE_URL}?type=updateStatus&id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });

        const data = await res.json();
        if (!res.ok) throw data;
        return { success: true, data };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Erro ao atualizar status da prescrição.',
            erros: error.erros || [],
        };
    }
}

// DELETE: Remover prescrição
export async function deletePrescricao(id: string): Promise<APIResponse> {
    try {
        const res = await fetch(`${BASE_URL}?type=deletePrescricao&id=${id}`, {
            method: 'DELETE',
        });

        const data = await res.json();
        if (!res.ok) throw data;
        return { success: true, data };
    } catch (error: any) {
        return { success: false, message: error.message || 'Erro ao deletar prescrição.' };
    }
}
