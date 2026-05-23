import { T_ASO, T_Advertencia, T_AtestadoMedico, T_Beneficios, T_Contrato, T_ContatoEmergencia, T_DadosBancarios, T_DadosPessoais, T_Endereco, T_CTPS, T_Ferias, T_FuncionarioCLT, T_FuncionarioCLTComUsuario } from '@/types/T_funcionariosCLT';

const baseUrl = '/api/Controller/C_funcionariosCLT';

const S_funcionariosCLT = {

  getAll: async (params?: { status?: string; setor?: string }): Promise<T_FuncionarioCLTComUsuario[]> => {
    const query = new URLSearchParams({ type: 'getAll', ...(params ?? {}) });
    const res = await fetch(`${baseUrl}?${query}`);
    return res.json();
  },

  getAtivos: async (): Promise<T_FuncionarioCLTComUsuario[]> => {
    const res = await fetch(`${baseUrl}?type=getAtivos`);
    return res.json();
  },

  getById: async (id: string): Promise<T_FuncionarioCLTComUsuario> => {
    const res = await fetch(`${baseUrl}?type=getById&id=${id}`);
    return res.json();
  },

  create: async (payload: {
    usuarioId: string;
    contrato: T_Contrato;
    createdBy?: string;
  }): Promise<{ id: string; message: string }> => {
    const res = await fetch(`${baseUrl}?type=new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  updateContrato: async (id: string, contrato: T_Contrato): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=updateContrato&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contrato }),
    });
    return res.json();
  },

  updateDadosPessoais: async (id: string, payload: {
    dadosPessoais: T_DadosPessoais;
    endereco: T_Endereco;
    ctps: T_CTPS;
    pisPasep?: string;
  }): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=updateDadosPessoais&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  updateBeneficios: async (id: string, beneficios: T_Beneficios): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=updateBeneficios&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ beneficios }),
    });
    return res.json();
  },

  updateDadosBancarios: async (id: string, dadosBancarios: T_DadosBancarios): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=updateDadosBancarios&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dadosBancarios }),
    });
    return res.json();
  },

  updateEmergencia: async (id: string, contatoEmergencia: T_ContatoEmergencia): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=updateEmergencia&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contatoEmergencia }),
    });
    return res.json();
  },

  addASO: async (id: string, aso: T_ASO): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=addASO&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aso }),
    });
    return res.json();
  },

  updateASO: async (id: string, asoIndex: number, aso: T_ASO): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=updateASO&id=${id}&asoIndex=${asoIndex}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aso }),
    });
    return res.json();
  },

  deleteASO: async (id: string, asoIndex: number): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=deleteASO&id=${id}&asoIndex=${asoIndex}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  demitir: async (id: string, payload: {
    dataDemissao: string;
    tipoDemissao: T_FuncionarioCLT['tipoDemissao'];
    motivoDemissao?: string;
  }): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=demitir&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  reativar: async (id: string): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=reativar&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  updateStatus: async (id: string, status: 'ativo' | 'afastado' | 'ferias'): Promise<{ message: string }> => {
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

  updateContatoUsuario: async (id: string, payload: { telefone: string; email: string }): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=updateContatoUsuario&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  addAtestado: async (id: string, atestado: T_AtestadoMedico): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=addAtestado&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ atestado }),
    });
    return res.json();
  },

  updateAtestado: async (id: string, atestadoIndex: number, atestado: T_AtestadoMedico): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=updateAtestado&id=${id}&atestadoIndex=${atestadoIndex}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ atestado }),
    });
    return res.json();
  },

  deleteAtestado: async (id: string, atestadoIndex: number): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=deleteAtestado&id=${id}&atestadoIndex=${atestadoIndex}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  addFerias: async (id: string, ferias: T_Ferias): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=addFerias&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ferias }),
    });
    return res.json();
  },

  deleteFerias: async (id: string, feriasIndex: number): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=deleteFerias&id=${id}&feriasIndex=${feriasIndex}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  addAdvertencia: async (id: string, advertencia: T_Advertencia): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=addAdvertencia&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ advertencia }),
    });
    return res.json();
  },

  deleteAdvertencia: async (id: string, advertenciaIndex: number): Promise<{ message: string }> => {
    const res = await fetch(`${baseUrl}?type=deleteAdvertencia&id=${id}&advertenciaIndex=${advertenciaIndex}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },
};

export default S_funcionariosCLT;
