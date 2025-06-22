export default async function GruposUsuario_getGruposUsuario(id_usuario: string) {
  const controller = 'GruposUsuario'
  const type = 'getGruposUsuario'
  try {
    const url = `/api/Controller/${controller}?type=${type}&id_usuario=${id_usuario}`
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