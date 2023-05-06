import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export default async function handler(req: NextApiRequest, res: NextApiResponse,) {

  const { db, client } = await connect();
  const mainCollection = db.collection('usuario_permissao')

  switch (req.method) {

    case 'POST':

      // -------------------------
      // Realizar o LOGIN
      // -------------------------

      try {
        const { id, tipo_permissao } = req.body
        const response = await mainCollection.aggregate([
          { $match: { usuario_id: `${id}`, }, },
          { $lookup: { from: "portal_servicos", localField: "id_servico", foreignField: "id_servico", as: "portal_servicos", }, },
          { $unwind: '$portal_servicos' },
          { $project: { _id: 1, "portal_servicos.nome": 1, "portal_servicos.href": 1 } }
        ]).toArray();

        res.status(200).json({ message: "ok", response });

      }
      catch (error) {
        res.status(500).json({ message: "Ocorreu um erro ao realizar o login", error: error });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  await client.close();
}