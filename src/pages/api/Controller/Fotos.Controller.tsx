// src/pages/api/Controller/Fotos.ctrl.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import connect from "@/utils/Database";
import { FOTOS_COLLECTION_NAME, FOTOS_COLLECTION_FILTER, type ArquivoR2Doc, type FotoItem } from "@/types/Fotos";

// Dica: defina no .env do Next (server-side)
// NEXT_PUBLIC_R2_PUBLIC_BASEURL=https://cdn.larfelizidade.com.br
const PUBLIC_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_BASEURL || process.env.R2_PUBLIC_BASEURL || "";

function toISO(d: Date | string | undefined): string {
    if (!d) return new Date().toISOString();
    return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
}

function mapToFotoItem(doc: ArquivoR2Doc): FotoItem {
    const idosoId = String(doc.folder || "");
    const isPublic = !!doc.isPublic;
    // Monta URL pública apenas se:
    // - arquivo for público
    // - e houver base pública configurada (ex.: https://cdn.seudominio.com)
    const url = isPublic && PUBLIC_BASE ? `${PUBLIC_BASE.replace(/\/$/, "")}/${doc.key}` : null;

    return {
        _id: String(doc._id),
        idosoId,
        url,
        createdAt: toISO(doc.createdAt),
        // legenda: (opcional) se futuramente salvar em outra coleção
    };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { db } = await connect();
    const col = db.collection(FOTOS_COLLECTION_NAME);
    const type = String(req.query.type || "");

    try {
        if (req.method === "GET") {
            if (type === "latest") {
                // GET /api/Controller/Fotos.ctrl?type=latest&limit=10
                const limit = Math.min(Number(req.query.limit ?? 10) || 10, 50);
                const docs = await col
                    .find({ ...FOTOS_COLLECTION_FILTER })
                    .sort({ createdAt: -1 })
                    .limit(limit)
                    .toArray();

                const fotos = docs.map(mapToFotoItem);
                return res.status(200).json({ ok: true, fotos });
            }

            if (type === "byResident") {
                // GET /api/Controller/Fotos.ctrl?type=byResident&idosoId=...&limit=20
                const { idosoId } = req.query as { idosoId?: string };
                if (!idosoId) return res.status(400).json({ ok: false, error: "idosoId é obrigatório" });

                const limit = Math.min(Number(req.query.limit ?? 20) || 20, 100);
                const docs = await col
                    .find({ ...FOTOS_COLLECTION_FILTER, folder: idosoId })
                    .sort({ createdAt: -1 })
                    .limit(limit)
                    .toArray();

                const fotos = docs.map(mapToFotoItem);
                return res.status(200).json({ ok: true, fotos });
            }

            // (opcional) buscar 1 por id
            if (type === "getById") {
                // GET /api/Controller/Fotos.ctrl?type=getById&id=...
                const { id } = req.query as { id?: string };
                if (!id || !ObjectId.isValid(id)) return res.status(400).json({ ok: false, error: "id inválido" });
                const doc = await col.findOne({ _id: new ObjectId(id) });
                if (!doc) return res.status(404).json({ ok: false, error: "não encontrado" });
                return res.status(200).json({ ok: true, foto: mapToFotoItem(doc) });
            }

            return res.status(400).json({ ok: false, error: "Tipo de GET inválido." });
        }

        // A criação/remoção física do arquivo é feita pelo seu backend Express em:
        // POST http://localhost:8080/r2_upload  (já usado no front)
        // Se quiser, podemos adicionar endpoints de proxy aqui futuramente.

        return res.status(405).json({ ok: false, error: "Método não permitido." });
    } catch (e: any) {
        console.error("Fotos.ctrl error:", e);
        return res.status(500).json({ ok: false, error: e.message || "Erro interno" });
    }
}

// Sugestões de índices no Mongo (execute uma vez no shell ou via migration):
// db.arquivosr2.createIndex({ collection: 1, createdAt: -1 })
// db.arquivosr2.createIndex({ collection: 1, folder: 1, createdAt: -1 })
