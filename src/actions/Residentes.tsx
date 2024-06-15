const dbName = 'ResidentesController'

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