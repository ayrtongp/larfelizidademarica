import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { Collection, ObjectId } from 'mongodb'
import { formatDateBR, getCurrentDateTime } from '@/utils/Functions';
import { Contrato } from '@/types/Contrato';

export default async function handler(req: NextApiRequest, res: NextApiResponse,) {

  const { db } = await connect();
  const mainCollection: Collection = db.collection('contratos')
  const { type } = req.query
  const nameCollection = 'Contrato'

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
          const { data_inicio, dia_pagamento, regime_pagamento, residenteId, valor_mensalidade, tipo_contrato, vigencia, tipoVigencia }: Contrato = req.body
          const anoAtual: number = (new Date()).getFullYear()
          const contratos = await mainCollection.find({ ano: anoAtual }).toArray();
          const numeroAtual: number = contratos.length < 1 ? 1 : contratos.length + 1

          const dataFields: Contrato = {
            data_inicio,
            dia_pagamento,
            regime_pagamento,
            residenteId,
            tipo_contrato,
            valor_mensalidade,
            vigencia,
            tipoVigencia,

            numero: numeroAtual,
            ano: anoAtual,
            data_termino: null,
            ativo: true,

            createdAt: getCurrentDateTime(),
            updatedAt: getCurrentDateTime(),
          }

          // Verifica se todos os campos necessários estão presentes no req.body
          const requiredFields: (keyof Contrato)[] = ['data_inicio', 'dia_pagamento', 'regime_pagamento', 'residenteId', 'valor_mensalidade', 'tipo_contrato', 'vigencia', 'tipoVigencia'];
          const missingFields = requiredFields.filter((field) => !dataFields[field]);
          if (missingFields.length > 0) {
            return res.status(400).json({ message: `Campos obrigatórios ausentes: ${missingFields.join(', ')}` });
          }

          const alreadyExists = await mainCollection.findOne({ numero: dataFields.numero, ano: dataFields.ano })
          if (alreadyExists) {
            return res.status(400).json({ message: `${nameCollection} já cadastrado: ${dataFields.numero}/${dataFields.ano} na data ${alreadyExists.createdAt}.`, method: 'POST', });
          }

          const contratoExistente = await mainCollection.find({ residenteId, ativo: true }).toArray();
          if (contratoExistente.length > 0) {
            return res.status(400).json({ message: `${nameCollection} já existente para o idoso e ATIVO.`, method: 'POST', });
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