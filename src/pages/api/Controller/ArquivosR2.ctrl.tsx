import type { NextApiRequest, NextApiResponse } from "next";
import connect from "@/utils/Database";

const PUBLIC_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_BASEURL || process.env.R2_PUBLIC_BASEURL || "";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Método não permitido" });

    const { db } = await connect();
    const col = db.collection("arquivosr2");
    const { folder, limit: limitQ } = req.query as Record<string, string>;

    if (!folder) return res.status(400).json({ ok: false, error: "folder é obrigatório" });

    const limit = Math.min(Number(limitQ ?? 50) || 50, 200);

    try {
        const docs = await col
            .find<Record<string, any>>({ collection: "arquivos", folder })
            .sort({ createdAt: -1 })
            .limit(limit)
            .toArray();

        const arquivos = docs.map((doc: Record<string, any>) => ({
            _id: String(doc._id),
            cloudURL: doc.isPublic && PUBLIC_BASE ? `${PUBLIC_BASE.replace(/\/$/, "")}/${doc.key}` : null,
            filename: doc.originalName || "",
            cloudFilename: doc.key || "",
            descricao: doc.descricao || (Array.isArray(doc.tags) ? doc.tags[0] : "") || doc.originalName || "",
            fullName: doc.createdBy || "",
            size: String(doc.size ?? ""),
            format: doc.contentType || "",
            dbName: "residentes",
            createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
        }));

        return res.status(200).json({ ok: true, arquivos });
    } catch (e: any) {
        return res.status(500).json({ ok: false, error: e.message });
    }
}
