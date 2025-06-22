// *********************************
// *********************************
// TYPES
// *********************************
// *********************************

export type TipoSinalVital =
    | "pressao_arterial"
    | "temperatura"
    | "frequencia_cardiaca"
    | "frequencia_respiratoria"
    | "saturacao_oxigenio"
    | "glicemia"
    ;
// *********************************
// *********************************
// INTERFACES
// *********************************
// *********************************

export interface SinalVitalV2 {
    _id?: string;
    idosoId: string;
    userId: string;

    tipo: TipoSinalVital;
    valor: string;
    dataHora: string; // ou Date
    observacao?: string;
    foraLimite?: boolean;

    createdAt: string; // ou Date
    updatedAt: string; // ou Date
}

// *********************************
// *********************************
// CONSTANTS
// *********************************
// *********************************

export const SINAL_VITAL_OPTIONS = [
    {
        label: "Pressão Arterial",
        value: "pressao_arterial",
        pattern: /^\d{2,3}\/\d{2,3}$/,
        title: "Formato requerido exemplo: 127/97",
        maxLength: 7,
        placeholder: "Pa mmHg",
    },
    {
        label: "Temperatura",
        value: "temperatura",
        pattern: /^\d{2}\.\d$/,
        title: "Fora do padrão. Exemplo: '36.0'. 2 números, ponto, 1 número",
        maxLength: 4,
        placeholder: "TAX ºC",
    },
    {
        label: "Frequência Cardíaca",
        value: "frequencia_cardiaca",
        pattern: /^\d+$/,
        title: "Apenas números são aceitos.",
        maxLength: 3,
        placeholder: "FC bpm",
    },
    {
        label: "Frequência Respiratória",
        value: "frequencia_respiratoria",
        pattern: /^\d+$/,
        title: "Apenas números são aceitos.",
        maxLength: 3,
        placeholder: "FR irpm",
    },
    {
        label: "Saturação de Oxigênio",
        value: "saturacao_oxigenio",
        pattern: /^\d+$/,
        title: "Apenas números são aceitos.",
        maxLength: 3,
        placeholder: "SPO2 %",
    },
    {
        label: "Glicemia",
        value: "glicemia",
        pattern: /^\d+$/,
        title: "Apenas números são aceitos. '0' = Não se Aplica",
        maxLength: 3,
        placeholder: "HGT",
    },
];


// *********************************
// *********************************
// FUNCTIONS
// *********************************
// *********************************

export function validarSinalVital(tipo: string, valor: string) {
    const option = SINAL_VITAL_OPTIONS.find(opt => opt.value === tipo);
    if (!option) {
        return { valido: false, erro: "Tipo de sinal vital inválido." };
    }
    if (!option.pattern.test(valor)) {
        return { valido: false, erro: option.title };
    }
    return { valido: true };
}