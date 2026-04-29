import { T_AgendaGeral, T_AgendaGeralStatus } from '@/types/T_agendaGeral';

const BASE = '/api/Controller/C_agendaGeral';

export interface AgendaGeralFilters {
  residente_id?: string;
  usuario_id?: string;
  status?: T_AgendaGeralStatus;
  from?: string;
  to?: string;
  somenteFuturos?: boolean;
}

export type AgendaGeralPayload = Omit<
  T_AgendaGeral,
  '_id' | 'nomeResidente' | 'nomeUsuario' | 'createdAt' | 'updatedAt'
>;

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Erro na requisição.');
  return json as T;
}

const S_agendaGeral = {
  getAll: (filters?: AgendaGeralFilters): Promise<T_AgendaGeral[]> => {
    const params = new URLSearchParams({ type: 'getAll' });

    if (filters?.residente_id) params.append('residente_id', filters.residente_id);
    if (filters?.usuario_id) params.append('usuario_id', filters.usuario_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    if (filters?.somenteFuturos) params.append('somenteFuturos', 'S');

    return fetch(`${BASE}?${params.toString()}`).then((r) => handleResponse<T_AgendaGeral[]>(r));
  },

  getById: (id: string): Promise<T_AgendaGeral> =>
    fetch(`${BASE}?type=getById&id=${id}`).then((r) => handleResponse<T_AgendaGeral>(r)),

  create: (payload: AgendaGeralPayload): Promise<T_AgendaGeral> =>
    fetch(`${BASE}?type=new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then((r) => handleResponse<T_AgendaGeral>(r)),

  update: (id: string, payload: Partial<AgendaGeralPayload>): Promise<T_AgendaGeral> =>
    fetch(`${BASE}?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then((r) => handleResponse<T_AgendaGeral>(r)),

  remove: (id: string): Promise<{ ok: true }> =>
    fetch(`${BASE}?id=${id}`, { method: 'DELETE' }).then((r) => handleResponse<{ ok: true }>(r)),
};

export default S_agendaGeral;
