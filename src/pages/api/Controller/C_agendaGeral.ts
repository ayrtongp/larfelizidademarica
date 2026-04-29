import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '@/utils/Database';
import { ObjectId } from 'mongodb';
import type {
  T_AgendaGeral,
  T_AgendaGeralOrigem,
  T_AgendaGeralStatus,
  T_AgendaGeralTipo,
} from '@/types/T_agendaGeral';

const TIPOS: T_AgendaGeralTipo[] = [
  'consulta',
  'exame',
  'reuniao',
  'visita',
  'retorno',
  'compromisso',
  'outro',
];

const ORIGENS: T_AgendaGeralOrigem[] = [
  'familia',
  'equipe',
  'rh',
  'coordenacao',
  'outro',
];

const STATUSES: T_AgendaGeralStatus[] = [
  'agendado',
  'concluido',
  'cancelado',
];

const TIPOS_SET = new Set<string>(TIPOS);
const ORIGENS_SET = new Set<string>(ORIGENS);
const STATUSES_SET = new Set<string>(STATUSES);

function parseBody(req: NextApiRequest) {
  return typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

function toObjectId(value?: string | null) {
  if (!value) return null;
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
}

function isAgendaTipo(value: unknown): value is T_AgendaGeralTipo {
  return typeof value === 'string' && TIPOS_SET.has(value);
}

function isAgendaOrigem(value: unknown): value is T_AgendaGeralOrigem {
  return typeof value === 'string' && ORIGENS_SET.has(value);
}

function isAgendaStatus(value: unknown): value is T_AgendaGeralStatus {
  return typeof value === 'string' && STATUSES_SET.has(value);
}

async function withNames(db: any, docs: any[]): Promise<T_AgendaGeral[]> {
  const residentIds = Array.from(
    new Set(
      docs
        .map((doc) => normalizeOptionalString(doc.residente_id))
        .filter(Boolean) as string[],
    ),
  );

  const userIds = Array.from(
    new Set(
      docs
        .map((doc) => normalizeOptionalString(doc.usuario_id))
        .filter(Boolean) as string[],
    ),
  );

  const residents = residentIds.length
    ? await db.collection('patient').find(
      { _id: { $in: residentIds.map((id) => toObjectId(id)).filter(Boolean) } },
      { projection: { _id: 1, display_name: 1 } },
    ).toArray()
    : [];

  const users = userIds.length
    ? await db.collection('usuario').find(
      { _id: { $in: userIds.map((id) => toObjectId(id)).filter(Boolean) } },
      { projection: { _id: 1, nome: 1, sobrenome: 1 } },
    ).toArray()
    : [];

  const residentMap: Record<string, string> = Object.fromEntries(
    residents.map((item: any) => [String(item._id), item.display_name]),
  );

  const userMap: Record<string, string> = Object.fromEntries(
    users.map((item: any) => [
      String(item._id),
      [item.nome, item.sobrenome].filter(Boolean).join(' ').trim(),
    ]),
  );

  return docs.map((doc) => ({
    ...doc,
    _id: String(doc._id),
    residente_id: normalizeOptionalString(doc.residente_id),
    usuario_id: normalizeOptionalString(doc.usuario_id),
    nomeResidente: normalizeOptionalString(doc.residente_id)
      ? residentMap[String(doc.residente_id)] || undefined
      : undefined,
    nomeUsuario: normalizeOptionalString(doc.usuario_id)
      ? userMap[String(doc.usuario_id)] || undefined
      : undefined,
  }));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const col = db.collection('agenda_geral');
  const { type, id } = req.query;

  if (req.method === 'GET') {
    if (type === 'getAll') {
      try {
        const filter: Record<string, any> = {};
        const residenteId = normalizeOptionalString(req.query.residente_id);
        const usuarioId = normalizeOptionalString(req.query.usuario_id);
        const status = req.query.status;
        const from = req.query.from;
        const to = req.query.to;
        const somenteFuturos = req.query.somenteFuturos === 'S';

        if (residenteId) filter.residente_id = residenteId;
        if (usuarioId) filter.usuario_id = usuarioId;
        if (isAgendaStatus(status)) filter.status = status;

        if (isIsoDate(from) || isIsoDate(to) || somenteFuturos) {
          filter.data = {};

          if (somenteFuturos && !isIsoDate(from)) {
            filter.data.$gte = new Date().toISOString().split('T')[0];
          }

          if (isIsoDate(from)) {
            filter.data.$gte = from;
          }

          if (isIsoDate(to)) {
            filter.data.$lte = to;
          }
        }

        const docs = await col.find(filter).sort({ data: 1, horario: 1, titulo: 1 }).toArray();
        return res.status(200).json(await withNames(db, docs));
      } catch (error) {
        console.error('[C_agendaGeral:getAll]', error);
        return res.status(500).json({ message: 'Erro ao listar agenda.' });
      }
    }

    if (type === 'getById' && typeof id === 'string') {
      try {
        const objectId = toObjectId(id);
        if (!objectId) return res.status(400).json({ message: 'id inválido.' });

        const doc = await col.findOne({ _id: objectId });
        if (!doc) return res.status(404).json({ message: 'Evento não encontrado.' });

        const [item] = await withNames(db, [doc]);
        return res.status(200).json(item);
      } catch (error) {
        console.error('[C_agendaGeral:getById]', error);
        return res.status(500).json({ message: 'Erro ao buscar evento.' });
      }
    }

    return res.status(400).json({ message: 'type inválido.' });
  }

  if (req.method === 'POST' && type === 'new') {
    try {
      const body = parseBody(req);
      const titulo = normalizeOptionalString(body.titulo);
      const data = body.data;
      const tipo = body.tipo;
      const origem = body.origem;
      const status = body.status;

      if (!titulo || !isIsoDate(data) || !isAgendaTipo(tipo) || !isAgendaOrigem(origem)) {
        return res.status(400).json({ message: 'titulo, data, tipo e origem são obrigatórios.' });
      }

      const now = new Date().toISOString();
      const doc: Record<string, any> = {
        titulo,
        data,
        tipo,
        origem,
        status: isAgendaStatus(status) ? status : 'agendado',
        createdAt: now,
        updatedAt: now,
      };

      const horario = normalizeOptionalString(body.horario);
      const residenteId = normalizeOptionalString(body.residente_id);
      const usuarioId = normalizeOptionalString(body.usuario_id);
      const local = normalizeOptionalString(body.local);
      const informadoPor = normalizeOptionalString(body.informado_por);
      const descricao = normalizeOptionalString(body.descricao);

      if (horario) doc.horario = horario;
      if (residenteId) doc.residente_id = residenteId;
      if (usuarioId) doc.usuario_id = usuarioId;
      if (local) doc.local = local;
      if (informadoPor) doc.informado_por = informadoPor;
      if (descricao) doc.descricao = descricao;

      const result = await col.insertOne(doc);
      const [created] = await withNames(db, [{ ...doc, _id: result.insertedId }]);
      return res.status(201).json(created);
    } catch (error) {
      console.error('[C_agendaGeral:new]', error);
      return res.status(500).json({ message: 'Erro ao criar evento.' });
    }
  }

  if (req.method === 'PUT' && typeof id === 'string') {
    try {
      const objectId = toObjectId(id);
      if (!objectId) return res.status(400).json({ message: 'id inválido.' });

      const body = parseBody(req);
      const set: Record<string, any> = { updatedAt: new Date().toISOString() };
      const unset: Record<string, ''> = {};

      if (body.titulo !== undefined) {
        const titulo = normalizeOptionalString(body.titulo);
        if (!titulo) return res.status(400).json({ message: 'Título inválido.' });
        set.titulo = titulo;
      }

      if (body.data !== undefined) {
        if (!isIsoDate(body.data)) return res.status(400).json({ message: 'Data inválida.' });
        set.data = body.data;
      }

      if (body.tipo !== undefined) {
        if (!isAgendaTipo(body.tipo)) return res.status(400).json({ message: 'Tipo inválido.' });
        set.tipo = body.tipo;
      }

      if (body.origem !== undefined) {
        if (!isAgendaOrigem(body.origem)) return res.status(400).json({ message: 'Origem inválida.' });
        set.origem = body.origem;
      }

      if (body.status !== undefined) {
        if (!isAgendaStatus(body.status)) return res.status(400).json({ message: 'Status inválido.' });
        set.status = body.status;
      }

      if (body.horario !== undefined) {
        const horario = normalizeOptionalString(body.horario);
        if (horario) set.horario = horario;
        else unset.horario = '';
      }

      if (body.local !== undefined) {
        const local = normalizeOptionalString(body.local);
        if (local) set.local = local;
        else unset.local = '';
      }

      if (body.informado_por !== undefined) {
        const informadoPor = normalizeOptionalString(body.informado_por);
        if (informadoPor) set.informado_por = informadoPor;
        else unset.informado_por = '';
      }

      if (body.descricao !== undefined) {
        const descricao = normalizeOptionalString(body.descricao);
        if (descricao) set.descricao = descricao;
        else unset.descricao = '';
      }

      if (body.residente_id !== undefined) {
        const residenteId = normalizeOptionalString(body.residente_id);
        if (residenteId) set.residente_id = residenteId;
        else unset.residente_id = '';
      }

      if (body.usuario_id !== undefined) {
        const usuarioId = normalizeOptionalString(body.usuario_id);
        if (usuarioId) set.usuario_id = usuarioId;
        else unset.usuario_id = '';
      }

      const update: Record<string, any> = { $set: set };
      if (Object.keys(unset).length > 0) update.$unset = unset;

      await col.updateOne({ _id: objectId }, update);
      const updated = await col.findOne({ _id: objectId });
      if (!updated) return res.status(404).json({ message: 'Evento não encontrado.' });

      const [item] = await withNames(db, [updated]);
      return res.status(200).json(item);
    } catch (error) {
      console.error('[C_agendaGeral:update]', error);
      return res.status(500).json({ message: 'Erro ao atualizar evento.' });
    }
  }

  if (req.method === 'DELETE' && typeof id === 'string') {
    try {
      const objectId = toObjectId(id);
      if (!objectId) return res.status(400).json({ message: 'id inválido.' });

      const result = await col.deleteOne({ _id: objectId });
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Evento não encontrado.' });
      }

      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error('[C_agendaGeral:delete]', error);
      return res.status(500).json({ message: 'Erro ao remover evento.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}
