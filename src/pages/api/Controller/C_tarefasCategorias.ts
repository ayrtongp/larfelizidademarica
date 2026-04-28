import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '@/utils/Database';
import { ObjectId } from 'mongodb';
import { getCurrentDateTime } from '@/utils/Functions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const col = db.collection('tarefas_categorias');

  // ── GET ──────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const docs = await col.find({ ativo: true }).sort({ nome: 1 }).toArray();
      return res.status(200).json(docs);
    } catch {
      return res.status(500).json({ message: 'Erro ao buscar categorias.' });
    }
  }

  // ── POST ─────────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { nome, cor } = body;
    if (!nome?.trim()) return res.status(400).json({ message: 'nome é obrigatório.' });
    try {
      const result = await col.insertOne({
        nome: nome.trim(),
        cor: cor || 'blue',
        ativo: true,
        createdAt: getCurrentDateTime(),
      });
      return res.status(201).json({ _id: String(result.insertedId) });
    } catch {
      return res.status(500).json({ message: 'Erro ao criar categoria.' });
    }
  }

  // ── PUT ───────────────────────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ message: 'id é obrigatório.' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { nome, cor } = body;
    if (!nome?.trim()) return res.status(400).json({ message: 'nome é obrigatório.' });
    try {
      await col.updateOne(
        { _id: new ObjectId(id as string) },
        { $set: { nome: nome.trim(), cor: cor || 'blue', updatedAt: getCurrentDateTime() } }
      );
      return res.status(200).json({ ok: true });
    } catch {
      return res.status(500).json({ message: 'Erro ao atualizar categoria.' });
    }
  }

  // ── DELETE ────────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ message: 'id é obrigatório.' });
    try {
      await col.updateOne(
        { _id: new ObjectId(id as string) },
        { $set: { ativo: false, updatedAt: getCurrentDateTime() } }
      );
      return res.status(200).json({ ok: true });
    } catch {
      return res.status(500).json({ message: 'Erro ao excluir categoria.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ message: 'Method not allowed.' });
}
