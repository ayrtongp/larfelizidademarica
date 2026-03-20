import { T_Admissao, T_DocumentosIdoso, T_HistoricoIdoso, T_IdosoDetalhesComUsuario, T_MembroFamiliar, T_ResponsavelIdoso } from '@/types/T_idosoDetalhes';

const baseUrl = '/api/Controller/C_idosoDetalhes';

const S_idosoDetalhes = {

  getAll: async (params?: { status?: string; modalidade?: string }): Promise<T_IdosoDetalhesComUsuario[]> => {
    const query = new URLSearchParams({ type: 'getAll', ...(params ?? {}) });
    const res = await fetch(`${baseUrl}?${query}`);
    return res.json();
  },

  getAtivos: async (): Promise<T_IdosoDetalhesComUsuario[]> => {
    const res = await fetch(`${baseUrl}?type=getAtivos`);
    return res.json();
  },

  getById: async (id: string): Promise<T_IdosoDetalhesComUsuario> => {
    const res = await fetch(`${baseUrl}?type=getById&id=${id}`);
    return res.json();
  },

  create: async (payload: {
    usuarioId: string;
    admissao: T_Admissao;
    responsavel?: T_ResponsavelIdoso;
    createdBy?: string;
  }): Promise<{ id: string; message: string }> => {
    const res = await fetch(`${baseUrl}?type=new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  updateAdmissao: async (id: string, admissao: T_Admissao): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=updateAdmissao&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admissao }),
    });
    return res.json();
  },

  updateResponsavel: async (id: string, responsavel: T_ResponsavelIdoso): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=updateResponsavel&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responsavel }),
    });
    return res.json();
  },

  updateFamilia: async (id: string, composicaoFamiliar: T_MembroFamiliar[]): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=updateFamilia&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ composicaoFamiliar }),
    });
    return res.json();
  },

  updateHistorico: async (id: string, historico: T_HistoricoIdoso, documentos: T_DocumentosIdoso): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=updateHistorico&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ historico, documentos }),
    });
    return res.json();
  },

  updateStatus: async (id: string, payload: {
    status: 'ativo' | 'alta' | 'falecido' | 'afastado';
    dataSaida?: string;
    motivoSaida?: string;
  }): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=updateStatus&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
};

export default S_idosoDetalhes;
