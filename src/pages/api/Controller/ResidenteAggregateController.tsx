import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb'
import { formatDateBR } from '@/utils/Functions';

export default async function handler(req: NextApiRequest, res: NextApiResponse,) {

  const { db } = await connect();
  const mainCollection = db.collection('residentes')

  // ###################################
  // ###################################
  // ###################################

  // ########## METHODS ##########

  // 1 - GET All Residentes
  // 2 - GET Count Residentes
  // 2 - GET Residente ID

  // ###################################
  // ###################################
  // ###################################

  switch (req.method) {

    case 'GET':

      try {

        // -------------------------
        // JOIN - SINAIS VITAIS 
        // JOIN - ANOTAÇÕES ENFERMAGEM
        // GET LAST INDEX 
        // -------------------------

        if (req.query.type == "getTable") {
          const result = await mainCollection.aggregate([
            { $match: { is_ativo: "S" } },
            { $addFields: { residente_id: { $toString: "$_id", }, }, },
            { $lookup: { from: "sinaisvitais", localField: "residente_id", foreignField: "residente_id", as: "result", }, },
            { $addFields: { lastEntrySinais: { $arrayElemAt: ["$result", { $subtract: [{ $size: "$result" }, 1] }] } } },
            { $lookup: { from: "anotacoesenfermagem", localField: "residente_id", foreignField: "residente_id", as: "result2", }, },
            { $addFields: { lastEntryAnotacoes: { $arrayElemAt: ["$result2", { $subtract: [{ $size: "$result2" }, 1] }] } } },
            { $project: { _id: 1, nome: 1, foto_base64: 1, "lastEntrySinais.createdAt": 1, "lastEntrySinais.usuario_nome": 1, "lastEntryAnotacoes.data": 1, "lastEntryAnotacoes.usuario_nome": 1, } }
          ]).sort({ nome: 1 }).toArray()

          return res.status(200).json(result);
        }

      } catch (error) {

      }

      break;

    case 'POST':

      break;

    case 'PUT':

      break;

    case 'DELETE':

      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }


}