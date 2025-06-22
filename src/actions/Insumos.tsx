const dbName = 'Insumos'

// ####################################
// ####################################
// GET METHODS
// ####################################
// ####################################

export async function Insumos_GET_getAll() {
  const type = 'getAll'

  try {
    const response = await fetch(`/api/Controller/${dbName}?type=${type}`);
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