import { T_ContratoIdoso, T_ContratoIdosoComIdoso, T_ContratoFechado, T_PacoteAvulso, T_ContratoAvulso } from '@/types/T_contratosIdoso';

const baseUrl = '/api/Controller/C_contratosIdoso';

const S_contratosIdoso = {

  getByIdosoId: async (idosoId: string): Promise<T_ContratoIdoso[]> => {
    const res = await fetch(`${baseUrl}?type=getByIdosoId&idosoId=${idosoId}`);
    return res.json();
  },

  getAll: async (params?: { status?: string; modalidade?: string }): Promise<T_ContratoIdosoComIdoso[]> => {
    const query = new URLSearchParams({ type: 'getAll', ...(params ?? {}) });
    const res = await fetch(`${baseUrl}?${query}`);
    return res.json();
  },

  create: async (payload: {
    usuarioId: string;
    idosoDetalhesId: string;
    modalidade: T_ContratoIdoso['modalidade'];
    tipoBilling: T_ContratoIdoso['tipoBilling'];
    contratado?: T_ContratoFechado;
    pacote?: Omit<T_PacoteAvulso, 'diasUtilizados'>;
    avulso?: T_ContratoAvulso;
    observacoes?: string;
    createdBy?: string;
  }): Promise<{ id: string; message: string }> => {
    const res = await fetch(`${baseUrl}?type=new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  gerarCobranca: async (payload: {
    contratoId: string;
    competencia: string;  // 'YYYY-MM'
    createdBy?: string;
  }): Promise<{ id: string; valor: number; message: string }> => {
    const res = await fetch(`${baseUrl}?type=gerarCobranca`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  addCheckin: async (contratoId: string): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=addCheckin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contratoId }),
    });
    return res.json();
  },

  updateStatus: async (id: string, status: 'ativo' | 'encerrado' | 'suspenso'): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=updateStatus&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  updateBilling: async (id: string, payload: {
    contratado?: T_ContratoFechado;
    pacote?: T_PacoteAvulso;
    avulso?: T_ContratoAvulso;
  }): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=updateBilling&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
};

export default S_contratosIdoso;
