export default async function Usuario_getAtivos() {
  const controller = 'UsuarioController'
  // const type = 'getAll'
  try {
    const url = `/api/Controller/${controller}`
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Erro na solicitação: ${res.status}`);
    }
    else {
      const data = await res.json();
      return data
    }
  } catch (error) {
    console.error(`Catch Error {${controller}:`, error);
  }
}