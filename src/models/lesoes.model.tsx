// *********************************
// *********************************
// TYPES
// *********************************
// *********************************

export type Vista = 'frente' | 'costas' | 'lado-esquerdo' | 'lado-direito';

export type LesaoStatus = 'iniciada' | 'em_investigacao' | 'em_tratamento' | 'curada' | 'infectada' | 'encerrada' | 'cancelada';

export type TipoLesao =
    | 'fragilidade_capilar'
    | 'contusao'
    | 'escoriacao'
    | 'corte'
    | 'queimadura'
    | 'esmagamento'
    | 'luxacao'
    | 'leishmaniose_cutanea'
    | 'larva_migrans'
    | 'impetigo'
    | 'furunculo'
    | 'dermatite_atopica'
    | 'psoriase'
    | 'lupus'
    | 'melanoma'
    | 'carcinoma_basocelular'
    | 'carcinoma_espinocelular'
    | 'queratose_actinica'
    | 'hemangioma'
    | 'telangiectasia'
    | 'purpura'
    | 'penfigo_vulgar'
    | 'dermatite_herpetiforme'
    | 'acantose_nigricans'
    | 'hiperidrose';

// *********************************
// *********************************
// INTERFACES
// *********************************
// *********************************

export interface Comentario {
    userId: string;
    userName: string;
    content: string;
    createdAt: string;
}

export interface Lesao {
    _id?: string;
    userId: string;
    userName: string;

    descricao: string;
    regiaoCorpo: string;
    vista: Vista;
    dataLesao: string; // ou Date
    tipoLesao: string;
    status: LesaoStatus;
    riscoInfeccao: number; // 0 a 10
    nivelDor: number; // 0 a 10

    xPos: number;
    yPos: number;

    comentarios: Comentario[];

    createdAt: string; // ou Date
    updatedAt: string; // ou Date
}

// *********************************
// *********************************
// CONSTANTS
// *********************************
// *********************************

export const FERIDA_TYPE_OPTIONS: { label: string; value: TipoLesao }[] = [
    { label: 'Fragilidade Capilar', value: 'fragilidade_capilar' },
    { label: 'Contusão', value: 'contusao' },
    { label: 'Escoriação', value: 'escoriacao' },
    { label: 'Corte', value: 'corte' },
    { label: 'Queimadura', value: 'queimadura' },
    { label: 'Esmagamento', value: 'esmagamento' },
    { label: 'Luxação', value: 'luxacao' },
    { label: 'Leishmaniose Cutânea', value: 'leishmaniose_cutanea' },
    { label: 'Larva Migrans Cutânea', value: 'larva_migrans' },
    { label: 'Impetigo', value: 'impetigo' },
    { label: 'Furúnculo', value: 'furunculo' },
    { label: 'Dermatite Atópica', value: 'dermatite_atopica' },
    { label: 'Psoríase', value: 'psoriase' },
    { label: 'Lúpus Eritematoso', value: 'lupus' },
    { label: 'Melanoma', value: 'melanoma' },
    { label: 'Carcinoma Basocelular', value: 'carcinoma_basocelular' },
    { label: 'Carcinoma Espinocelular', value: 'carcinoma_espinocelular' },
    { label: 'Queratose Actínica', value: 'queratose_actinica' },
    { label: 'Hemangioma', value: 'hemangioma' },
    { label: 'Telangiectasia', value: 'telangiectasia' },
    { label: 'Púrpura', value: 'purpura' },
    { label: 'Pênfigo Vulgar', value: 'penfigo_vulgar' },
    { label: 'Dermatite Herpetiforme', value: 'dermatite_herpetiforme' },
    { label: 'Acantose Nigricans', value: 'acantose_nigricans' },
    { label: 'Hiperidrose', value: 'hiperidrose' },
];

export const VISTA_TYPE_OPTIONS = [
    { value: 'frente', label: 'Frente' },
    { value: 'costas', label: 'Costas' },
    { value: 'lado-esquerdo', label: 'Lado Esquerdo' },
    { value: 'lado-direito', label: 'Lado Direito' }
];

export const LESAO_STATUS_OPTIONS: { label: string; value: LesaoStatus }[] = [
    { label: 'Iniciada', value: 'iniciada' },
    { label: 'Em Investigação', value: 'em_investigacao' },
    { label: 'Em Tratamento', value: 'em_tratamento' },
    { label: 'Curada', value: 'curada' },
    { label: 'Infectada', value: 'infectada' },
    { label: 'Encerrada', value: 'encerrada' },
    { label: 'Cancelada', value: 'cancelada' }
];

// *********************************
// *********************************
// FUNCTIONS
// *********************************
// *********************************

export function validarLesao(lesao: Lesao): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    if (typeof lesao.userId !== 'string' || !lesao.userId.trim())
        erros.push('User ID inválido.');

    if (typeof lesao.descricao !== 'string' || !lesao.descricao.trim())
        erros.push('Descrição inválida.');

    if (typeof lesao.regiaoCorpo !== 'string' || !lesao.regiaoCorpo.trim())
        erros.push('Região do Corpo inválida.');

    if (typeof lesao.vista !== 'string' || !VISTA_TYPE_OPTIONS.some(opt => opt.value === lesao.vista))
        erros.push('Vista inválida. Deve ser um dos tipos pré-definidos.');

    if (isNaN(Date.parse(lesao.dataLesao)))
        erros.push('Data da Lesão inválida.');

    if (typeof lesao.tipoLesao !== 'string' || !FERIDA_TYPE_OPTIONS.some(opt => opt.value === lesao.tipoLesao))
        erros.push('Tipo de Lesão inválido. Deve ser um dos tipos pré-definidos.');


    if (typeof lesao.status !== 'string' || !LESAO_STATUS_OPTIONS.some(opt => opt.value === lesao.status))
        erros.push('Status inválido. Deve ser um dos tipos pré-definidos.');

    if (typeof lesao.riscoInfeccao !== 'number' || lesao.riscoInfeccao < 1 || lesao.riscoInfeccao > 10)
        erros.push('Risco de infecção deve ser entre 1 e 10.');

    if (typeof lesao.nivelDor !== 'number' || lesao.nivelDor < 1 || lesao.nivelDor > 10)
        erros.push('Nível de dor deve ser entre 1 e 10.');

    if (!Array.isArray(lesao.comentarios))
        erros.push('Comentários deve ser um array.');

    else {
        lesao.comentarios.forEach((c: Comentario, i: number) => {
            if (typeof c.userId !== 'string' || !c.userId.trim())
                erros.push(`comentario[${i}].autor inválido.`);
            if (typeof c.content !== 'string' || !c.content.trim())
                erros.push(`comentario[${i}].mensagem inválido.`);
            if (isNaN(Date.parse(c.createdAt)))
                erros.push(`comentario[${i}].data inválida.`);
        });
    }

    if (isNaN(Date.parse(lesao.createdAt)))
        erros.push('createdAt inválido.');

    if (isNaN(Date.parse(lesao.updatedAt)))
        erros.push('updatedAt inválido.');

    return {
        valido: erros.length === 0,
        erros,
    };
}

/**
 * Valida apenas a atualização de status de uma lesão.
 * @param status Novo status da lesão.
 * @returns { valido: boolean, erros: string[] }
 */
export function validarUpdateStatus(status: string): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    if (typeof status !== 'string' || !status.trim()) {
        erros.push('Status não informado.');
    } else if (!LESAO_STATUS_OPTIONS.some(opt => opt.value === status)) {
        erros.push('Status inválido. Deve ser um dos tipos pré-definidos.');
    }

    return {
        valido: erros.length === 0,
        erros,
    };
}