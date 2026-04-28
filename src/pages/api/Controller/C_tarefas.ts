import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '@/utils/Database';
import { ObjectId } from 'mongodb';
import { getCurrentDateTime } from '@/utils/Functions';

function hoje(): string {
  return new Date().toISOString().split('T')[0];
}

function buildFiltroUsuario(userId: string, verTodas: boolean) {
  if (verTodas) return {};
  return { $or: [{ atribuido_a: userId }, { atribuido_a: { $exists: false } }, { atribuido_a: null }] };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const col = db.collection('tarefas');

  // ── GET ──────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { type, userId, all } = req.query as Record<string, string>;
    const verTodas = all === 'true';

    // Todas as tarefas (filtradas por usuário)
    if (type === 'getAll') {
      if (!userId) return res.status(400).json({ message: 'userId é obrigatório.' });
      try {
        const filtro = buildFiltroUsuario(userId, verTodas);
        const docs = await col.find(filtro).sort({ prazo: 1, createdAt: -1 }).toArray();
        return res.status(200).json(docs);
      } catch {
        return res.status(500).json({ message: 'Erro ao buscar tarefas.' });
      }
    }

    // Contagem de pendentes/atrasadas para badge
    if (type === 'countPendentes') {
      if (!userId) return res.status(400).json({ message: 'userId é obrigatório.' });
      try {
        const filtroBase = buildFiltroUsuario(userId, false);
        const count = await col.countDocuments({
          ...filtroBase,
          status: { $in: ['pendente', 'em_andamento'] },
        });
        return res.status(200).json({ count });
      } catch {
        return res.status(500).json({ message: 'Erro ao contar tarefas.' });
      }
    }

    // Tarefas vencidas + vence hoje (para alerta de entrada)
    if (type === 'alertas') {
      if (!userId) return res.status(400).json({ message: 'userId é obrigatório.' });
      try {
        const filtroBase = buildFiltroUsuario(userId, false);
        const docs = await col.find({
          ...filtroBase,
          status: { $in: ['pendente', 'em_andamento'] },
          prazo: { $lte: hoje() },
        }).sort({ prazo: 1 }).limit(20).toArray();
        return res.status(200).json({ alertas: docs });
      } catch {
        return res.status(500).json({ message: 'Erro ao buscar alertas.' });
      }
    }

    return res.status(400).json({ message: 'type não reconhecido.' });
  }

  // ── POST ─────────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const {
      titulo, descricao, categoria_id, categoria_nome,
      prioridade, prazo, horario,
      atribuido_a, atribuido_nome,
      criado_por, criado_por_nome,
    } = body;

    if (!titulo?.trim()) return res.status(400).json({ message: 'titulo é obrigatório.' });
    if (!prazo)          return res.status(400).json({ message: 'prazo é obrigatório.' });
    if (!criado_por)     return res.status(400).json({ message: 'criado_por é obrigatório.' });

    try {
      const doc: any = {
        titulo:       titulo.trim(),
        descricao:    descricao?.trim() || '',
        categoria_id: categoria_id || null,
        categoria_nome: categoria_nome || '',
        prioridade:   prioridade || 'normal',
        status:       'pendente',
        prazo,
        horario:      horario || '',
        atribuido_a:  atribuido_a || null,
        atribuido_nome: atribuido_nome || '',
        criado_por,
        criado_por_nome: criado_por_nome || '',
        createdAt:    getCurrentDateTime(),
        updatedAt:    getCurrentDateTime(),
      };
      const result = await col.insertOne(doc);
      return res.status(201).json({ _id: String(result.insertedId) });
    } catch {
      return res.status(500).json({ message: 'Erro ao criar tarefa.' });
    }
  }

  // ── PUT ───────────────────────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const { type, id } = req.query as Record<string, string>;
    if (!id) return res.status(400).json({ message: 'id é obrigatório.' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // Atualiza apenas o status
    if (type === 'status') {
      const { status, userId, userName } = body;
      if (!status) return res.status(400).json({ message: 'status é obrigatório.' });
      try {
        const set: any = { status, updatedAt: getCurrentDateTime() };
        if (status === 'concluida') {
          set.concluido_em     = getCurrentDateTime();
          set.concluido_por     = userId || '';
          set.concluido_por_nome = userName || '';
        }
        await col.updateOne({ _id: new ObjectId(id) }, { $set: set });
        return res.status(200).json({ ok: true });
      } catch {
        return res.status(500).json({ message: 'Erro ao atualizar status.' });
      }
    }

    // Edição geral
    if (type === 'editar') {
      const {
        titulo, descricao, categoria_id, categoria_nome,
        prioridade, prazo, horario, atribuido_a, atribuido_nome,
      } = body;
      if (!titulo?.trim()) return res.status(400).json({ message: 'titulo é obrigatório.' });
      try {
        await col.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              titulo:         titulo.trim(),
              descricao:      descricao?.trim() || '',
              categoria_id:   categoria_id || null,
              categoria_nome: categoria_nome || '',
              prioridade:     prioridade || 'normal',
              prazo,
              horario:        horario || '',
              atribuido_a:    atribuido_a || null,
              atribuido_nome: atribuido_nome || '',
              updatedAt:      getCurrentDateTime(),
            },
          }
        );
        return res.status(200).json({ ok: true });
      } catch {
        return res.status(500).json({ message: 'Erro ao editar tarefa.' });
      }
    }

    return res.status(400).json({ message: 'type não reconhecido.' });
  }

  // ── DELETE ────────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ message: 'id é obrigatório.' });
    try {
      await col.deleteOne({ _id: new ObjectId(id as string) });
      return res.status(200).json({ ok: true });
    } catch {
      return res.status(500).json({ message: 'Erro ao excluir tarefa.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ message: 'Method not allowed.' });
}
