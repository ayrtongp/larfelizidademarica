import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb';
import { getCurrentDateTime } from '@/utils/Functions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const mainCollection = db.collection('evolucao');

  if (req.method === 'GET') {
    switch (req.query.type) {
      case 'getAll':
        return await getAll(req, res, mainCollection);
      case 'getLast50':
        return await getLast50(req, res, mainCollection);
      case 'report':
        return await getReport(req, res, mainCollection);
      case 'pages':
        return await getPages(req, res, mainCollection);
      case 'getById':
        return await getById(req, res, mainCollection);
      case 'getBetweenDates':
        return await getBetweenDates(req, res, mainCollection);
      case 'countDocuments':
        return await countDocuments(req, res, mainCollection);
      case 'getLast':
        if (req.query.residenteId) {
          return await getLast(req, res, mainCollection);
        }
        break;
      default:
        return res.status(400).json({ message: 'Tipo de requisição GET não suportado.' });
    }
  }

  else if (req.method === 'POST') {
    if (req.query.type === 'new') {
      return await createNew(req, res, mainCollection);
    }
    return res.status(400).json({ message: 'Tipo de requisição POST não suportado.' });
  }

  else {
    return res.status(405).json({ message: 'Método não permitido.' });
  }
}

async function getAll(req: NextApiRequest, res: NextApiResponse, mainCollection: any) {
  try {
    const documents = await mainCollection.find().sort().toArray();
    return res.status(200).json(documents);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'getAll: Erro não identificado. Procure um administrador.' });
  }
}

async function getLast50(req: NextApiRequest, res: NextApiResponse, mainCollection: any) {
  try {
    const skip = parseInt(req.query.skip as string);
    const limit = parseInt(req.query.limit as string);
    const documents = await mainCollection.find().sort({ $natural: -1 }).skip(skip).limit(limit).toArray();
    const count = await mainCollection.countDocuments();
    return res.status(200).json({ count, data: documents });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'getLast50: Erro não identificado. Procure um administrador.' });
  }
}

async function getReport(req: NextApiRequest, res: NextApiResponse, mainCollection: any) {
  const dataInicio = (req.query.dataInicio as string).split(",")[0];
  const dataFim = (req.query.dataFim as string).split(",")[0];
  const documents = await mainCollection.find({
    residente_id: req.query.id,
    createdAt: {
      $gte: dataInicio,
      $lte: dataFim,
    }
  }).toArray();
  return res.status(200).json(documents);
}

async function getPages(req: NextApiRequest, res: NextApiResponse, mainCollection: any) {
  try {
    const skip = parseInt(req.query.skip as string);
    const limit = parseInt(req.query.limit as string);

    if (req.query.residente_id) {
      const residente_id = req.query.residente_id as string;
      const data = await mainCollection.find({ residente_id }).sort({ dataEvolucao: -1 }).skip(skip).limit(limit).toArray();
      const count = await mainCollection.countDocuments({ residente_id });
      return res.status(200).json({ count, data });
    }

    const data = await mainCollection.find().sort({ data: -1 }).skip(skip).limit(limit).toArray();
    return res.status(200).json({ data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'pages: Erro não identificado. Procure um administrador.' });
  }
}

async function getById(req: NextApiRequest, res: NextApiResponse, mainCollection: any) {
  const reqID = req.query.id as string;
  try {
    const result = await mainCollection.findOne({ _id: new ObjectId(reqID) });
    if (!result) {
      return res.status(404).json({ message: 'Residente não encontrado', id: reqID, method: 'GET' });
    }
    return res.status(200).json({ result, message: 'Residente Localizado', method: 'GET' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'getById: Erro não identificado. Procure um administrador.' });
  }
}

async function getBetweenDates(req: NextApiRequest, res: NextApiResponse, mainCollection: any) {
  const dataInicio = (req.query.dataInicio as string).split(",")[0];
  const dataFim = (req.query.dataFim as string).split(",")[0];
  const documents = await mainCollection.find({
    createdAt: {
      $gte: dataInicio,
      $lte: dataFim,
    }
  }).toArray();
  return res.status(200).json(documents);
}

async function countDocuments(req: NextApiRequest, res: NextApiResponse, mainCollection: any) {
  try {
    const totalDocuments = await mainCollection.countDocuments();
    return res.status(200).json({ count: totalDocuments });
  } catch (err) {
    return res.status(500).json({ message: 'countDocuments: Erro não identificado. Procure um administrador.' });
  }
}

async function getLast(req: NextApiRequest, res: NextApiResponse, mainCollection: any) {
  const residente_id = req.query.residenteId as string;
  const documents = await mainCollection.findOne({ residente_id }, { sort: { updatedAt: -1 } });
  return res.status(200).json(documents);
}

async function createNew(req: NextApiRequest, res: NextApiResponse, mainCollection: any) {
  const novoRegistro = JSON.parse(req.body);
  const dataFields = {
    categoria: novoRegistro.categoria,
    dataEvolucao: novoRegistro.dataEvolucao,
    descricao: novoRegistro.descricao,
    area: novoRegistro.area,
    residente_id: novoRegistro.residente_id,
    usuario_id: novoRegistro.usuario_id,
    usuario_nome: novoRegistro.usuario_nome,
    createdAt: getCurrentDateTime(),
    updatedAt: getCurrentDateTime(),
  };

  let keey = "";
  const areAllFieldsFilled = (obj: any) => {
    for (let key in obj) {
      if (key !== "observacoes" && (!obj[key] || obj[key].toString().trim() === "")) {
        keey += ` ${key}, `;
        return false;
      }
    }
    return true;
  };

  if (!areAllFieldsFilled(dataFields)) {
    return res.status(400).json({ message: `Faltam campos para serem preenchidos. ${keey}`, method: 'POST', url: `SinaisVitaisController` });
  }

  const novaEvolucao = await mainCollection.insertOne(dataFields);
  return res.status(201).json({ id: novaEvolucao.insertedId, message: "Dado Inserido.", method: 'POST' });
}

