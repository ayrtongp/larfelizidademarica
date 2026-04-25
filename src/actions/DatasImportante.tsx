import { T_DataImportante } from '@/types/T_datasImportantes';

const BASE = '/api/Controller/DatasImportantes';

export async function DatasImportantes_GET_getAll(): Promise<T_DataImportante[]> {
  const res = await fetch(`${BASE}?type=getAll`);
  if (!res.ok) throw new Error('Erro ao buscar datas importantes.');
  return res.json();
}

export async function DatasImportantes_POST_new(data: Omit<T_DataImportante, '_id' | 'createdAt' | 'updatedAt'>): Promise<{ id: string }> {
  const res = await fetch(`${BASE}?type=new`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || json.message || 'Erro ao criar.');
  return json;
}

export async function DatasImportantes_PUT_update(id: string, data: Omit<T_DataImportante, '_id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  const res = await fetch(`${BASE}?type=update&id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error || json.message || 'Erro ao atualizar.');
  }
}

export async function DatasImportantes_DELETE(id: string): Promise<void> {
  const res = await fetch(`${BASE}?id=${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.message || 'Erro ao excluir.');
  }
}
