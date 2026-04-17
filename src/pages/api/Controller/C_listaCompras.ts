import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb';
import { registrarAuditoria } from '../../../utils/auditoria';
import { StatusLista } from '@/types/T_listaCompras';

const TRANSICOES_VALIDAS: Record<StatusLista, StatusLista[]> = {
  rascunho: ['finalizada'],
  finalizada: ['comprada', 'rascunho'],
  comprada: [],
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const collection = db.collection('listas_compras');

  switch (req.method) {

    // ─────────────────────────────────────────────────────────────────────────
    // GET
    // ─────────────────────────────────────────────────────────────────────────
    case 'GET': {

      // GET all
      if (req.query.type === 'getAll') {
        try {
          const filter: Record<string, unknown> = { ativo: true };
          if (req.query.tipo) filter.tipo = req.query.tipo;
          if (req.query.status) filter.status = req.query.status;
          if (req.query.from || req.query.to) {
            filter.data = {};
            if (req.query.from) (filter.data as Record<string, string>).$gte = req.query.from as string;
            if (req.query.to) (filter.data as Record<string, string>).$lte = req.query.to as string;
          }
          const docs = await collection.find(filter).sort({ data: -1 }).toArray();
          return res.status(200).json(docs);
        } catch (err) {
          console.error('[C_listaCompras] getAll:', err);
          return res.status(500).json({ message: 'Erro ao buscar listas.' });
        }
      }

      // GET by id
      if (req.query.type === 'getById' && req.query.id) {
        try {
          const doc = await collection.findOne({ _id: new ObjectId(req.query.id as string) });
          if (!doc) return res.status(404).json({ message: 'Lista não encontrada.' });
          return res.status(200).json(doc);
        } catch (err) {
          console.error('[C_listaCompras] getById:', err);
          return res.status(500).json({ message: 'Erro ao buscar lista.' });
        }
      }

      return res.status(400).json({ message: 'GET: type não identificado.' });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST
    // ─────────────────────────────────────────────────────────────────────────
    case 'POST': {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      // POST criar
      if (req.query.type === 'criar') {
        try {
          const { tipo, titulo, data, observacoes, criadoPor, criadoPorNome } = body;
          if (!tipo || !titulo || !data || !criadoPor) {
            return res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
          }
          const agora = new Date().toISOString();
          const nova = {
            tipo,
            titulo: titulo.trim(),
            data,
            status: 'rascunho' as StatusLista,
            observacoes: observacoes?.trim() || '',
            itens: [],
            criadoPor,
            criadoPorNome: criadoPorNome || '',
            ativo: true,
            createdAt: agora,
            updatedAt: agora,
          };
          const result = await collection.insertOne(nova);
          await registrarAuditoria(db, {
            entidade: 'lista_compras',
            entidadeId: result.insertedId.toString(),
            nomeEntidade: titulo,
            acao: 'criar',
            depois: { tipo, status: 'rascunho' },
            realizadoPor: criadoPor,
          });
          return res.status(201).json({ id: result.insertedId.toString() });
        } catch (err) {
          console.error('[C_listaCompras] criar:', err);
          return res.status(500).json({ message: 'Erro ao criar lista.' });
        }
      }

      // POST duplicar
      if (req.query.type === 'duplicar') {
        try {
          const { id, titulo, data, criadoPor, criadoPorNome } = body;
          if (!id || !titulo || !data || !criadoPor) {
            return res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
          }
          const origem = await collection.findOne({ _id: new ObjectId(id) });
          if (!origem) return res.status(404).json({ message: 'Lista de origem não encontrada.' });

          const itensCopiados = (origem.itens || []).map((item: Record<string, unknown>) => ({
            ...item,
            _id: new ObjectId().toString(),
            comprado: false,
          }));

          const agora = new Date().toISOString();
          const nova = {
            tipo: origem.tipo,
            titulo: titulo.trim(),
            data,
            status: 'rascunho' as StatusLista,
            observacoes: origem.observacoes || '',
            itens: itensCopiados,
            criadoPor,
            criadoPorNome: criadoPorNome || '',
            baseadaEm: id,
            ativo: true,
            createdAt: agora,
            updatedAt: agora,
          };
          const result = await collection.insertOne(nova);
          await registrarAuditoria(db, {
            entidade: 'lista_compras',
            entidadeId: result.insertedId.toString(),
            nomeEntidade: titulo,
            acao: 'duplicar',
            depois: { baseadaEm: id, totalItens: itensCopiados.length },
            realizadoPor: criadoPor,
          });
          return res.status(201).json({ id: result.insertedId.toString() });
        } catch (err) {
          console.error('[C_listaCompras] duplicar:', err);
          return res.status(500).json({ message: 'Erro ao duplicar lista.' });
        }
      }

      return res.status(400).json({ message: 'POST: type não identificado.' });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUT
    // ─────────────────────────────────────────────────────────────────────────
    case 'PUT': {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ message: 'id obrigatório.' });

      // PUT updateStatus
      if (req.query.type === 'updateStatus') {
        try {
          const { status, realizadoPor } = body;
          const atual = await collection.findOne({ _id: new ObjectId(id) });
          if (!atual) return res.status(404).json({ message: 'Lista não encontrada.' });

          const permitidos = TRANSICOES_VALIDAS[atual.status as StatusLista] || [];
          if (!permitidos.includes(status)) {
            return res.status(400).json({ message: `Transição de "${atual.status}" para "${status}" não permitida.` });
          }
          await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { status, updatedAt: new Date().toISOString() } }
          );
          await registrarAuditoria(db, {
            entidade: 'lista_compras',
            entidadeId: id,
            nomeEntidade: atual.titulo,
            acao: 'atualizar_status',
            antes: { status: atual.status },
            depois: { status },
            realizadoPor,
          });
          return res.status(200).json({ message: 'Status atualizado.' });
        } catch (err) {
          console.error('[C_listaCompras] updateStatus:', err);
          return res.status(500).json({ message: 'Erro ao atualizar status.' });
        }
      }

      // PUT updateItens
      if (req.query.type === 'updateItens') {
        try {
          const { itens, realizadoPor } = body;
          const atual = await collection.findOne({ _id: new ObjectId(id) }, { projection: { titulo: 1, itens: 1 } });
          if (!atual) return res.status(404).json({ message: 'Lista não encontrada.' });

          await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { itens: itens || [], updatedAt: new Date().toISOString() } }
          );
          await registrarAuditoria(db, {
            entidade: 'lista_compras',
            entidadeId: id,
            nomeEntidade: atual.titulo,
            acao: 'atualizar_itens',
            antes: { totalItens: (atual.itens || []).length },
            depois: { totalItens: (itens || []).length },
            realizadoPor,
          });
          return res.status(200).json({ message: 'Itens atualizados.' });
        } catch (err) {
          console.error('[C_listaCompras] updateItens:', err);
          return res.status(500).json({ message: 'Erro ao atualizar itens.' });
        }
      }

      // PUT updateInfo
      if (req.query.type === 'updateInfo') {
        try {
          const { titulo, data, observacoes, realizadoPor } = body;
          const atual = await collection.findOne({ _id: new ObjectId(id) }, { projection: { titulo: 1 } });
          if (!atual) return res.status(404).json({ message: 'Lista não encontrada.' });

          const campos: Record<string, unknown> = { updatedAt: new Date().toISOString() };
          const depois: Record<string, unknown> = {};
          if (titulo !== undefined) { campos.titulo = titulo.trim(); depois.titulo = titulo.trim(); }
          if (data !== undefined) { campos.data = data; depois.data = data; }
          if (observacoes !== undefined) { campos.observacoes = observacoes.trim(); depois.observacoes = observacoes.trim(); }

          await collection.updateOne({ _id: new ObjectId(id) }, { $set: campos });
          await registrarAuditoria(db, {
            entidade: 'lista_compras',
            entidadeId: id,
            nomeEntidade: atual.titulo,
            acao: 'atualizar_info',
            depois,
            realizadoPor,
          });
          return res.status(200).json({ message: 'Lista atualizada.' });
        } catch (err) {
          console.error('[C_listaCompras] updateInfo:', err);
          return res.status(500).json({ message: 'Erro ao atualizar lista.' });
        }
      }

      return res.status(400).json({ message: 'PUT: type não identificado.' });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE
    // ─────────────────────────────────────────────────────────────────────────
    case 'DELETE': {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const id = req.query.id as string;

      if (req.query.type === 'excluir' && id) {
        try {
          const atual = await collection.findOne({ _id: new ObjectId(id) }, { projection: { titulo: 1 } });
          if (!atual) return res.status(404).json({ message: 'Lista não encontrada.' });

          await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ativo: false, updatedAt: new Date().toISOString() } }
          );
          await registrarAuditoria(db, {
            entidade: 'lista_compras',
            entidadeId: id,
            nomeEntidade: atual.titulo,
            acao: 'excluir',
            antes: { ativo: true },
            depois: { ativo: false },
            realizadoPor: body?.realizadoPor,
          });
          return res.status(200).json({ message: 'Lista excluída.' });
        } catch (err) {
          console.error('[C_listaCompras] excluir:', err);
          return res.status(500).json({ message: 'Erro ao excluir lista.' });
        }
      }

      return res.status(400).json({ message: 'DELETE: type não identificado.' });
    }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ message: `Método ${req.method} não permitido.` });
  }
}
