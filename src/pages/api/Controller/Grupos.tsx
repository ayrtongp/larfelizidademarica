import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb'
import { getCurrentDateTime } from '@/utils/Functions';

export default async function handler(req: NextApiRequest, res: NextApiResponse,) {

  const { db } = await connect();
  const mainCollection = db.collection('grupos')

  switch (req.method) {
    case 'GET':

      // -------------------------
      // GET All 
      // -------------------------

      if (req.query.type === 'getAll') {
        try {
          const documents = await mainCollection.find().sort({ nome_grupo: 1 }).toArray();
          return res.status(200).json(documents);
        } catch (err) {
          console.error(err)
          return res.status(500).json({ message: 'getAll: Erro não identificado. Procure um administrador.' });
        }
      }
      // -------------------------
      // GET KEY
      // -------------------------

      else if (req.query.type === 'getKey') {
        try {
          const { cod_categoria } = req.query
          const documents = await mainCollection.find({ cod_categoria: cod_categoria }).sort({ nome_insumo: 1 }).toArray();
          return res.status(200).json(documents);
        } catch (err) {
          console.error(err)
          return res.status(500).json({ message: 'getCategoria: Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // GET by ID
      // -------------------------

      else if (req.query.type === 'getID' && req.query.id) {
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

      if (req.query.type == 'new') {
        try {
          const data = JSON.parse(req.body)

          const dataFields = {
            cod_grupo: data['cod_grupo'],
            nome_grupo: data['nome_grupo'],
            descricao: data['descricao'],
            createdAt: getCurrentDateTime(),
            updatedAt: getCurrentDateTime(),
          }

          // Verifica se todos os campos necessários estão presentes no req.body
          const requiredFields = ['cod_grupo', 'nome_grupo', 'descricao'];
          const missingFields = requiredFields.filter(field => !data[field]);
          const alreadyExists = await mainCollection.findOne({ cod_grupo: dataFields.cod_grupo })

          if (missingFields.length > 0) {
            return res.status(400).json({ error: `Campos obrigatórios ausentes: ${missingFields.join(', ')}` });
          }
          else if (alreadyExists) {
            return res.status(400).json({ message: `Grupo já cadastrado: ${dataFields.cod_grupo} na data ${alreadyExists.createdAt}.`, method: 'POST', });
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