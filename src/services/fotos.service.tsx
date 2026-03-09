// src/services/fotos.svc.ts
export type FotoItem = {
  _id: string;
  idosoId: string;
  url: string | null;
  legenda?: string;
  createdAt: string;
};

async function getJSON<T>(url: string): Promise<T> {
  const r = await fetch(url, { method: "GET" });
  const data = await r.json();
  if (!r.ok || data?.ok === false) throw new Error(data?.error || "Erro na requisição");
  return data as T;
}

export async function Fotos_GET_latest(limit = 10): Promise<FotoItem[]> {
  const data = await getJSON<{ ok: true; fotos: FotoItem[] }>(
    `/api/Controller/Fotos.ctrl?type=latest&limit=${encodeURIComponent(String(limit))}`
  );
  return data.fotos;
}

export async function Fotos_GET_byResident(idosoId: string, limit = 20): Promise<FotoItem[]> {
  const data = await getJSON<{ ok: true; fotos: FotoItem[] }>(
    `/api/Controller/Fotos.ctrl?type=byResident&idosoId=${encodeURIComponent(idosoId)}&limit=${encodeURIComponent(String(limit))}`
  );
  return data.fotos;
}
