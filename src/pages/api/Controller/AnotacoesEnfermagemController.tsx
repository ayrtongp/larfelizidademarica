import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb'
import { formatDateBR, getCurrentDateTime } from '@/utils/Functions';

export default async function handler(req: NextApiRequest, res: NextApiResponse,) {

  const { db } = await connect();
  const mainCollection = db.collection('anotacoesenfermagem')

  switch (req.method) {

    case 'GET':

      // -------------------------
      // LISTAR TODOS
      // -------------------------

      if (req.query.type == 'listAll') {
        try {
          const listAll = await mainCollection.find({},).toArray();
          const message = "Listagem de todas as Anotações de Enfermagem"
          const url = `AnotacoesEnfermagemController`
          return res.status(200).json({ listAll, message: message, url: url });
        } catch (err) {
          return res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // BUSCAR APENAS UM RESULTADO PELO ID
      // -------------------------

      else if (req.query.id && req.query.type == "getById") {
        const reqId = req.query.id as string
        try {
          const response = await mainCollection.findOne({ _id: new ObjectId(reqId) },)
          const message = 'Anotações de Enfermagem não encontrada!'
          const url = `AnotacoesEnfermagemController?id=${reqId}`

          if (!response) { return res.status(404).json({ message: message, id: reqId, url: url, method: 'GET' }); }

          return res.status(200).json({ response, message: 'Sinal Vital Localizado', url: url, method: 'GET' });

        } catch (error) {
          return res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // BUSCAR O ÚLTIMO REGISTRO COM BASE NO ID DO RESIDENTE
      // -------------------------

      else if (req.query.type === 'getLast' && (req.query.residenteId)) {
        const residente_id = req.query.residenteId as string
        const documents = await mainCollection.findOne({ residente_id: residente_id }, { sort: { updatedAt: -1 } });
        return res.status(200).json(documents);
      }

      // -------------------------
      // LOCALIZAR PELO NOME DO IDOSO OU DATA
      // -------------------------

      else if (req.query.type === 'search' && (req.query.nome || req.query.data)) {
        let searchObject = {}
        if (req.query.nome) {
          const regex = new RegExp(req.query.nome as string, 'i');
          searchObject = Object.assign(searchObject, { idoso: regex });
        }
        if (req.query.data) { searchObject = Object.assign(searchObject, { data: req.query.data }); }
        const documents = await mainCollection.find(searchObject).toArray();
        return res.status(200).json(documents);
      }

      // -------------------------
      // CONTAR DOCUMENTOS
      // -------------------------

      else if (req.query.type == 'countDocuments') {
        try {
          const totalDocuments = await mainCollection.countDocuments();

          return res.status(200).json({ count: totalDocuments });
        } catch (err) {
          return res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // LISTAR PAGINADO
      // -------------------------

      else if (req.query.type == 'pages') {
        try {
          const page = parseInt(req.query.skip as unknown as string)
          const limit = parseInt(req.query.limit as unknown as string)
          const skip = (page - 1) * limit;

          // -------------------------
          // FILTRO ID - LISTAR PAGINADO
          // -------------------------

          if (req.query.residente_id) {
            const residente_id = req.query.residente_id as string
            const data = await mainCollection.find({ residente_id: residente_id }).sort({ data: -1 }).skip(skip).limit(limit).toArray();
            const count = await mainCollection.countDocuments({ residente_id: residente_id })
            return res.status(200).json({ count: count, data: data });
          }

          // const data = await mainCollection.find().sort({ data: -1 }).skip(skip).limit(limit).toArray();
          // return res.status(200).json({ data: data });
        } catch (err) {
          console.error(err)
          return res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // RELATÓRIO  // ANOTAÇÕES ENFERMAGEM // ENTRE DATAS E POR IDOSO
      // -------------------------

      else if (req.query.type == "report") {

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

      // -------------------------
      // RELATÓRIO  // ANOTAÇÕES ENFERMAGEM // ENTRE DATAS E POR IDOSO
      // -------------------------

      else if (req.query.type == "getBetweenDates") {

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

      break;

    case 'POST':

      try {

        // -------------------------
        // CRIAR NOVA ANOTAÇÃO DE ENFERMAGEM V2.0
        // -------------------------

        if (req.query.type == 'new') {


          const parsedData = JSON.parse(req.body)
          const dataFields = {

            residente_id: parsedData.residente_id,
            usuario_id: parsedData.usuario_id,
            usuario_nome: parsedData.usuario_nome,
            createdAt: getCurrentDateTime(),
            updatedAt: getCurrentDateTime(),

            "data": parsedData.data,
            "consciencia": parsedData.consciencia,
            "hemodinamico": parsedData.hemodinamico,
            "cardiovascular": parsedData.cardiovascular,
            "pressaoarterial": parsedData.pressaoarterial,
            "respiratorio": parsedData.respiratorio,
            "mucosas": parsedData.mucosas,
            "integridadecutanea": parsedData.integridadecutanea,
            "mmss": parsedData.mmss,
            "mmii": parsedData.mmii,
            "aceitacaodadieta": parsedData.aceitacaodadieta,
            "abdomen": parsedData.abdomen,
            "eliminacoes": parsedData.eliminacoes,
            "eliminacoesintestinais": parsedData.eliminacoesintestinais,
            "auscultapulmonar": parsedData.auscultapulmonar,
            "observacoes": parsedData.observacoes,
          }

          let keey = ""
          const areAllFieldsFilled = (obj: any) => {
            for (let key in obj) {
              // key !== "observacoes" && 
              if ((!obj[key] || obj[key].toString().trim() === "")) {
                keey += ` ${key}, `
                return false;
              }
            }
            return true;
          }

          if (areAllFieldsFilled(dataFields)) {
          } else {
            return res.status(400).json({ message: `Faltam campos para serem preenchidos. ${keey}`, method: 'POST', url: `AnotacoesEnfermagemController` });
          }

          const isUser = await mainCollection.findOne({ idoso_id: dataFields.residente_id, data: dataFields.data })
          if (isUser) {
            const message = `Já existe uma anotação cadastrada para o idoso na data ${dataFields.data}.`
            return res.status(400).json({ message: message, method: 'POST', url: `AnotacoesEnfermagemController` });
          }

          const response = await mainCollection.insertOne(dataFields);
          const message = `Novo Sinal | Data: ${dataFields.data}`
          const url = `AnotacoesEnfermagemController?id=${response.insertedId}`
          return res.status(201).json({ id: response.insertedId, message: message, url: url, method: 'POST' });
        }

      } catch (err) {
        return res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
      }

      break;

    case 'PUT':

      // -------------------------
      // ALTERA USUÁRIO | FOTO | SENHA | TUDO
      // -------------------------

      try {
        const myObjectId = new ObjectId(req.query.id as unknown as ObjectId);
        const myBody = JSON.parse(req.body)
        await mainCollection.updateOne({ _id: myObjectId }, { $set: myBody },);
        return res.status(201).json({ message: 'Dados do sinal vital alterados com sucesso!', method: 'PUT', url: `SinaisVitaisControllerid=${req.query.id}` });

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
          return res.status(404).json({ message: 'Sinal Vital não encontrado!', });
        }

        return res.status(201).json({ message: 'Sinal Vital deletado com sucesso', url: url, method: 'DELETE' });
      } catch (err) {
        return res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}