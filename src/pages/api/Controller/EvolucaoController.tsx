import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb'
import { formatDateBR, getCurrentDateTime } from '@/utils/Functions';
import novoresidente from '@/pages/portal/residentes/novoresidente';

export default async function handler(req: NextApiRequest, res: NextApiResponse,) {

  const { db } = await connect();
  const mainCollection = db.collection('evolucao')

  switch (req.method) {

    case 'GET':

      // ##########################
      // GET ALL
      // ##########################

      if (req.query.type == "getAll") {
        try {
          const documents = await mainCollection.find().sort().toArray();
          return res.status(200).json(documents);
        } catch (err) {
          console.log(err)
          return res.status(500).json({ message: 'getAll: Erro não identificado. Procure um administrador.' });
        }
      }

      // ##########################
      // GET LAST 50
      // Recupera os últimos 50 registros a paginado
      // ##########################

      if (req.query.type == "getLast50") {
        try {
          const skip = parseInt(req.query.skip as unknown as string)
          const limit = parseInt(req.query.limit as unknown as string)

          const documents = await mainCollection.find().sort({ $natural: -1 }).skip(skip).limit(limit).toArray();
          const count = await mainCollection.countDocuments()
          return res.status(200).json({count: count, data: documents});
        } catch (err) {
          console.log(err)
          return res.status(500).json({ message: 'getAll: Erro não identificado. Procure um administrador.' });
        }
      }


      // ##########################
      // TYPE - report
      // ##########################

      else if (req.query.type == "report") {
        console.log('oiiiii')

        const dataInicio = (req.query.dataInicio as string).split(",")[0];
        const dataFim = (req.query.dataFim as string).split(",")[0];

        const documents = await mainCollection.find({
          residente_id: req.query.id,
          createdAt: {
            $gte: dataInicio,
            $lte: dataFim,
          }
        }).toArray();
        console.log(documents)
        return res.status(200).json(documents);
      }

      // ##########################
      // TYPE - PAGES
      // ##########################

      else if (req.query.type == 'pages') {
        try {
          const skip = parseInt(req.query.skip as unknown as string)
          const limit = parseInt(req.query.limit as unknown as string)

          // -------------------------
          // FILTRO ID - LISTAR PAGINADO
          // -------------------------

          if (req.query.residente_id) {
            const residente_id = req.query.residente_id as string
            console.log(residente_id)
            const data = await mainCollection.find({ residente_id: residente_id }).sort({ dataEvolucao: -1 }).skip(skip).limit(limit).toArray();
            const count = await mainCollection.countDocuments({ residente_id: residente_id })
            return res.status(200).json({ count: count, data: data });
          }

          const data = await mainCollection.find().sort({ data: -1 }).skip(skip).limit(limit).toArray();
          return res.status(200).json({ data: data });
        } catch (err) {
          console.log(err)
          return res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
        }
      }

      // ##########################
      // GET BY ID
      // ##########################

      else if (req.query.type == 'getById') {
        const reqID = req.query.id as string
        try {
          const result = await mainCollection.findOne({ _id: new ObjectId(reqID) },)

          if (!result) {
            return res.status(404).json({ message: 'Residente não encontrado', id: reqID, method: 'GET' });
          }

          return res.status(200).json({ result, message: 'Residente Localizado', method: 'GET' });

        } catch (error) {
          console.log(error)

          return res.status(500).json({ message: 'getID: Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // COUNT DOCUMENTS
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
      // BUSCAR O ÚLTIMO REGISTRO COM BASE NO ID DO RESIDENTE
      // -------------------------

      if (req.query.type === 'getLast' && (req.query.residenteId)) {
        const residente_id = req.query.residenteId as string
        console.log(residente_id)
        const documents = await mainCollection.findOne({ residente_id: residente_id }, { sort: { updatedAt: -1 } });
        return res.status(200).json(documents);
      }

      break; // CASE GET

    case 'POST':

      // -------------------------
      // NOVO REGISTRO
      // -------------------------

      if (req.query.type == 'new') {
        const novoRegistro = JSON.parse(req.body)
        console.log(novoRegistro)
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
        }

        let keey = ""
        const areAllFieldsFilled = (obj: any) => {
          for (let key in obj) {
            if (key !== "observacoes" && (!obj[key] || obj[key].toString().trim() === "")) {
              keey += ` ${key}, `
              return false;
            }
          }
          return true;
        }

        if (areAllFieldsFilled(dataFields)) {
        } else {
          return res.status(400).json({ message: `Faltam campos para serem preenchidos. ${keey}`, method: 'POST', url: `SinaisVitaisController` });
        }

        const novaEvolucao = await mainCollection.insertOne(dataFields);
        return res.status(201).json({ id: novaEvolucao.insertedId, message: "Dado Inserido.", method: 'POST' });
      }

  }

}