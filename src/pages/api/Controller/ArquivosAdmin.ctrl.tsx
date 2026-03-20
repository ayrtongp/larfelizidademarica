import type { NextApiRequest, NextApiResponse } from "next";
import connect from "@/utils/Database";

const PUBLIC_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_BASEURL || process.env.R2_PUBLIC_BASEURL || "";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Método não permitido" });

    const { db } = await connect();
    const col = db.collection("arquivosr2");
    const { folder, search, limit: limitQ } = req.query as Record<string, string>;

    if (!folder) return res.status(400).json({ ok: false, error: "folder é obrigatório" });

    const limit = Math.min(Number(limitQ ?? 100) || 100, 500);

    const filter: any = { collection: "arquivos", folder };

    if (search && search.trim()) {
        const regex = { $regex: search.trim(), $options: "i" };
        filter.$or = [
            { originalName: regex },
            { descricao: regex },
            { tags: regex },
        ];
    }

    try {
        const docs = await col
            .find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .toArray();

        const arquivos = docs.map((doc: any) => {
            const tags: string[] = Array.isArray(doc.tags) ? doc.tags : [];
            const categoria = tags[0] ?? "";
            return {
                _id: String(doc._id),
                cloudURL: doc.isPublic && PUBLIC_BASE ? `${PUBLIC_BASE.replace(/\/$/, "")}/${doc.key}` : null,
                filename: doc.originalName || "",
                cloudFilename: doc.key || "",
                descricao: doc.descricao || categoria || doc.originalName || "",
                fullName: doc.createdBy || "",
                size: String(doc.size ?? ""),
                format: doc.contentType || "",
                createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
                tags,
                categoria,
            };
        });

        return res.status(200).json({ ok: true, arquivos });
    } catch (e: any) {
        return res.status(500).json({ ok: false, error: e.message });
    }
}
