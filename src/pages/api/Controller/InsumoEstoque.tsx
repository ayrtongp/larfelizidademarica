import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb'
import { formatDateBR, getCurrentDateTime } from '@/utils/Functions';

export default async function handler(req: NextApiRequest, res: NextApiResponse,) {

  const { db } = await connect();
  const mainCollection = db.collection('insumo_estoque')

  switch (req.method) {
    case 'GET':

      // -------------------------
      // GET All 
      // -------------------------

      if (req.query.type === 'getAll') {
        try {
          const documents = await mainCollection.find().sort({ nome_categoria: 1 }).toArray();
          return res.status(200).json(documents);
        } catch (err) {
          console.error(err)
          return res.status(500).json({ message: 'getAll: Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // GET Residente by ID
      // -------------------------

      if (req.query.type === 'getID' && req.query.id) {
        const reqID = req.query.id as string
        try {
          const result = await mainCollection.findOne({ _id: new ObjectId(reqID) },)

          if (!result) {
            return res.status(404).json({ message: 'Residente não encontrado', id: reqID, method: 'GET' });
          }

          return res.status(200).json({ result, message: 'Residente Localizado', method: 'GET' });

        } catch (error) {
          console.error(error)

          return res.status(500).json({ message: 'getID: Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // CONTAR DOCUMENTOS
      // -------------------------

      else if (req.query.type == 'countDocuments') {
        try {
          const totalDocuments = await mainCollection.countDocuments();
          return res.status(200).json({ count: totalDocuments });
        } catch (err) {

          return res.status(500).json({ message: 'countDocuments: Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // LISTAR PAGINADO
      // -------------------------

      else if (req.query.type == 'pages') {
        try {
          const skip = parseInt(req.query.skip as unknown as string)
          const limit = parseInt(req.query.limit as unknown as string)
          const data = await mainCollection.find().sort({ data: -1 }).skip(skip).limit(limit).toArray();

          return res.status(200).json({ data: data });
        } catch (err) {
          console.error(err)

          return res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // getInsumoResidenteLimit
      // -------------------------

      else if (req.query.type == 'getInsumoResidenteLimit') {
        try {
          const page = parseInt(req.query.page as unknown as string)
          const limit = parseInt(req.query.limit as unknown as string)
          const skip = (page - 1) * limit;
          const data = await mainCollection.aggregate([
            { $match: { residente_id: new ObjectId("6475443e621d1604edb0c4c3") } },
            { $group: { _id: "$insumo_id", soma: { $sum: "$quantidade" } } },
            {
              $lookup: {
                from: "Insumos",
                let: { grupoId: "$_id" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$grupoId"] } } },
                  { $project: { unidade: 1, nome: 1 } }
                ],
                as: "insumoDetails"
              }
            },
            { $unwind: "$insumoDetails" },
            { $project: { _id: 1, soma: 1, "insumoDetails.unidade": 1, "insumoDetails.nome": 1 } }
          ]).toArray();

          return res.status(200).json(data);
        } catch (err) {
          console.error(err)

          return res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
        }
      }

      else if (req.query.type == 'getListaInsumosResidente') {
        try {
          const data = await mainCollection.aggregate([
            { $match: { residente_id: req.query.idResidente } },
            { $lookup: { from: "insumos", let: { insumoId: "$insumo_id" }, pipeline: [{ $addFields: { convertedId: { $toString: "$_id" } } }, { $match: { $expr: { $eq: ["$convertedId", "$$insumoId"] } } },], as: "insumoDetails" } },
            { $unwind: "$insumoDetails" },
            { $project: { insumo_id: "$insumo_id", quantidade: "$quantidade", unidade: "$insumoDetails.unidade", nome_insumo: "$insumoDetails.nome_insumo", cod_categoria: "$insumoDetails.cod_categoria", } },
            { $group: { _id: "$insumo_id", soma: { $sum: "$quantidade" }, unidade: { $first: "$unidade" }, nome_insumo: { $first: "$nome_insumo" }, cod_categoria: { $first: "$cod_categoria" }, } }
          ]).sort({ cod_categoria: 1, nome_insumo: 1 }).toArray();
          return res.status(200).json(data);
        } catch (err) {
          console.error(err)
          return res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
        }
      }

      else if (req.query.type == 'getHistoricoPaginado') {
        try {
          const page = parseInt(req.query.page as unknown as string) || 1
          const limit = parseInt(req.query.limit as unknown as string) || 10
          const skip = (page - 1) * limit;
          const residenteId = req.query.residenteId
          const data = await mainCollection.aggregate([
            { $match: { residente_id: req.query.residenteId } },
            { $lookup: { from: "insumos", let: { insumoId: "$insumo_id" }, pipeline: [{ $addFields: { convertedId: { $toString: "$_id" } } }, { $match: { $expr: { $eq: ["$convertedId", "$$insumoId"] } } },], as: "insumoDetails" } },
            { $unwind: "$insumoDetails" },
            { $project: { insumo_id: "$insumo_id", quantidade: "$quantidade", unidade: "$insumoDetails.unidade", nome_insumo: "$insumoDetails.nome_insumo", cod_categoria: "$insumoDetails.cod_categoria", createdAt: 1, nomeUsuario: 1, idUsuario: 1, observacoes: 1 } },
          ]).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();
          const count = await mainCollection.countDocuments({ residente_id: residenteId })

          return res.status(200).json({ data, count });
        } catch (err) {
          console.error(err)
          return res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // SE NENHUMA CONDIÇÃR BATER DEVE RETORNAR ERRO
      // -------------------------

      else {
        return res.status(500).json({ message: 'GET Não encontrou nenhuma condição (IF)' });
      }

      break;

    case 'POST':

      // -------------------------
      // CRIAR NOVO 
      // -------------------------

      if (req.query.type == 'addFraldaResidente') {
        try {
          const data = req.body
          const dataFields = {
            insumo_id: data['insumo_id'],
            quantidade: data['quantidade'],
            residente_id: data['residente_id'],
            observacoes: data['observacoes'],
            nomeUsuario: data['nomeUsuario'],
            idUsuario: data['idUsuario'],
            createdAt: getCurrentDateTime(),
            updatedAt: getCurrentDateTime(),
          }
          // Verifica se todos os campos necessários estão presentes no req.body
          const requiredFields = ['insumo_id', 'quantidade', 'residente_id'];
          const missingFields = requiredFields.filter(field => !data[field]);

          if (missingFields.length > 0) {
            return res.status(400).json({ error: `Campos obrigatórios ausentes: ${missingFields.join(', ')}` });
          }
          else {
            const novoRegitro = await mainCollection.insertOne(dataFields);
            return res.status(201).json({ id: novoRegitro.insertedId, method: 'POST' });
          }
        } catch (err) {
          console.error(err)

          return res.status(500).json({ message: 'new: Erro não identificado. Procure um administrador.' });
        }
      }

      else {
        return res.status(400).json({ message: `Nenhum query.type indetificado`, method: 'POST', });
      }
      break;

    // -------------------------
    // ALTERA USUÁRIO | FOTO | SENHA | TUDO
    // -------------------------

    case 'PUT':
      try {
        const myObjectId = new ObjectId(req.query.id as unknown as ObjectId);
        const bodyObject = JSON.parse(req.body)

        if (req.query.type === 'changePhoto' && bodyObject.foto_base64) {
          const novaFoto = bodyObject.foto_base64
          await mainCollection.updateOne({ _id: myObjectId }, { $set: { foto_base64: novaFoto } },);
          return res.status(201).json({ message: 'Foto do usuário alterada com sucesso!', method: 'PUT', url: `ResidentesController?type=${req.query.tipo}&id=${req.query.id}` });
        }

        else if (req.query.type === 'changeData') {
          const myBody = JSON.parse(req.body)
          await mainCollection.updateOne({ _id: myObjectId }, { $set: myBody },);
          return res.status(201).json({ message: 'Dados do sinal vital alterados com sucesso!', method: 'PUT', url: `SinaisVitaisControllerid=${req.query.id}` });
        }

        else {
          return res.status(404).json({ message: 'Residente não encontrado!', });
        }

      } catch (err) {
        return res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
      }
      break;

    // -------------------------
    // EXCLUI UM USUÁRIO
    // -------------------------

    case 'DELETE':
      try {
        const myObjectId = new ObjectId(req.query.id as unknown as ObjectId);
        const url = `SinaisVitaisController?id=${req.query.id}`
        const result = await mainCollection.deleteOne({ _id: myObjectId });

        if (result.deletedCount === 0) {
          return res.status(404).json({ message: 'Residente não encontrado!', });
        }

        return res.status(201).json({ message: 'Residente deletado com sucesso', method: 'DELETE' });
      } catch (err) {

        return res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }


}