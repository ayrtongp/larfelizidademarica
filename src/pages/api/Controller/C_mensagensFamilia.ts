import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '@/utils/Database';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const col = db.collection('mensagens_familia');
  const { type } = req.query;

  // ── GET ──────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    if (type === 'getAll') {
      try {
        const statusFilter = req.query.status as string | undefined;
        const filter: Record<string, unknown> = {};
        if (statusFilter) filter.status = statusFilter;

        const docs: any[] = await col.find(filter).sort({ createdAt: -1 }).toArray();

        const userIds: string[] = Array.from(
          new Set(docs.map((d: any) => String(d.usuario_id || '')).filter(Boolean))
        );
        const resIds: string[] = Array.from(
          new Set(docs.map((d: any) => String(d.residente_id || '')).filter(Boolean))
        );

        const toObjId = (id: string) => { try { return new ObjectId(id); } catch { return null; } };

        const [users, residentes]: [any[], any[]] = await Promise.all([
          userIds.length
            ? db.collection('usuario').find(
                { _id: { $in: userIds.map(toObjId).filter(Boolean) } },
                { projection: { _id: 1, nome: 1, sobrenome: 1 } }
              ).toArray()
            : [],
          resIds.length
            ? db.collection('patient').find(
                { _id: { $in: resIds.map(toObjId).filter(Boolean) } },
                { projection: { _id: 1, display_name: 1 } }
              ).toArray()
            : [],
        ]);

        const userMap: Record<string, string> = Object.fromEntries(
          users.map((u: any) => [String(u._id), `${u.nome} ${u.sobrenome || ''}`.trim()])
        );
        const resMap: Record<string, string> = Object.fromEntries(
          residentes.map((r: any) => [String(r._id), String(r.display_name || '')])
        );

        return res.status(200).json(docs.map((d: any) => ({
          ...d,
          _id:           String(d._id),
          nomeUsuario:   userMap[String(d.usuario_id)]  || d.usuario_id,
          nomeResidente: resMap[String(d.residente_id)] || d.residente_id,
        })));
      } catch (err) {
        console.error('[C_mensagensFamilia]', err);
        return res.status(500).json({ message: 'Erro ao listar mensagens.' });
      }
    }
    return res.status(400).json({ message: 'type inválido.' });
  }

  // ── PUT ──────────────────────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ message: 'id é obrigatório.' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});

    try {
      const objectId = new ObjectId(id as string);

      if (type === 'responder') {
        const { resposta } = body;
        if (!resposta?.trim()) return res.status(400).json({ message: 'resposta é obrigatória.' });
        await col.updateOne({ _id: objectId }, {
          $set: {
            resposta:      resposta.trim(),
            respondida_em: new Date().toISOString(),
            status:        'respondida',
            lida_admin:    true,
            updatedAt:     new Date().toISOString(),
          },
        });
        return res.status(200).json({ ok: true });
      }

      if (type === 'marcarLida') {
        await col.updateOne({ _id: objectId }, {
          $set: { lida_admin: true, status: 'lida', updatedAt: new Date().toISOString() },
        });
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ message: 'type inválido.' });
    } catch {
      return res.status(500).json({ message: 'Erro ao atualizar mensagem.' });
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
      return res.status(500).json({ message: 'Erro ao remover mensagem.' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).json({ message: 'Method not allowed' });
}
