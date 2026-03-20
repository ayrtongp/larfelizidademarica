import { T_ContratoPrestador, T_DadosBancariosPrestador, T_DadosPrestador, T_EnderecoPrestador, T_PrestadorServicoComUsuario } from '@/types/T_prestadoresServico';

const baseUrl = '/api/Controller/C_prestadoresServico';

const S_prestadoresServico = {

  getAll: async (params?: { status?: string; tipoServico?: string }): Promise<T_PrestadorServicoComUsuario[]> => {
    const query = new URLSearchParams({ type: 'getAll', ...(params ?? {}) });
    const res = await fetch(`${baseUrl}?${query}`);
    return res.json();
  },

  getById: async (id: string): Promise<T_PrestadorServicoComUsuario> => {
    const res = await fetch(`${baseUrl}?type=getById&id=${id}`);
    return res.json();
  },

  create: async (payload: {
    usuarioId: string;
    tipoPessoa: 'pf' | 'pj';
    contrato: T_ContratoPrestador;
    dados?: T_DadosPrestador;
    createdBy?: string;
  }): Promise<{ id: string; message: string }> => {
    const res = await fetch(`${baseUrl}?type=new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  updateContrato: async (id: string, contrato: T_ContratoPrestador): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=updateContrato&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contrato }),
    });
    return res.json();
  },

  updateDados: async (id: string, payload: {
    dados: T_DadosPrestador;
    endereco: T_EnderecoPrestador;
    tipoPessoa: 'pf' | 'pj';
  }): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=updateDados&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  updateBancarios: async (id: string, dadosBancarios: T_DadosBancariosPrestador): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=updateBancarios&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dadosBancarios }),
    });
    return res.json();
  },

  updateStatus: async (id: string, status: 'ativo' | 'inativo' | 'suspenso'): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=updateStatus&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  updateObservacoes: async (id: string, observacoes: string): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=updateObservacoes&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ observacoes }),
    });
    return res.json();
  },
};

export default S_prestadoresServico;
