// *********************************
// TYPES
// *********************************

export type ViaAdministracao =
    | 'oral'
    | 'sublingual'
    | 'topica'
    | 'retal'
    | 'vaginal'
    | 'intravenosa'
    | 'intramuscular'
    | 'subcutanea'
    | 'inalatoria'
    | 'nasal'
    | 'ocular'
    | 'otica';

export type StatusPrescricao = 'aguardando' | 'ativa' | 'finalizada' | 'cancelada';

// *********************************
// INTERFACES
// *********************************

export interface Prescricao {
    _id?: string;

    residenteId: string;
    medicoId: string;

    medicamento: string;
    via: ViaAdministracao;
    usoSOS: boolean;
    horarios?: string[]; // opcional se usoSOS === true

    observacoes?: string;

    status: StatusPrescricao;

    dataInicio: string;
    dataFim?: string;

    createdAt: string;
    updatedAt: string;
}

// *********************************
// OPTIONS
// *********************************

export const VIA_ADMINISTRACAO_OPTIONS = [
    { label: 'Oral', value: 'oral' },
    { label: 'Sublingual', value: 'sublingual' },
    { label: 'Tópica', value: 'topica' },
    { label: 'Retal', value: 'retal' },
    { label: 'Vaginal', value: 'vaginal' },
    { label: 'Intravenosa', value: 'intravenosa' },
    { label: 'Intramuscular', value: 'intramuscular' },
    { label: 'Subcutânea', value: 'subcutanea' },
    { label: 'Inalatória', value: 'inalatoria' },
    { label: 'Nasal', value: 'nasal' },
    { label: 'Ocular', value: 'ocular' },
    { label: 'Ótica', value: 'otica' },
];

export const STATUS_PRESCRICAO_OPTIONS: { label: string; value: StatusPrescricao }[] = [
    { label: 'Aguardando início', value: 'aguardando' },
    { label: 'Ativa', value: 'ativa' },
    { label: 'Finalizada', value: 'finalizada' },
    { label: 'Cancelada', value: 'cancelada' },
];

// *********************************
// VALIDAÇÃO
// *********************************

export function validarPrescricao(p: Prescricao): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    if (!p.residenteId?.trim()) erros.push('ID do residente é obrigatório.');
    if (!p.medicoId?.trim()) erros.push('ID do médico é obrigatório.');
    if (!p.medicamento?.trim()) erros.push('Nome do medicamento é obrigatório.');

    if (!VIA_ADMINISTRACAO_OPTIONS.find(v => v.value === p.via)) erros.push('Via de administração inválida.');
    if (!STATUS_PRESCRICAO_OPTIONS.find(s => s.value === p.status)) erros.push('Status inválido.');

    if (typeof p.usoSOS !== 'boolean') erros.push('usoSOS deve ser verdadeiro ou falso.');

    if (!p.usoSOS) {
        if (!Array.isArray(p.horarios) || p.horarios.length === 0) {
            erros.push('Horários devem ser informados para medicamentos regulares.');
        } else {
            p.horarios.forEach((h, i) => {
                if (!/^\d{2}:\d{2}$/.test(h)) erros.push(`Horário inválido no índice ${i}: ${h}`);
            });
        }
    }

    if (isNaN(Date.parse(p.dataInicio))) erros.push('Data de início inválida.');
    if (p.dataFim && isNaN(Date.parse(p.dataFim))) erros.push('Data de fim inválida.');
    if (isNaN(Date.parse(p.createdAt))) erros.push('createdAt inválido.');
    if (isNaN(Date.parse(p.updatedAt))) erros.push('updatedAt inválido.');

    return { valido: erros.length === 0, erros };
}
