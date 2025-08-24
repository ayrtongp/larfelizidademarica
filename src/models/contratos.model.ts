/**
 * Model definitions for Contratos
 */

import { ObjectId } from "mongodb";

/**
 * Interface representando um Contrato na collection 'contratos'
 */
export interface Contrato {
    _id: ObjectId;                  // ObjectId vindo como string via JSON
    usuario_id: string;           // ObjectId do usuário associado
    numero_contrato: string;      // Número ou código do contrato
    data_assinatura: string;      // Data de assinatura do contrato (YYYY-MM-DD)
    data_inicio: string;          // Data de início do contrato (YYYY-MM-DD)
    data_fim?: string;            // Data de término do contrato (YYYY-MM-DD), opcional
    dia_pagamento: number;       // Dia de pagamento do contrato (1-31)
    valor: number;                // Valor total do contrato
    tipo: ContratoType;           // Tipo de contrato
    status: ContratoStatus;       // Status atual do contrato
    regime_pagamento: ContratoRegime; // Regime de pagamento: pré-pago ou pós-pago
    periodicidade: ContratoPeriodicidade; // Forma de medição: diária, mensal ou anual
    papel: ContratoPapel;         // Indica se somos contratante ou contratada
    observacoes?: string;         // Observações adicionais
    createdAt: string;            // Data de criação (YYYY-MM-DD HH:mm:ss)
    updatedAt: string;            // Data de atualização (YYYY-MM-DD HH:mm:ss)
}

/**
 * Status possíveis para um Contrato
 */
export const CONTRATO_STATUS_OPTIONS = [
    { label: 'Ativo', value: 'ativo' },
    { label: 'Encerrado', value: 'encerrado' },
    { label: 'Cancelado', value: 'cancelado' }
] as const;
export type ContratoStatus = typeof CONTRATO_STATUS_OPTIONS[number]['value'];

/**
 * Tipos de contrato disponíveis
 */
export const CONTRATO_TYPE_OPTIONS = [
    { label: 'Serviço', value: 'servico' },
    { label: 'Hotelaria', value: 'hotelaria' },
    { label: 'Residência Fixa', value: 'residencia_fixa' },
    { label: 'Residência Temporária', value: 'residencia_temporaria' },
    { label: 'Centro Dia', value: 'centro_dia' }
] as const;
export type ContratoType = typeof CONTRATO_TYPE_OPTIONS[number]['value'];

/**
 * Regime de pagamento do contrato: pré-pago ou pós-pago
 */
export const CONTRATO_REGIME_OPTIONS = [
    { label: 'Pré-pago', value: 'pre_pago' },
    { label: 'Pós-pago', value: 'pos_pago' }
] as const;
export type ContratoRegime = typeof CONTRATO_REGIME_OPTIONS[number]['value'];

/**
 * Periodicidade de medição do contrato
 */
export const CONTRATO_PERIODICIDADE_OPTIONS = [
    { label: 'Diária', value: 'diaria' },
    { label: 'Mensal', value: 'mensal' },
    { label: 'Anual', value: 'anual' }
] as const;
export type ContratoPeriodicidade = typeof CONTRATO_PERIODICIDADE_OPTIONS[number]['value'];

/**
 * Papel da nossa instituição no contrato: contratante ou contratada
 */
export const CONTRATO_PAPEL_OPTIONS = [
    { label: 'Contratante', value: 'contratante' },
    { label: 'Contratada', value: 'contratada' }
] as const;
export type ContratoPapel = typeof CONTRATO_PAPEL_OPTIONS[number]['value'];
