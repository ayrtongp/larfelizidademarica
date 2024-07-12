import { I_Arquivo } from "@/types/Arquivos";
import { InfoProps } from "@/types/Arquivos_InfoProps";

const dbName = 'Arquivos'

export async function Arquivos_POST_novoArquivo(info: InfoProps, data: I_Arquivo) {
    const type = 'novoArquivo'

    const body: I_Arquivo = {
        dbName: info.dbName,
        descricao: info.descricao,
        cloudURL: data.cloudURL,
        filename: data.filename,
        cloudFilename: data.cloudFilename,
        size: data.size,
        format: data.format,
        fullName: data.fullName,
    }
    info.residenteId ? body.residenteId = info.residenteId : null

    try {
        const response = await fetch(`/api/Controller/${dbName}?type=${type}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify(body), // Convert data to JSON string
        });
        if (!response.ok) {
            throw new Error('Erro na requisição');
        }
        else {
            const data = await response.json();
            return [true, data];
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        throw new Error(`Catch Error: ${error}`);
    }
}

export async function Arquivos_GET_getArquivoById(id: string) {
    const type = 'getArquivoById'
    const url = `/api/Controller/${dbName}?type=${type}&idArquivo=${id}`
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        else {
            const result = await response.json();
            return result;
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        throw new Error(`Catch Error: ${error}`);
    }

}

export async function Arquivos_GET_getBydbNameAndId(origin: string, residenteId: string) {
    const type = 'getBydbNameAndId'
    const url = `/api/Controller/${dbName}?type=${type}&dbName=${origin}&residenteId=${residenteId}`
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        else {
            const result = await response.json();
            return result;
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        throw new Error(`Catch Error: ${error}`);
    }

}

export async function Arquivos_DELETE_deleteById(id: string) {
    const type = 'deleteById'
    const url = `/api/Controller/${dbName}?type=${type}&idArquivo=${id}`
    try {
        const response = await fetch(url, { method: 'DELETE' });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        else {
            const result = await response.json();
            return result;
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        throw new Error(`Catch Error: ${error}`);
    }

}