import { Comunicado } from "@/types/Comunicado";
import { notifyError } from "@/utils/Functions";

const dbName = 'Comunicados'

// ####################################
// ####################################
// GET METHODS
// ####################################
// ####################################

export async function Comunicados_GET_getAll() {
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

export async function Comunicados_GET_getID(id: string) {
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

export async function Comunicados_GET_countNaoLidosPeloUsuario(id: string) {
    const type = 'countNaoLidosPeloUsuario'
    const url = `/api/Controller/${dbName}?type=${type}&userId=${id}`

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

export async function Comunicados_POST_create(data: Comunicado) {
    const type = 'create'

    const body: Comunicado = {
        title: data.title,
        description: data.description,
        creatorName: data.creatorName,
        createdBy: data.createdBy,
        _id: '',
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

// ####################################
// ####################################
// PUT METHODS
// ####################################
// ####################################

export async function Comunicados_PUT_confirmarLeitura(data: any) {
    const type = 'confirmarLeitura'

    const body = {
        comunicadoId: data.comunicadoId,
        userId: data.userId,
    }

    try {
        const response = await fetch(`/api/Controller/${dbName}?type=${type}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', },
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