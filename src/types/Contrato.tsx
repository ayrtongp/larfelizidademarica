export interface Contrato {
    _id?: string;
    residenteId: string;
    numero: number;
    ano: number;
    tipo_contrato: string;
    regime_pagamento: string;
    dia_pagamento: number;
    data_inicio: string;
    data_termino?: string | null;
    vigencia: number;
    tipoVigencia: string;
    valor_mensalidade: number;
    ativo: boolean;
    createdAt?: string;
    updatedAt?: string;
}