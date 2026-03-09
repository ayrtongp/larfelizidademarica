// src/services/fotos.svc.ts
export type FotoItem = {
    _id: string;
    idosoId: string;
    url: string;
    legenda?: string;
    createdAt: string;
};

function base() {
    const b = (process.env.NEXT_PUBLIC_URLDO || "").trim();
    if (!b) throw new Error("NEXT_PUBLIC_URLDO não definido");
    return b.replace(/\/$/, "");
}

// GET: últimas N fotos
export async function Fotos_GET_latest(limit = 10): Promise<FotoItem[]> {
    const url = `${base()}/fotos?type=latest&limit=${encodeURIComponent(String(limit))}`;
    const r = await fetch(url);
    const data = await r.json();
    console.log(data)
    if (!r.ok || data?.ok === false) {
        throw new Error(data?.error || "Erro ao buscar fotos.");
    }
    return (data.fotos || []) as FotoItem[];
}

// (Opcional) GET por residente
export async function Fotos_GET_byResident(idosoId: string, limit = 20): Promise<FotoItem[]> {
    const url = `${base()}/fotos?type=byResident&idosoId=${encodeURIComponent(idosoId)}&limit=${encodeURIComponent(
        String(limit)
    )}`;
    const r = await fetch(url);
    const data = await r.json();
    if (!r.ok || data?.ok === false) {
        throw new Error(data?.error || "Erro ao buscar fotos por residente.");
    }
    console.log(data)
    return (data.fotos || []) as FotoItem[];
}

// POST: upload para /r2_upload (espera FormData com campos obrigatórios)
export async function Fotos_POST_upload(fd: FormData): Promise<FotoItem> {
    const url = `${base()}/r2_upload`;
    const r = await fetch(url, { method: "POST", body: fd });
    const data = await r.json();

    if (!r.ok || data?.ok === false) {
        throw new Error(data?.error || "Falha no upload");
    }

    const file = data.file || {};
    return file;
}
