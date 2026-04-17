import { StatusLista, T_ItemLista, T_ListaCompras, TipoLista } from '@/types/T_listaCompras';

const BASE = '/api/Controller/C_listaCompras';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro desconhecido.' }));
    throw new Error(err.message || 'Erro na requisição.');
  }
  return res.json();
}

const S_listaCompras = {

  getAll: async (filtros?: {
    tipo?: TipoLista;
    status?: StatusLista;
    from?: string;
    to?: string;
  }): Promise<T_ListaCompras[]> => {
    const params = new URLSearchParams({ type: 'getAll' });
    if (filtros?.tipo) params.set('tipo', filtros.tipo);
    if (filtros?.status) params.set('status', filtros.status);
    if (filtros?.from) params.set('from', filtros.from);
    if (filtros?.to) params.set('to', filtros.to);
    const res = await fetch(`${BASE}?${params}`);
    return handleResponse<T_ListaCompras[]>(res);
  },

  getById: async (id: string): Promise<T_ListaCompras> => {
    const res = await fetch(`${BASE}?type=getById&id=${id}`);
    return handleResponse<T_ListaCompras>(res);
  },

  criar: async (payload: {
    tipo: TipoLista;
    titulo: string;
    data: string;
    observacoes?: string;
    criadoPor: string;
    criadoPorNome: string;
  }): Promise<{ id: string }> => {
    const res = await fetch(`${BASE}?type=criar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  duplicar: async (payload: {
    id: string;
    titulo: string;
    data: string;
    criadoPor: string;
    criadoPorNome: string;
  }): Promise<{ id: string }> => {
    const res = await fetch(`${BASE}?type=duplicar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  updateStatus: async (id: string, status: StatusLista, realizadoPor: string): Promise<void> => {
    const res = await fetch(`${BASE}?type=updateStatus&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, realizadoPor }),
    });
    await handleResponse(res);
  },

  updateItens: async (id: string, itens: T_ItemLista[], realizadoPor: string): Promise<void> => {
    const res = await fetch(`${BASE}?type=updateItens&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itens, realizadoPor }),
    });
    await handleResponse(res);
  },

  updateInfo: async (
    id: string,
    data: Partial<Pick<T_ListaCompras, 'titulo' | 'data' | 'observacoes'>>,
    realizadoPor: string
  ): Promise<void> => {
    const res = await fetch(`${BASE}?type=updateInfo&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, realizadoPor }),
    });
    await handleResponse(res);
  },

  excluir: async (id: string, realizadoPor: string): Promise<void> => {
    const res = await fetch(`${BASE}?type=excluir&id=${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ realizadoPor }),
    });
    await handleResponse(res);
  },
};

export default S_listaCompras;
