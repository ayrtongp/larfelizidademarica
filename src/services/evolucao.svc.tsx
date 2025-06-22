const baseUrl = '/api/Controller/EvolucaoController';

const evolucaoService = {
  getAll: async () => {
    const res = await fetch(`${baseUrl}?type=getAll`);
    return res.json();
  },

  getLast50: async (skip = 0, limit = 50) => {
    const res = await fetch(`${baseUrl}?type=getLast50&skip=${skip}&limit=${limit}`);
    return res.json();
  },

  getReport: async (id: string, dataInicio: string, dataFim: string) => {
    const res = await fetch(
      `${baseUrl}?type=report&id=${id}&dataInicio=${dataInicio}&dataFim=${dataFim}`
    );
    return res.json();
  },

  getPages: async (skip = 0, limit = 10, residente_id?: string) => {
    let url = `${baseUrl}?type=pages&skip=${skip}&limit=${limit}`;
    if (residente_id) url += `&residente_id=${residente_id}`;
    const res = await fetch(url);
    return res.json();
  },

  getById: async (id: string) => {
    const res = await fetch(`${baseUrl}?type=getById&id=${id}`);
    return res.json();
  },

  getBetweenDates: async (dataInicio: string, dataFim: string) => {
    const res = await fetch(
      `${baseUrl}?type=getBetweenDates&dataInicio=${dataInicio}&dataFim=${dataFim}`
    );
    return res.json();
  },

  countDocuments: async () => {
    const res = await fetch(`${baseUrl}?type=countDocuments`);
    return res.json();
  },

  getLast: async (residenteId: string) => {
    const res = await fetch(`${baseUrl}?type=getLast&residenteId=${residenteId}`);
    return res.json();
  },

  createNew: async (payload: any) => {
    const res = await fetch(`${baseUrl}?type=new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
};

export default evolucaoService;