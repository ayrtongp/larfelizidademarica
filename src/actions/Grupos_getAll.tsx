export default async function Grupos_getAll() {
  const controller = 'Grupos'
  const type = 'getAll'
  try {
    const url = `/api/Controller/${controller}?type=${type}`
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Erro na solicitação: ${res.status}`);
    }
    else {
      const data = await res.json();
      return data
    }
  } catch (error) {
    console.error(`Catch Error {${controller}/${type}}:`, error);
  }
}