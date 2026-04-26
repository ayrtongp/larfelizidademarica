import { T_FamiliarResidentePopulado } from '@/types/T_familiarResidente';

const BASE = '/api/Controller/C_familiarResidente';

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Erro na requisição.');
  return json as T;
}

const S_familiarResidente = {
  getByResidente: (residenteId: string): Promise<T_FamiliarResidentePopulado[]> =>
    fetch(`${BASE}?type=getByResidente&residente_id=${residenteId}`)
      .then(r => handleResponse<T_FamiliarResidentePopulado[]>(r)),

  getByUsuario: (usuarioId: string): Promise<T_FamiliarResidentePopulado[]> =>
    fetch(`${BASE}?type=getByUsuario&usuario_id=${usuarioId}`)
      .then(r => handleResponse<T_FamiliarResidentePopulado[]>(r)),

  createVinculo: (payload: { usuario_id: string; residente_id: string; parentesco: string }): Promise<{ id: string }> =>
    fetch(`${BASE}?type=new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(r => handleResponse<{ id: string }>(r)),

  toggleAtivo: (id: string): Promise<{ message: string; ativo: boolean }> =>
    fetch(`${BASE}?type=toggleAtivo&id=${id}`, { method: 'PUT' })
      .then(r => handleResponse<{ message: string; ativo: boolean }>(r)),

  removeVinculo: (id: string): Promise<{ message: string }> =>
    fetch(`${BASE}?id=${id}`, { method: 'DELETE' })
      .then(r => handleResponse<{ message: string }>(r)),
};

export default S_familiarResidente;
