import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { Collection, ObjectId } from 'mongodb'
import { formatDateBR, getCurrentDateTime } from '@/utils/Functions';
import { Comunicado } from '@/types/Comunicado';

export default async function handler(req: NextApiRequest, res: NextApiResponse,) {

  const { db } = await connect();
  const mainCollection: Collection = db.collection('comunicados')
  const { type } = req.query
  const nameCollection = 'Comunicado'

  switch (req.method) {
    case 'GET':

      // -------------------------
      // GET All 
      // -------------------------

      if (type === 'getAll') {
        try {
          const documents = await mainCollection.find().sort({ ano: -1, numero: -1 }).toArray();
          return res.status(200).json(documents);
        } catch (err) {
          console.error(err)
          return res.status(500).json({ message: `type: ${type}: Erro não identificado. Procure um administrador.` });
        }
      }

      // -------------------------
      // GET by ID
      // -------------------------

      else if (type === 'getID' && req.query.id) {
        const reqID = req.query.id as string
        try {
          const result = await mainCollection.findOne({ _id: new ObjectId(reqID) },)

          if (!result) {
            return res.status(404).json({ message: 'Residente não encontrado', id: reqID, method: 'GET' });
          }

          return res.status(200).json({ result, message: 'Residente Localizado', method: 'GET' });

        } catch (error) {
          console.error(error)

          return res.status(500).json({ message: `type: ${type}: Erro não identificado. Procure um administrador.` });
        }
      }

      // -------------------------
      // CONTAR DOCUMENTOS
      // -------------------------

      else if (type == 'countNaoLidosPeloUsuario') {
        const { userId } = req.query

        try {
          const unreadCount = await mainCollection.countDocuments({
            "readers.userId": { $ne: userId }
          });

          return res.status(200).json({ count: unreadCount });
        } catch (err) {

          return res.status(500).json({ message: `type: ${type}: Erro não identificado. Procure um administrador.` });
        }
      }

      else if (type == 'countDocuments') {
        try {
          const totalDocuments = await mainCollection.countDocuments();
          return res.status(200).json({ count: totalDocuments });
        } catch (err) {

          return res.status(500).json({ message: `type: ${type}: Erro não identificado. Procure um administrador.` });
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

      if (type == 'create') {
        try {
          const { title, description, createdBy, creatorName }: Comunicado = req.body
          const date = getCurrentDateTime()
          const dados = { userId: createdBy, date }
          const dataFields: any = {
            title,
            description,
            createdBy,
            creatorName,

            readers: [dados],

            createdAt: getCurrentDateTime(),
            updatedAt: getCurrentDateTime(),
          }

          // Verifica se todos os campos necessários estão presentes no req.body
          const requiredFields: (keyof Comunicado)[] = ['title', 'description', 'createdBy', 'creatorName'];
          const missingFields = requiredFields.filter((field) => !dataFields[field]);
          if (missingFields.length > 0) {
            return res.status(400).json({ message: `Campos obrigatórios ausentes: ${missingFields.join(', ')}` });
          }

          const novoRegitro = await mainCollection.insertOne(dataFields as any);
          return res.status(201).json({ message: 'OK', id: novoRegitro.insertedId, method: 'POST' });

        } catch (err) {
          console.error(err)

          return res.status(500).json({ message: `type ${type}: Erro não identificado. Procure um administrador.` });
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

      if (type == 'confirmarLeitura') {
        try {
          const { comunicadoId, userId } = req.body

          // Verifica se o usuário já existe na lista de leitores
          const existingReader = await mainCollection.findOne({
            _id: new ObjectId(comunicadoId),
            'readers.userId': userId
          });

          if (existingReader) {
            return res.status(201).json({ message: 'OK', id: 'Usuário já confirmou a leitura anteriormente.', method: 'POST' });
          }


          const dados = { userId: userId, date: getCurrentDateTime() }
          const confirma = await mainCollection.updateOne(
            { _id: new ObjectId(comunicadoId) },
            { $push: { readers: dados } },
          )
          return res.status(201).json({ message: 'OK', id: confirma, method: 'POST' });
        } catch (error) {
          return res.status(500).json({ message: `type ${type}: Erro não identificado. Procure um administrador.` });
        }
      }

      break;

    // -------------------------
    // EXCLUI UM USUÁRIO
    // -------------------------

    case 'DELETE':

      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }


}