import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import connect from '@/utils/Database';
import { requireAnyGroup, requireAuth } from '@/utils/authMiddleware';
import { ADMINISTRATIVO_GROUP_ID, SUPRIMENTOS_GROUP_ID } from '@/constants/accessGroups';
import type { PrioridadeSolicitacaoCompra, StatusSolicitacaoCompra, T_ItemSolicitacaoCompra } from '@/types/T_solicitacaoCompra';

const COLLECTION = 'solicitacoes_compras';
const GRUPOS_GESTAO = [
  SUPRIMENTOS_GROUP_ID,
  ADMINISTRATIVO_GROUP_ID,
  'suprimentos',
  'administrativo',
];
const STATUS_VALIDOS: StatusSolicitacaoCompra[] = [
  'pendente',
  'em_analise',
  'aprovada',
  'recusada',
  'comprada',
  'cancelada',
];

function serializar(doc: any) {
  return { ...doc, _id: String(doc._id) };
}

function normalizarItens(raw: unknown): T_ItemSolicitacaoCompra[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item: any, index) => ({
      id: String(item?.id || `${Date.now()}-${index}`),
      nome: String(item?.nome || '').trim(),
      quantidade: Number(item?.quantidade),
      unidade: String(item?.unidade || 'un').trim().slice(0, 20),
      observacao: String(item?.observacao || '').trim().slice(0, 500),
    }))
    .filter(item => item.nome && Number.isFinite(item.quantidade) && item.quantidade > 0)
    .slice(0, 50);
}

function prioridadeValida(value: unknown): PrioridadeSolicitacaoCompra {
  return value === 'urgente' ? 'urgente' : 'normal';
}

async function proximoNumero(collection: any): Promise<number> {
  const ultimo = await collection.find({}).sort({ numero: -1 }).limit(1).next();
  return Number(ultimo?.numero || 0) + 1;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const type = String(req.query.type || 'minhas');

    if (type === 'todas') {
      if (!await requireAnyGroup(req, res, GRUPOS_GESTAO)) return;
      const { db } = await connect();
      const collection = db.collection(COLLECTION);
      const docs = await collection.find({ ativo: true }).sort({ createdAt: -1 }).toArray();
      return res.status(200).json({ ok: true, solicitacoes: docs.map(serializar) });
    }

    const userId = requireAuth(req, res);
    if (!userId) return;
    const { db } = await connect();
    const collection = db.collection(COLLECTION);
    const docs = await collection.find({ ativo: true, solicitanteId: userId }).sort({ createdAt: -1 }).toArray();
    return res.status(200).json({ ok: true, solicitacoes: docs.map(serializar) });
  }

  if (req.method === 'POST') {
    const userId = requireAuth(req, res);
    if (!userId || !ObjectId.isValid(userId)) return;
    const { db } = await connect();
    const collection = db.collection(COLLECTION);

    const user = await db.collection('usuario').findOne(
      { _id: new ObjectId(userId) },
      { projection: { nome: 1, sobrenome: 1, ativo: 1 } },
    );
    if (!user || (user.ativo !== 'S' && user.ativo !== true)) {
      return res.status(401).json({ ok: false, message: 'UsuÃ¡rio inativo ou inexistente.' });
    }

    const itens = normalizarItens(req.body?.itens);
    if (itens.length === 0) {
      return res.status(400).json({ ok: false, message: 'Adicione pelo menos um item vÃ¡lido.' });
    }

    const now = new Date().toISOString();
    const doc = {
      numero: await proximoNumero(collection),
      solicitanteId: userId,
      solicitanteNome: `${user.nome || ''} ${user.sobrenome || ''}`.trim() || 'UsuÃ¡rio do portal',
      status: 'pendente' as StatusSolicitacaoCompra,
      prioridade: prioridadeValida(req.body?.prioridade),
      necessarioAte: req.body?.necessarioAte || null,
      itens,
      comentarioSolicitante: String(req.body?.comentarioSolicitante || '').trim().slice(0, 4000),
      comentarioCompras: '',
      ativo: true,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(doc);
    return res.status(201).json({ ok: true, solicitacao: serializar({ ...doc, _id: result.insertedId }) });
  }

  if (req.method === 'PUT') {
    if (!await requireAnyGroup(req, res, GRUPOS_GESTAO)) return;
    const { db } = await connect();
    const collection = db.collection(COLLECTION);
    const id = typeof req.query.id === 'string' ? req.query.id : '';
    if (!ObjectId.isValid(id)) return res.status(400).json({ ok: false, message: 'SolicitaÃ§Ã£o invÃ¡lida.' });

    const status = String(req.body?.status || '') as StatusSolicitacaoCompra;
    if (!STATUS_VALIDOS.includes(status)) {
      return res.status(400).json({ ok: false, message: 'Status invÃ¡lido.' });
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id), ativo: true },
      {
        $set: {
          status,
          comentarioCompras: String(req.body?.comentarioCompras || '').trim().slice(0, 4000),
          updatedAt: new Date().toISOString(),
        },
      },
    );
    if (!result.matchedCount) return res.status(404).json({ ok: false, message: 'SolicitaÃ§Ã£o nÃ£o encontrada.' });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const userId = requireAuth(req, res);
    if (!userId) return;
    const { db } = await connect();
    const collection = db.collection(COLLECTION);
    const id = typeof req.query.id === 'string' ? req.query.id : '';
    if (!ObjectId.isValid(id)) return res.status(400).json({ ok: false, message: 'SolicitaÃ§Ã£o invÃ¡lida.' });

    const result = await collection.updateOne(
      { _id: new ObjectId(id), solicitanteId: userId, ativo: true, status: { $in: ['pendente', 'em_analise'] } },
      { $set: { status: 'cancelada', updatedAt: new Date().toISOString() } },
    );
    if (!result.matchedCount) return res.status(409).json({ ok: false, message: 'Esta solicitaÃ§Ã£o nÃ£o pode mais ser cancelada.' });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, PUT, DELETE');
  return res.status(405).json({ ok: false, message: 'MÃ©todo nÃ£o permitido.' });
}


