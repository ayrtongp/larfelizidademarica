import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';


export default async function handler(req: NextApiRequest, res: NextApiResponse,) {

  const { db } = await connect();
  const mainCollection = db.collection('usuario_permissao')


  switch (req.method) {

    case 'POST':
      // -------------------------
      // CADASTRO DE PERMISSOES
      // -------------------------

      // idosos: 1, sinaisVitais: 2, livroOcorrencias: 3, insumos: 4,

      if (req.query.tipo === 'register' && req.query.tipo_permissao === 'portal_servicos') {
        const userId = req.query.id
        const { idosos, sinaisVitais, livroOcorrencias, insumos, residentes } = JSON.parse(req.body);
        const toInsert = [];

        if (idosos) { toInsert.push({ usuario_id: userId, tipo_permissao: "portal_servicos", id_servico: "1" }); }

        if (sinaisVitais) { toInsert.push({ usuario_id: userId, tipo_permissao: "portal_servicos", id_servico: "2" }); }

        if (livroOcorrencias) { toInsert.push({ usuario_id: userId, tipo_permissao: "portal_servicos", id_servico: "3" }); }

        if (insumos) { toInsert.push({ usuario_id: userId, tipo_permissao: "portal_servicos", id_servico: "4" }); }

        if (residentes) { toInsert.push({ usuario_id: userId, tipo_permissao: "portal_servicos", id_servico: "6" }); }

        if (toInsert.length > 0) {
          const insertedDocuments = await mainCollection.insertMany(toInsert);
          return res.status(201).json({ message: 'Categorias Registradas', method: 'POST' });
        } else {
          return res.status(201).json({ message: 'Nenhuma categoria registrada', method: 'POST' });
        }
      }

      // -------------------------
      // Busca as permissoes para o usuario
      // -------------------------

      try {
        const { id, tipo_permissao } = req.body
        const response = await mainCollection.aggregate([
          { $match: { usuario_id: `${id}`, }, },
          { $lookup: { from: "portal_servicos", localField: "id_servico", foreignField: "id_servico", as: "portal_servicos", }, },
          { $unwind: '$portal_servicos' },
          { $project: { _id: 1, "portal_servicos.nome": 1, "portal_servicos.href": 1 } }
        ]).toArray();

        return res.status(200).json({ message: "ok", response });

      }
      catch (error) {
        return res.status(500).json({ message: "Ocorreu um erro ao realizar o login", error: error });
      }
      break;

    default:
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}