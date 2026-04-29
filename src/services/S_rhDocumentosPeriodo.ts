import { T_RhDocumentoPeriodo, TipoDocumentoPeriodo } from '@/types/T_rhDocumentosPeriodo';

const BASE = '/api/Controller/C_rhDocumentosPeriodo';

const S_rhDocumentosPeriodo = {
  async getByFuncionario(
    funcionarioId: string,
    tipo: TipoDocumentoPeriodo,
    filtros?: { mes?: number; ano?: number }
  ): Promise<T_RhDocumentoPeriodo[]> {
    const params = new URLSearchParams({ type: 'getByFuncionario', funcionarioId, tipo });
    if (filtros?.mes) params.set('mes', String(filtros.mes));
    if (filtros?.ano) params.set('ano', String(filtros.ano));
    const res = await fetch(`${BASE}?${params}`);
    if (!res.ok) throw new Error('Erro ao buscar documentos');
    return res.json();
  },

  async salvar(data: Omit<T_RhDocumentoPeriodo, '_id' | 'createdAt'>): Promise<T_RhDocumentoPeriodo> {
    const res = await fetch(`${BASE}?type=new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erro ao salvar documento');
    return res.json();
  },

  async remover(id: string): Promise<void> {
    const res = await fetch(`${BASE}?type=delete&id=${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao remover documento');
  },
};

export default S_rhDocumentosPeriodo;
