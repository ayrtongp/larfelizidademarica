import { NextApiRequest, NextApiResponse } from "next";
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb'


export default async function handler(req: NextApiRequest, res: NextApiResponse,) {

  const { db } = await connect();
  const mainCollection = db.collection('residentes')

  switch (req.method) {

    case 'GET':

      // -------------------------
      // VERIFICA SE NÃO HOUVERAM SINAIS VITAIS CADASTRADOS NA DATA INFORMADA
      // -------------------------

      if (req.query.type = "listNotSinaisToday") {

        try {

          const date = req.query.searchDate as string

          const regex = new RegExp(date, "i");

          const result = await mainCollection.aggregate([
            { $addFields: { residente_id: { $toString: "$_id", }, }, },
            {
              $lookup: {
                from: "sinaisvitais",
                localField: "residente_id",
                foreignField: "residente_id",
                as: "result",
              },
            },
            {
              $match: {
                $or: [
                  { "result": { $eq: [] } },
                  { "result": { $not: { $elemMatch: { createdAt: regex } } } }
                ]
              },
            },
            { $project: { "nome": 1, "foto_base64": 1,}, },
          ])
          .sort({nome: 1})  
          .toArray()

          return res.status(200).json({ data: result })
        } catch (error) {
          return res.status(400).json({ error: "reached CATCH, contact the admin." })
        }
      }

      break;
  }

}