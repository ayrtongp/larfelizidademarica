import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '@/utils/Database';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const col = db.collection('boletins_familia');
  const { type } = req.query;

  const toObjId = (id: string) => { try { return new ObjectId(id); } catch { return null; } };

  async function withResidenteNames(docs: any[]) {
    const resIds: string[] = Array.from(
      new Set(docs.map((d: any) => String(d.residente_id || '')).filter(Boolean))
    );
    const residentes: any[] = resIds.length
      ? await db.collection('patient').find(
          { _id: { $in: resIds.map(toObjId).filter(Boolean) } },
          { projection: { _id: 1, display_name: 1 } }
        ).toArray()
      : [];
    const resMap: Record<string, string> = Object.fromEntries(
      residentes.map((r: any) => [String(r._id), String(r.display_name || '')])
    );
    return docs.map((d: any) => ({
      ...d,
      _id: String(d._id),
      nomeResidente: resMap[String(d.residente_id)] || d.residente_id,
    }));
  }

  // ── GET ──────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    if (type === 'getAll' || type === 'getByResidente') {
      try {
        const { residente_id } = req.query;
        const filter: Record<string, unknown> = {};
        if (residente_id) filter.residente_id = String(residente_id);
        const docs = await col.find(filter).sort({ createdAt: -1 }).toArray();
        return res.status(200).json(await withResidenteNames(docs));
      } catch (err) {
        console.error('[C_boletinsFamilia]', err);
        return res.status(500).json({ message: 'Erro ao listar boletins.' });
      }
    }
    return res.status(400).json({ message: 'type inválido.' });
  }

  // ── POST ─────────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    const { residente_id, tipo, titulo, conteudo, periodo } = body;
    if (!residente_id || !titulo?.trim() || !conteudo?.trim()) {
      return res.status(400).json({ message: 'residente_id, titulo e conteudo são obrigatórios.' });
    }
    try {
      const doc = {
        residente_id: String(residente_id),
        tipo:         tipo || 'mensal',
        titulo:       titulo.trim(),
        conteudo:     conteudo.trim(),
        periodo:      periodo?.trim() || '',
        publicado:    false,
        createdAt:    new Date().toISOString(),
        updatedAt:    new Date().toISOString(),
      };
      const result = await col.insertOne(doc);
      return res.status(201).json({ id: String(result.insertedId) });
    } catch {
      return res.status(500).json({ message: 'Erro ao criar boletim.' });
    }
  }

  // ── PUT ──────────────────────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ message: 'id é obrigatório.' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    try {
      const objectId = new ObjectId(id as string);

      if (type === 'publicar') {
        const doc = await col.findOne({ _id: objectId });
        const publicado = !doc?.publicado;
        const update: Record<string, unknown> = { publicado, updatedAt: new Date().toISOString() };
        if (publicado) update.publicado_em = new Date().toISOString();
        await col.updateOne({ _id: objectId }, { $set: update });
        return res.status(200).json({ publicado });
      }

      if (type === 'editar') {
        const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
        if (body.titulo)               update.titulo   = body.titulo.trim();
        if (body.conteudo)             update.conteudo = body.conteudo.trim();
        if (body.periodo !== undefined) update.periodo  = body.periodo;
        if (body.tipo)                 update.tipo     = body.tipo;
        await col.updateOne({ _id: objectId }, { $set: update });
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ message: 'type inválido.' });
    } catch {
      return res.status(500).json({ message: 'Erro ao atualizar boletim.' });
    }
  }

  // ── DELETE ───────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ message: 'id é obrigatório.' });
    try {
      await col.deleteOne({ _id: new ObjectId(id as string) });
      return res.status(200).json({ ok: true });
    } catch {
      return res.status(500).json({ message: 'Erro ao remover boletim.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ message: 'Method not allowed' });
}
