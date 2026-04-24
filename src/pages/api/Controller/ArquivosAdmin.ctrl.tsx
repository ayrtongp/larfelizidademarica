import type { NextApiRequest, NextApiResponse } from "next";
import connect from "@/utils/Database";
import { ObjectId } from "mongodb";
import { registrarAuditoria } from "@/utils/auditoria";

const PUBLIC_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_BASEURL || process.env.R2_PUBLIC_BASEURL || "";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { db } = await connect();

    if (req.method === "GET") return handleGet(req, res, db);
    if (req.method === "PUT") return handlePut(req, res, db);

    return res.status(405).json({ ok: false, error: "Método não permitido" });
}

// ── GET ───────────────────────────────────────────────────────────────────────

async function handleGet(req: NextApiRequest, res: NextApiResponse, db: any) {
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
        const docs = await col.find(filter).sort({ createdAt: -1 }).limit(limit).toArray();

        const userIds = [...new Set(docs.map((d: any) => d.createdBy).filter(Boolean))] as string[];
        const userMap: Record<string, string> = {};
        if (userIds.length > 0) {
            const objectIds = userIds.flatMap((id: string) => { try { return [new ObjectId(id)]; } catch { return []; } });
            if (objectIds.length > 0) {
                const users = await db.collection("usuario").find(
                    { _id: { $in: objectIds } },
                    { projection: { nome: 1, sobrenome: 1 } }
                ).toArray();
                users.forEach((u: any) => {
                    userMap[u._id.toString()] = [u.nome, u.sobrenome].filter(Boolean).join(" ");
                });
            }
        }

        const arquivos = docs.map((doc: any) => {
            const tags: string[] = Array.isArray(doc.tags) ? doc.tags : [];
            const categoria = tags[0] ?? "";
            return {
                _id: String(doc._id),
                cloudURL: doc.isPublic && PUBLIC_BASE ? `${PUBLIC_BASE.replace(/\/$/, "")}/${doc.key}` : null,
                filename: doc.originalName || "",
                cloudFilename: doc.key || "",
                descricao: doc.descricao || doc.originalName || "",
                fullName: (doc.createdBy && userMap[doc.createdBy]) || doc.createdBy || "",
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

// ── PUT ───────────────────────────────────────────────────────────────────────

async function handlePut(req: NextApiRequest, res: NextApiResponse, db: any) {
    const { id } = req.query as Record<string, string>;
    if (!id) return res.status(400).json({ ok: false, error: "id é obrigatório" });

    let docId: ObjectId;
    try { docId = new ObjectId(id); } catch { return res.status(400).json({ ok: false, error: "id inválido" }); }

    const { descricao, categoria, realizadoPor } = req.body as {
        descricao?: string;
        categoria?: string;
        realizadoPor?: string;
    };

    const col = db.collection("arquivosr2");
    const antes = await col.findOne({ _id: docId }, { projection: { descricao: 1, tags: 1 } });
    if (!antes) return res.status(404).json({ ok: false, error: "Arquivo não encontrado" });

    const $set: Record<string, any> = { updatedAt: new Date().toISOString() };
    if (realizadoPor) $set.updatedBy = realizadoPor;
    if (descricao !== undefined) $set.descricao = descricao.trim();
    if (categoria  !== undefined) $set.tags = categoria ? [categoria] : [];

    await col.updateOne({ _id: docId }, { $set });

    // Auditoria por campo alterado
    const audits: Promise<void>[] = [];

    if (descricao !== undefined && descricao.trim() !== (antes.descricao ?? "")) {
        audits.push(registrarAuditoria(db, {
            entidade: "arquivo",
            entidadeId: id,
            acao: "editar_descricao",
            campo: "descricao",
            antes: antes.descricao ?? "",
            depois: descricao.trim(),
            realizadoPor,
        }));
    }

    if (categoria !== undefined && categoria !== (antes.tags?.[0] ?? "")) {
        audits.push(registrarAuditoria(db, {
            entidade: "arquivo",
            entidadeId: id,
            acao: "editar_categoria",
            campo: "categoria",
            antes: antes.tags?.[0] ?? "",
            depois: categoria,
            realizadoPor,
        }));
    }

    await Promise.all(audits);

    return res.status(200).json({ ok: true });
}
