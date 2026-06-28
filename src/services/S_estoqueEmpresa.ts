import { T_ItemEstoque } from '@/types/T_estoqueEmpresa';

const BASE = '/api/Controller/C_estoqueEmpresa';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro desconhecido.' }));
    throw new Error(err.message || 'Erro na requisição.');
  }
  return res.json();
}

const S_estoqueEmpresa = {
  getAll: async (): Promise<T_ItemEstoque[]> => {
    const res = await fetch(`${BASE}?type=getAll`);
    return handleResponse(res);
  },

  getAbaixoMinimo: async (): Promise<T_ItemEstoque[]> => {
    const res = await fetch(`${BASE}?type=getAbaixoMinimo`);
    return handleResponse(res);
  },

  getLocais: async (): Promise<{ _id: string; nome: string }[]> => {
    const res = await fetch(`${BASE}?type=getLocais`);
    return handleResponse(res);
  },

  adicionar: async (item: any): Promise<T_ItemEstoque> => {
    const res = await fetch(`${BASE}?type=adicionar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return handleResponse(res);
  },

  addLocal: async (nome: string): Promise<{ id: string; nome: string }> => {
    const res = await fetch(`${BASE}?type=addLocal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome }),
    });
    return handleResponse(res);
  },

  atualizar: async (id: string, campos: Partial<T_ItemEstoque>): Promise<void> => {
    const res = await fetch(`${BASE}?type=atualizar&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campos),
    });
    await handleResponse(res);
  },

  entrada: async (id: string, quantidade: number, local: string, obs: string, criadoPor: string, criadoPorNome: string): Promise<void> => {
    const res = await fetch(`${BASE}?type=entrada&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantidade, local, observacoes: obs, criadoPor, criadoPorNome }),
    });
    await handleResponse(res);
  },

  saida: async (id: string, quantidade: number, local: string, obs: string, criadoPor: string, criadoPorNome: string): Promise<void> => {
    const res = await fetch(`${BASE}?type=saida&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantidade, local, observacoes: obs, criadoPor, criadoPorNome }),
    });
    await handleResponse(res);
  },

  transferir: async (id: string, quantidade: number, origem: string, destino: string, obs: string, criadoPor: string, criadoPorNome: string): Promise<void> => {
    const res = await fetch(`${BASE}?type=transferir&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantidade, origem, destino, observacoes: obs, criadoPor, criadoPorNome }),
    });
    await handleResponse(res);
  },

  historico: async (itemId: string): Promise<any[]> => {
    const res = await fetch(`${BASE}?type=historico&id=${itemId}`, { method: 'PUT' });
    return handleResponse(res);
  },

  excluir: async (id: string): Promise<void> => {
    const res = await fetch(`${BASE}?type=excluir&id=${id}`, { method: 'DELETE' });
    await handleResponse(res);
  },

  removeLocal: async (id: string): Promise<void> => {
    const res = await fetch(`${BASE}?type=removeLocal&id=${id}`, { method: 'DELETE' });
    await handleResponse(res);
  },
};

export default S_estoqueEmpresa;
