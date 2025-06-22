import connect from '../../../utils/Database';
import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb'

// ##################################################################################################
// ##################################################################################################
// ##################################################################################################

export async function getAll(collectionName: string, req: NextApiRequest, res: NextApiResponse,) {

  const { db } = await connect();
  const mainCollection = db.collection(collectionName)

  try {

    const documents = await mainCollection.find().toArray();
    return res.status(200).json(documents);

  } catch (err) {
    console.error(err)
    return res.status(500).json({ method: `GET/getAll`, message: 'Erro não identificado. Procure um administrador.' });
  }
}

// ##################################################################################################
// ##################################################################################################
// ##################################################################################################

export async function getById(collectionName: string, req: NextApiRequest, res: NextApiResponse,) {

  const { db } = await connect();
  const mainCollection = db.collection(collectionName)
  const reqID = req.query.id as string

  try {
    const result = await mainCollection.findOne({ _id: new ObjectId(reqID) },)

    if (!result) {
      return res.status(404).json({ message: 'Residente não encontrado', id: reqID, method: 'GET' });
    }

    return res.status(200).json({ result, message: 'Residente Localizado', method: 'GET' });

  } catch (error) {
    console.error(error)

    return res.status(500).json({ method: `GET/getById`, message: 'Erro não identificado. Procure um administrador.' });
  }
}