import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const collection = db.collection('estoque_empresa');
  const movCol = db.collection('estoque_empresa_mov');
  const locaisCol = db.collection('estoque_locais');

  switch (req.method) {
    case 'GET': {
      if (req.query.type === 'getAll') {
        try {
          const docs = await collection.find({}).sort({ nome: 1 }).toArray();
          return res.status(200).json(docs);
        } catch (err) {
          console.error('[C_estoqueEmpresa] getAll:', err);
          return res.status(500).json({ message: 'Erro ao buscar estoque.' });
        }
      }

      if (req.query.type === 'getAbaixoMinimo') {
        try {
          const todos = await collection.find({ estoqueMinimo: { $gt: 0 } }).toArray();
          const abaixo = todos.filter((d: any) => d.quantidade < d.estoqueMinimo);
          return res.status(200).json(abaixo);
        } catch (err) {
          console.error('[C_estoqueEmpresa] getAbaixoMinimo:', err);
          return res.status(500).json({ message: 'Erro ao buscar estoque baixo.' });
        }
      }

      if (req.query.type === 'getLocais') {
        try {
          const docs = await locaisCol.find({}).sort({ nome: 1 }).toArray();
          return res.status(200).json(docs);
        } catch (err) {
          console.error('[C_estoqueEmpresa] getLocais:', err);
          return res.status(500).json({ message: 'Erro ao buscar locais.' });
        }
      }

      return res.status(400).json({ message: 'GET: type não identificado.' });
    }

    case 'POST': {
      if (req.query.type === 'adicionar') {
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          if (!body.nome?.trim()) return res.status(400).json({ message: 'Nome é obrigatório.' });

          const qtd = Number(body.quantidade) || 0;
          const local = body.local?.trim() || 'Geral';
          const locais: Record<string, number> = {};
          if (qtd > 0) locais[local] = qtd;

          const doc = {
            nome: body.nome.trim(),
            quantidade: qtd,
            locais,
            unidade: body.unidade || 'un',
            categoria: body.categoria || 'outros',
            estoqueMinimo: Number(body.estoqueMinimo) || 0,
            observacoes: body.observacoes || '',
            criadoPor: body.criadoPor ?? '',
            criadoPorNome: body.criadoPorNome ?? '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const result = await collection.insertOne(doc);

          if (qtd > 0) {
            await movCol.insertOne({
              itemId: result.insertedId.toString(),
              nomeItem: doc.nome,
              tipo: 'entrada',
              local,
              quantidade: qtd,
              saldoAnterior: 0,
              saldoNovo: qtd,
              observacoes: 'Estoque inicial',
              criadoPor: doc.criadoPor,
              criadoPorNome: doc.criadoPorNome,
              createdAt: doc.createdAt,
            });
          }

          return res.status(201).json({ id: result.insertedId.toString(), ...doc, _id: result.insertedId });
        } catch (err) {
          console.error('[C_estoqueEmpresa] adicionar:', err);
          return res.status(500).json({ message: 'Erro ao adicionar item.' });
        }
      }

      if (req.query.type === 'addLocal') {
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          if (!body.nome?.trim()) return res.status(400).json({ message: 'Nome do local é obrigatório.' });
          const existe = await locaisCol.findOne({ nome: body.nome.trim() });
          if (existe) return res.status(409).json({ message: 'Local já existe.' });
          const result = await locaisCol.insertOne({ nome: body.nome.trim(), createdAt: new Date().toISOString() });
          return res.status(201).json({ id: result.insertedId.toString(), nome: body.nome.trim() });
        } catch (err) {
          console.error('[C_estoqueEmpresa] addLocal:', err);
          return res.status(500).json({ message: 'Erro ao adicionar local.' });
        }
      }

      return res.status(400).json({ message: 'POST: type não identificado.' });
    }

    case 'PUT': {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ message: 'id obrigatório.' });

      if (req.query.type === 'atualizar') {
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const campos: Record<string, any> = { updatedAt: new Date().toISOString() };
          if (body.nome !== undefined) campos.nome = body.nome;
          if (body.unidade !== undefined) campos.unidade = body.unidade;
          if (body.categoria !== undefined) campos.categoria = body.categoria;
          if (body.estoqueMinimo !== undefined) campos.estoqueMinimo = Number(body.estoqueMinimo);
          if (body.observacoes !== undefined) campos.observacoes = body.observacoes;
          const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: campos });
          if (result.matchedCount === 0) return res.status(404).json({ message: 'Item não encontrado.' });
          return res.status(200).json({ message: 'Item atualizado.' });
        } catch (err) {
          console.error('[C_estoqueEmpresa] atualizar:', err);
          return res.status(500).json({ message: 'Erro ao atualizar item.' });
        }
      }

      if (req.query.type === 'entrada') {
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const qtd = Number(body.quantidade);
          const local = body.local?.trim() || 'Geral';
          if (!qtd || qtd <= 0) return res.status(400).json({ message: 'Quantidade deve ser maior que zero.' });

          const item = await collection.findOne({ _id: new ObjectId(id) });
          if (!item) return res.status(404).json({ message: 'Item não encontrado.' });

          const saldoLocalAnterior = (item.locais ?? {})[local] ?? 0;

          await collection.updateOne(
            { _id: new ObjectId(id) },
            {
              $inc: { quantidade: qtd, [`locais.${local}`]: qtd },
              $set: { updatedAt: new Date().toISOString() },
            }
          );

          await movCol.insertOne({
            itemId: id, nomeItem: item.nome, tipo: 'entrada', local, quantidade: qtd,
            saldoAnterior: item.quantidade, saldoNovo: item.quantidade + qtd,
            saldoLocalAnterior, saldoLocalNovo: saldoLocalAnterior + qtd,
            observacoes: body.observacoes ?? '', criadoPor: body.criadoPor ?? '',
            criadoPorNome: body.criadoPorNome ?? '', createdAt: new Date().toISOString(),
          });

          return res.status(200).json({ message: `Entrada de ${qtd} em ${local}.` });
        } catch (err) {
          console.error('[C_estoqueEmpresa] entrada:', err);
          return res.status(500).json({ message: 'Erro ao registrar entrada.' });
        }
      }

      if (req.query.type === 'saida') {
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const qtd = Number(body.quantidade);
          const local = body.local?.trim() || 'Geral';
          if (!qtd || qtd <= 0) return res.status(400).json({ message: 'Quantidade deve ser maior que zero.' });

          const item = await collection.findOne({ _id: new ObjectId(id) });
          if (!item) return res.status(404).json({ message: 'Item não encontrado.' });

          const saldoLocalAnterior = (item.locais ?? {})[local] ?? 0;

          await collection.updateOne(
            { _id: new ObjectId(id) },
            {
              $inc: { quantidade: -qtd, [`locais.${local}`]: -qtd },
              $set: { updatedAt: new Date().toISOString() },
            }
          );

          await movCol.insertOne({
            itemId: id, nomeItem: item.nome, tipo: 'saida', local, quantidade: qtd,
            saldoAnterior: item.quantidade, saldoNovo: item.quantidade - qtd,
            saldoLocalAnterior, saldoLocalNovo: saldoLocalAnterior - qtd,
            observacoes: body.observacoes ?? '', criadoPor: body.criadoPor ?? '',
            criadoPorNome: body.criadoPorNome ?? '', createdAt: new Date().toISOString(),
          });

          return res.status(200).json({ message: `Saída de ${qtd} de ${local}.` });
        } catch (err) {
          console.error('[C_estoqueEmpresa] saida:', err);
          return res.status(500).json({ message: 'Erro ao registrar saída.' });
        }
      }

      if (req.query.type === 'transferir') {
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const qtd = Number(body.quantidade);
          const origem = body.origem?.trim();
          const destino = body.destino?.trim();
          if (!qtd || qtd <= 0) return res.status(400).json({ message: 'Quantidade deve ser maior que zero.' });
          if (!origem || !destino) return res.status(400).json({ message: 'Origem e destino são obrigatórios.' });
          if (origem === destino) return res.status(400).json({ message: 'Origem e destino devem ser diferentes.' });

          const item = await collection.findOne({ _id: new ObjectId(id) });
          if (!item) return res.status(404).json({ message: 'Item não encontrado.' });

          const saldoOrigem = (item.locais ?? {})[origem] ?? 0;
          if (saldoOrigem < qtd) return res.status(400).json({ message: `Saldo insuficiente em ${origem} (${saldoOrigem}).` });

          await collection.updateOne(
            { _id: new ObjectId(id) },
            {
              $inc: { [`locais.${origem}`]: -qtd, [`locais.${destino}`]: qtd },
              $set: { updatedAt: new Date().toISOString() },
            }
          );

          const now = new Date().toISOString();
          await movCol.insertOne({
            itemId: id, nomeItem: item.nome, tipo: 'transferencia',
            local: `${origem} → ${destino}`, quantidade: qtd,
            saldoAnterior: item.quantidade, saldoNovo: item.quantidade,
            observacoes: body.observacoes ?? '', criadoPor: body.criadoPor ?? '',
            criadoPorNome: body.criadoPorNome ?? '', createdAt: now,
          });

          return res.status(200).json({ message: `${qtd} transferido de ${origem} para ${destino}.` });
        } catch (err) {
          console.error('[C_estoqueEmpresa] transferir:', err);
          return res.status(500).json({ message: 'Erro ao transferir.' });
        }
      }

      if (req.query.type === 'historico') {
        try {
          const docs = await movCol.find({ itemId: id }).sort({ createdAt: -1 }).limit(100).toArray();
          return res.status(200).json(docs);
        } catch (err) {
          console.error('[C_estoqueEmpresa] historico:', err);
          return res.status(500).json({ message: 'Erro ao buscar histórico.' });
        }
      }

      return res.status(400).json({ message: 'PUT: type não identificado.' });
    }

    case 'DELETE': {
      if (req.query.type === 'excluir' && req.query.id) {
        try {
          const result = await collection.deleteOne({ _id: new ObjectId(req.query.id as string) });
          if (result.deletedCount === 0) return res.status(404).json({ message: 'Item não encontrado.' });
          return res.status(200).json({ message: 'Item excluído.' });
        } catch (err) {
          console.error('[C_estoqueEmpresa] excluir:', err);
          return res.status(500).json({ message: 'Erro ao excluir item.' });
        }
      }

      if (req.query.type === 'removeLocal' && req.query.id) {
        try {
          await locaisCol.deleteOne({ _id: new ObjectId(req.query.id as string) });
          return res.status(200).json({ message: 'Local removido.' });
        } catch (err) {
          console.error('[C_estoqueEmpresa] removeLocal:', err);
          return res.status(500).json({ message: 'Erro ao remover local.' });
        }
      }

      return res.status(400).json({ message: 'DELETE: type não identificado.' });
    }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ message: `Método ${req.method} não permitido.` });
  }
}
