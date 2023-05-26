import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb'
import { formatDateBR } from '@/utils/Functions';

export default async function handler(req: NextApiRequest, res: NextApiResponse,) {

  const { db, client } = await connect();
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

    console.log("OI")

      // -------------------------
      // GET All Residentes
      // -------------------------

      if (req.query.type === 'getAll') {
        try {
          const documents = await mainCollection.find().sort({ nome: 1 }).toArray();
          return res.status(200).json(documents);
        } catch (err) {
          console.log(err)
          await client.close()
          return res.status(500).json({ message: 'getAll: Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // GET Residente by ID
      // -------------------------

      if (req.query.type === 'getID' && req.query.id) {
        console.log("TESTE")
        const reqID = req.query.id as string
        try {
          const result = await mainCollection.findOne({ _id: new ObjectId(reqID) },)

          if (!result) {
            return res.status(404).json({ message: 'Residente não encontrado', id: reqID, method: 'GET' });
          }

          return res.status(200).json({ result, message: 'Residente Localizado', method: 'GET' });

        } catch (error) {
          await client.close();
          return res.status(500).json({ message: 'getID: Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // CONTAR DOCUMENTOS
      // -------------------------

      else if (req.query.type == 'countDocuments') {
        try {
          const totalDocuments = await mainCollection.countDocuments();
          res.status(200).json({ count: totalDocuments });
        } catch (err) {
          await client.close();
          res.status(500).json({ message: 'countDocuments: Erro não identificado. Procure um administrador.' });
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
          console.log(err)
          await client.close();
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
      // CRIAR NOVO RESIDENTE
      // -------------------------

      if (req.query.type == 'new') {
        try {
          const parsedData = JSON.parse(req.body)

          const dataFields = {
            apelido: parsedData.apelido,
            cpf: parsedData.cpf,
            data_entrada: parsedData.data_entrada,
            data_nascimento: parsedData.data_nascimento,
            genero: parsedData.genero,
            informacoes: parsedData.informacoes,
            nome: parsedData.nome,

            is_ativo: "S",
            instituicao_id: 1,
            createdAt: formatDateBR(Date.now()),
            updatedAt: formatDateBR(Date.now()),
          }

          const isUser = await mainCollection.findOne({ cpf: dataFields.cpf })
          if (isUser) {
            return res.status(400).json({ message: `CPF Já cadastrado: ${dataFields.cpf} na data ${dataFields.createdAt}.`, method: 'POST', });
          }

          const novoRegitro = await mainCollection.insertOne(dataFields);
          return res.status(201).json({ id: novoRegitro.insertedId, method: 'POST' });
        } catch (err) {
          console.log(err)
          await client.close();
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
        console.log("##################### LINHA #####################")
        console.log(req.query.id)
        console.log(req.body)
        console.log("##################### LINHA #####################")
        const myObjectId = new ObjectId(req.query.id as unknown as ObjectId);
        const myBody = JSON.parse(req.body)
        await mainCollection.updateOne({ _id: myObjectId }, { $set: myBody },);
        return res.status(201).json({ message: 'Dados do sinal vital alterados com sucesso!', method: 'PUT', url: `SinaisVitaisControllerid=${req.query.id}` });

      } catch (err) {
        await client.close();
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
        await client.close();
        return res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  await client.close();
}