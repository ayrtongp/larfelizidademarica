import { Usuario } from "@/types/Usuario";
import { notifyError } from "@/utils/Functions";

const dbName = 'Usuario'

// ####################################
// ####################################
// GET METHODS
// ####################################
// ####################################

export async function Usuario_getDadosPerfil(userId: string) {
    const type = 'getDadosPerfil';
    const params = new URLSearchParams({ type, _id: userId });
    const url = `/api/Controller/${dbName}?${params.toString()}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro na requisição - ${type}: ${errorText}`);
        }

        const data = await response.json();
        return data;
    } catch (error: any) {
        console.error('Error fetching data:', error);
        throw new Error(`Catch Error: ${error.message || error}`);
    }
}

// ####################################
// ####################################
// POST METHODS
// ####################################
// ####################################
