// services/fotos.svc.ts
// Serviço para fotos (backend Node/Express externo)

export interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    erros?: string[];
}

export type Foto = {
    _id: string;
    url: string;        // URL pública (CDN)
    key: string;        // caminho/objeto no bucket (ex: lfz-public/.../fotos/xxx.jpg)
    alt?: string;
    residenteId?: string;
    createdAt?: string;
    contentType?: string;
    size?: number;
};

// Use .env quando puder:
const API_BASE = "https://lobster-app-gbru2.ondigitalocean.app";

// -------------------------
// LISTAGEM PAGINADA
// GET /fotos?residenteId=...&limit=20&cursor=...
// Response esperado: { success: true, data: { items: Foto[], nextCursor?: string } }
// -------------------------
export async function getFotosByResidente(
    residenteId: string,
    opts?: { limit?: number; cursor?: string; token?: string }
): Promise<APIResponse<{ items: Foto[]; nextCursor?: string }>> {
    try {
        const url = new URL(`${API_BASE}/fotos`);
        url.searchParams.set("residenteId", residenteId);
        if (opts?.limit) url.searchParams.set("limit", String(opts.limit));
        if (opts?.cursor) url.searchParams.set("cursor", opts.cursor);

        const res = await fetch(url.toString(), {
            method: "GET",
            headers: {
                ...(opts?.token ? { Authorization: `Bearer ${opts.token}` } : {}),
            },
            // se o backend estiver em outro domínio e exigir cookies:
            // credentials: "include",
            // mode: "cors",
        });

        const data = await res.json();
        if (!res.ok) {
            return { success: false, message: data?.message || "Erro ao buscar fotos." };
        }
        // Padroniza
        return {
            success: true,
            data: { items: data?.data?.items ?? data?.items ?? [], nextCursor: data?.data?.nextCursor ?? data?.nextCursor },
        };
    } catch (e) {
        return { success: false, message: "Erro ao buscar fotos." };
    }
}

// -------------------------
// UPLOAD (multipart)
// POST /upload  (ou a sua rota /files/upload)
// Body esperado: multipart: file, folders, dbName, residenteId, descricao, ...
// Response esperado: { status: 'OK', url, key, ... }
// -------------------------
export async function uploadFotoMultipart(
    file: File,
    payload: {
        residenteId: string;
        folders: string;           // ex: lfz-public/residentes/<id>/fotos
        dbName?: string;           // 'residentes'
        descricao?: string;
        ownerType?: string;
        ownerId?: string;          // se o backend espera
        tags?: string[] | string;  // opcional
    },
    opts?: { token?: string; uploadUrl?: string; extra?: Record<string, string> }
): Promise<APIResponse<{ url: string; key: string; _id?: string }>> {
    try {
        const form = new FormData();
        form.append("file", file);
        form.append("folders", payload.folders);
        form.append("residenteId", payload.residenteId);
        if (payload.dbName) form.append("dbName", payload.dbName);
        if (payload.descricao) form.append("descricao", payload.descricao);
        if (payload.ownerType) form.append("ownerType", payload.ownerType);
        if (payload.ownerId) form.append("ownerId", payload.ownerId);
        if (payload.tags) {
            // aceita string ou array; o backend pode concatenar
            if (Array.isArray(payload.tags)) payload.tags.forEach(t => form.append("tags", t));
            else form.append("tags", payload.tags);
        }
        if (opts?.extra) Object.entries(opts.extra).forEach(([k, v]) => form.append(k, v));

        const endpoint = opts?.uploadUrl ?? `${API_BASE}/files/r2_upload`; // sua rota Express
        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                ...(opts?.token ? { Authorization: `Bearer ${opts.token}` } : {}),
                // NÃO defina Content-Type manualmente; o browser cuida do boundary
            },
            body: form,
            // credentials: "include",
            // mode: "cors",
        });

        const data = await res.json();
        if (!res.ok || data?.status !== "OK") {
            return { success: false, message: data?.error || data?.message || "Erro no upload." };
        }

        return { success: true, data: { url: data.url, key: data.key, _id: data._id } };
    } catch (e) {
        return { success: false, message: "Erro ao enviar a foto." };
    }
}

// -------------------------
// UPDATE metadados (ex.: alt/descricao)
// PUT /fotos/:id
// -------------------------
export async function updateFoto(
    id: string,
    updates: Partial<Pick<Foto, "alt">> & { descricao?: string },
    opts?: { token?: string }
): Promise<APIResponse> {
    try {
        const res = await fetch(`${API_BASE}/fotos/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...(opts?.token ? { Authorization: `Bearer ${opts.token}` } : {}),
            },
            body: JSON.stringify(updates),
            // credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) return { success: false, message: data?.message || "Erro ao atualizar foto." };
        return { success: true, data };
    } catch (e) {
        return { success: false, message: "Erro ao atualizar foto." };
    }
}

// -------------------------
// DELETE
// DELETE /fotos/:id    (ou por key via query: /fotos?key=...)
// -------------------------
export async function deleteFoto(
    id: string,
    opts?: { token?: string }
): Promise<APIResponse> {
    try {
        const res = await fetch(`${API_BASE}/fotos/${id}`, {
            method: "DELETE",
            headers: {
                ...(opts?.token ? { Authorization: `Bearer ${opts.token}` } : {}),
            },
            // credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) return { success: false, message: data?.message || "Erro ao deletar foto." };
        return { success: true, data };
    } catch (e) {
        return { success: false, message: "Erro ao deletar foto." };
    }
}
