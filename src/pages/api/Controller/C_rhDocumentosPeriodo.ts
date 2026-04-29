import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const collection = db.collection('rh_documentos_periodo');

  switch (req.method) {

    case 'GET': {
      if (req.query.type === 'getByFuncionario') {
        try {
          const { funcionarioId, tipo, mes, ano } = req.query;
          if (!funcionarioId || !tipo) return res.status(400).json({ error: 'funcionarioId e tipo são obrigatórios' });

          const filter: any = { funcionarioId: String(funcionarioId), tipo: String(tipo) };
          if (mes) filter['periodo.mes'] = Number(mes);
          if (ano) filter['periodo.ano'] = Number(ano);

          const docs = await collection.find(filter).sort({ 'periodo.ano': -1, 'periodo.mes': -1 }).toArray();
          return res.status(200).json(docs);
        } catch {
          return res.status(500).json({ error: 'Erro ao buscar documentos' });
        }
      }
      return res.status(400).json({ error: 'type inválido' });
    }

    case 'POST': {
      if (req.query.type === 'new') {
        try {
          const body = req.body;
          const { funcionarioId, tipo, periodo, cloudURL, filename, cloudFilename, size, format, uploadedBy, uploadedByNome, funcionarioNome } = body;
          if (!funcionarioId || !tipo || !periodo?.mes || !periodo?.ano || !cloudURL) {
            return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
          }

          const existente = await collection.findOne({ funcionarioId, tipo, 'periodo.mes': periodo.mes, 'periodo.ano': periodo.ano });
          if (existente) {
            await collection.deleteOne({ _id: existente._id });
          }

          const doc = {
            tipo, funcionarioId, funcionarioNome: funcionarioNome || '',
            periodo: { mes: Number(periodo.mes), ano: Number(periodo.ano) },
            cloudURL, filename, cloudFilename, size, format,
            descricao: body.descricao || '',
            uploadedBy, uploadedByNome,
            createdAt: new Date().toISOString(),
          };
          const result = await collection.insertOne(doc);
          return res.status(201).json({ ...doc, _id: result.insertedId });
        } catch {
          return res.status(500).json({ error: 'Erro ao salvar documento' });
        }
      }
      return res.status(400).json({ error: 'type inválido' });
    }

    case 'DELETE': {
      if (req.query.type === 'delete') {
        try {
          const id = req.query.id as string;
          if (!id) return res.status(400).json({ error: 'id obrigatório' });
          await collection.deleteOne({ _id: new ObjectId(id) });
          return res.status(200).json({ ok: true });
        } catch {
          return res.status(500).json({ error: 'Erro ao remover documento' });
        }
      }
      return res.status(400).json({ error: 'type inválido' });
    }

    default:
      return res.status(405).json({ error: 'Método não permitido' });
  }
}
