const dbName = 'InsumoEstoque'

// ####################################
// ####################################
// GET METHODS
// ####################################
// ####################################

export async function Insumos_Estoque_GET_getListaInsumosResidente(idResidente: string) {
  const type = 'getListaInsumosResidente'

  try {
    const response = await fetch(`/api/Controller/${dbName}?type=${type}&idResidente=${idResidente}`);
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

export async function Insumos_Estoque_GET_getHistoricoPaginado(residenteId: string, page: number = 1, limit: number = 10) {
  const type = 'getHistoricoPaginado'

  try {
    const response = await fetch(`/api/Controller/${dbName}?type=${type}&residenteId=${residenteId}&page=${page}&limit=${limit}`);
    if (!response.ok) {
      const errorText = await response.text(); // Capture the response text for more details
      throw new Error(`Erro na requisição - ${type}: ${response.status} ${response.statusText} - ${errorText}`);
    }
    else {
      const { data, count } = await response.json();
      return { data, count };
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    throw new Error(`Catch Error: ${error}`);
  }
}