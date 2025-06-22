const dbName = 'ResidentesController'

// ####################################
// ####################################
//              GET   METHODS
// ####################################
// ####################################

export async function Residentes_GET_getAll() {
    const type = 'getAll'
    const url = `/api/Controller/${dbName}?type=${type}`
    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Erro na solicitação: ${res.status}`);
        }
        else {
            const data = await res.json();
            return data
        }
    } catch (error) {
        console.error(`Catch Error {${dbName}/${type}}:`, error);
    }
}

export async function Residentes_GET_getAllActive() {
    const type = 'getAllActive'
    const url = `/api/Controller/${dbName}?type=${type}`
    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Erro na solicitação: ${res.status}`);
        }
        else {
            const data = await res.json();
            return data
        }
    } catch (error) {
        console.error(`Catch Error {${dbName}/${type}}:`, error);
    }
}

export async function Residentes_GET_getAniversarios() {
    const type = 'getAniversarios'
    const url = `/api/Controller/${dbName}?type=${type}`

    try {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error('Erro na requisição');
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
// PUT METHODS
// ####################################
// ####################################

export async function Residentes_PUT_alterarDados(body: object) {
    const type = 'changeData'
    try {
        const response = await fetch(`/api/Controller/${dbName}?type=${type}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            throw new Error('Erro na requisição');
        }
        else {
            const data = await response.json();
            return [data, response.ok];
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        throw new Error(`Catch Error: ${error}`);
    }
}

export async function Residentes_PUT_alterarLimites(body: object) {
    const type = 'updateLimitesSinais';
    try {
        const response = await fetch(`/api/Controller/${dbName}?type=${type}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error('Erro na requisição');
        } else {
            const data = await response.json();
            return [data, response.ok] as const;
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        throw new Error(`Catch Error: ${error}`);
    }
}