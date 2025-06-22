export default async function Residentes_put_toggleIsAtivo(residenteId: string, is_ativo: string) {
  const controller = 'ResidentesController'
  const type = 'toggleIsAtivo'

  const requestBody = {
    residenteId: residenteId,
    is_ativo: is_ativo
  }
  try {
    const url = `/api/Controller/${controller}?type=${type}`;
    const res = await fetch(url, {
      method: 'PUT', // ou 'POST', dependendo da operação
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      throw new Error(`Erro na solicitação: ${res.status}`);
      return false
    }
    else {
      const data = await res.json();
      return true
    }
  } catch (error) {
    console.error(`Catch Error {${controller}/${type}}:`, error);
  }
}