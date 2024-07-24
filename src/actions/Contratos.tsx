import { Contrato } from "@/types/Contrato";
import { notifyError } from "@/utils/Functions";

const dbName = 'Contratos'

// ####################################
// ####################################
// GET METHODS
// ####################################
// ####################################

export async function Contratos_GET_getAll() {
    const type = 'getAll'
    const url = `/api/Controller/${dbName}?type=${type}`

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(`Erro na requisição - ${type}`);
        }
        else {
            return data;
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        throw new Error(`Catch Error: ${error}`);
    }
}

export async function Contratos_GET_getID(id: string) {
    const type = 'getID'
    const url = `/api/Controller/${dbName}?type=${type}&id=${id}`

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro na requisição - ${type}`);
        }
        else {
            const data = await response.json();
            return data;
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        throw new Error(`Catch Error: ${error}`);
    }
}

// ####################################
// ####################################
// POST METHODS
// ####################################
// ####################################

export async function Contratos_POST_create(data: Contrato) {
    const type = 'create'

    const body: Contrato = {
        data_inicio: data.data_inicio,
        dia_pagamento: data.dia_pagamento,
        numero: data.numero,
        regime_pagamento: data.regime_pagamento,
        residenteId: data.residenteId,
        tipo_contrato: data.tipo_contrato,
        valor_mensalidade: data.valor_mensalidade,
        vigencia: data.vigencia,
        tipoVigencia: data.tipoVigencia,

        ano: 0,
        ativo: true,
    }

    try {
        const response = await fetch(`/api/Controller/${dbName}?type=${type}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify(body), // Convert data to JSON string
        });
        const data = await response.json();
        if (!response.ok) {
            notifyError(data.message)
            return data
        }
        else {
            return data;
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        throw new Error(`Catch Error: ${error}`);
    }
}