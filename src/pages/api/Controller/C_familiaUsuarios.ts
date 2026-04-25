import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '@/utils/Database';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { getCurrentDateTime } from '@/utils/Functions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const col = db.collection('usuario');

  // ── GET todos os usuários família ────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const usuarios = await col
        .find({ tipo: 'familia' })
        .project({ pin_hash: 0 })
        .sort({ createdAt: -1 })
        .toArray();

      // Enriquece com nome do residente
      const residenteIds = Array.from(new Set(usuarios.map((u: any) => u.id_residente).filter(Boolean)));
      const pacientes = residenteIds.length > 0
        ? await db.collection('patient')
            .find({
              _id: {
                $in: residenteIds.map((id: any) => {
                  try { return new ObjectId(id); } catch { return id; }
                }),
              },
            })
            .project({ _id: 1, display_name: 1 })
            .toArray()
        : [];

      const pacienteMap = new Map(pacientes.map((p: any) => [String(p._id), p.display_name]));

      const result = usuarios.map((u: any) => ({
        _id:              String(u._id),
        nome:             u.nome,
        id_residente:     u.id_residente,
        nome_residente:   pacienteMap.get(u.id_residente) || '—',
        ativo:            u.ativo,
        createdAt:        u.createdAt,
      }));

      return res.status(200).json(result);
    } catch {
      return res.status(500).json({ message: 'Erro ao listar usuários família.' });
    }
  }

  // ── POST criar conta família ─────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { nome, pin, id_residente } = body;

      if (!nome?.trim() || !pin || !id_residente) {
        return res.status(400).json({ message: 'nome, pin e id_residente são obrigatórios.' });
      }
      const pinStr = String(pin).replace(/\D/g, '');
      if (pinStr.length !== 6) {
        return res.status(400).json({ message: 'PIN deve ter exatamente 6 dígitos.' });
      }

      const pin_hash = await bcrypt.hash(pinStr, 10);
      const now = getCurrentDateTime();

      const doc = {
        tipo:         'familia',
        nome:         nome.trim(),
        pin_hash,
        id_residente: String(id_residente),
        ativo:        'S',
        createdAt:    now,
        updatedAt:    now,
      };

      const result = await col.insertOne(doc);
      return res.status(201).json({ id: result.insertedId });
    } catch {
      return res.status(500).json({ message: 'Erro ao criar conta família.' });
    }
  }

  // ── DELETE remover conta família ─────────────────────────────────────────
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ message: 'id é obrigatório.' });

      const result = await col.deleteOne({ _id: new ObjectId(id as string), tipo: 'familia' });
      if (result.deletedCount === 0) return res.status(404).json({ message: 'Conta não encontrada.' });

      return res.status(200).json({ message: 'Conta excluída.' });
    } catch {
      return res.status(500).json({ message: 'Erro ao excluir conta.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}
