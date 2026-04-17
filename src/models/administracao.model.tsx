export type StatusAdministracao =
    | 'administrado'
    | 'nao_administrado'
    | 'recusado'
    | 'pendente';

export interface Administracao {
    _id?: string;
    prescricaoId: string;
    residenteId: string;
    funcionarioId: string;
    data: string;              // YYYY-MM-DD
    horarioPrevisto: string;   // HH:mm
    horarioAdministrado?: string; // HH:mm — preenchido quando status = 'administrado'
    status: StatusAdministracao;
    observacao?: string;
    createdAt?: string;
    updatedAt?: string;
}

// Slot montado no frontend: prescrição + registro (se existir)
export interface SlotAdministracao {
    prescricaoId: string;
    residenteId: string;
    nomeResidente: string;
    medicamento: string;
    via: string;
    horarioPrevisto: string;
    usoSOS: boolean;
    registro?: Administracao; // undefined = ainda não registrado
}

export const STATUS_ADMINISTRACAO_OPTIONS: { label: string; value: StatusAdministracao }[] = [
    { label: 'Administrado no horário', value: 'administrado' },
    { label: 'Administrado em outro horário', value: 'administrado' },
    { label: 'Não administrado', value: 'nao_administrado' },
    { label: 'Recusado pelo idoso', value: 'recusado' },
];
