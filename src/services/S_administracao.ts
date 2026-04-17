import { Administracao, SlotAdministracao } from '@/models/administracao.model';

const BASE = '/api/Controller/administracao.controller';

export async function getSlotsDodia(data: string): Promise<SlotAdministracao[]> {
    const res = await fetch(`${BASE}?type=getByData&data=${data}`);
    if (!res.ok) throw new Error('Erro ao buscar slots do dia.');
    return res.json();
}

export async function registrarAdministracao(body: {
    prescricaoId: string;
    residenteId: string;
    funcionarioId: string;
    data: string;
    horarioPrevisto: string;
    status: Administracao['status'];
    horarioAdministrado?: string;
    observacao?: string;
}): Promise<void> {
    const res = await fetch(`${BASE}?type=registrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao registrar.');
    }
}

export async function updateStatusAdministracao(id: string, body: {
    status: Administracao['status'];
    horarioAdministrado?: string;
    observacao?: string;
}): Promise<void> {
    const res = await fetch(`${BASE}?type=updateStatus&id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao atualizar status.');
    }
}
