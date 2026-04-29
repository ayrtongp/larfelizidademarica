import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '@/utils/Database';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const col = db.collection('agenda_visitas');
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
    if (type === 'getAll') {
      try {
        const { residente_id } = req.query;
        const filter: Record<string, unknown> = {};
        if (residente_id) filter.residente_id = String(residente_id);
        const docs = await col.find(filter).sort({ data: 1, horario: 1 }).toArray();
        return res.status(200).json(await withResidenteNames(docs));
      } catch (err) {
        console.error('[C_agendaVisitas]', err);
        return res.status(500).json({ message: 'Erro ao listar visitas.' });
      }
    }
    return res.status(400).json({ message: 'type inválido.' });
  }

  // ── POST ─────────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    const { residente_id, data, horario, descricao } = body;
    if (!residente_id || !data) {
      return res.status(400).json({ message: 'residente_id e data são obrigatórios.' });
    }
    try {
      const doc = {
        residente_id: String(residente_id),
        data:         String(data),
        horario:      horario || '',
        descricao:    descricao?.trim() || '',
        confirmada:   false,
        createdAt:    new Date().toISOString(),
      };
      const result = await col.insertOne(doc);
      return res.status(201).json({ id: String(result.insertedId) });
    } catch {
      return res.status(500).json({ message: 'Erro ao criar visita.' });
    }
  }

  // ── PUT ──────────────────────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ message: 'id é obrigatório.' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    try {
      const objectId = new ObjectId(id as string);

      if (type === 'confirmar') {
        const doc = await col.findOne({ _id: objectId });
        const confirmada = !doc?.confirmada;
        await col.updateOne({ _id: objectId }, { $set: { confirmada } });
        return res.status(200).json({ confirmada });
      }

      if (type === 'editar') {
        const update: Record<string, unknown> = {};
        if (body.data)                   update.data      = body.data;
        if (body.horario !== undefined)  update.horario   = body.horario;
        if (body.descricao !== undefined) update.descricao = body.descricao;
        if (body.confirmada !== undefined) update.confirmada = body.confirmada;
        await col.updateOne({ _id: objectId }, { $set: update });
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ message: 'type inválido.' });
    } catch {
      return res.status(500).json({ message: 'Erro ao atualizar visita.' });
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
      return res.status(500).json({ message: 'Erro ao remover visita.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ message: 'Method not allowed' });
}
