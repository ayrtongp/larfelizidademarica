import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb'
import { formatDateBR } from '@/utils/Functions';

export default async function handler(req: NextApiRequest, res: NextApiResponse,) {

  const { db, client } = await connect();
  const mainCollection = db.collection('sinaisvitais')

  switch (req.method) {

    case 'GET':

      // -------------------------
      // LOCALIZAR O SINAL VITAL PELO NOME DO IDOSO OU DATA
      // -------------------------

      if (req.query.tipo === 'Buscar' && (req.query.nome || req.query.data)) {
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
      // LOCALIZAR O SINAL VITAL PELO ID, CASO TENHA NA QUERY
      // -------------------------

      if (req.query.id) {
        const sinalId = req.query.id as string
        try {
          const sinalVital = await mainCollection.findOne({ _id: new ObjectId(sinalId) },)
          const url = `SinaisVitaisController?id=${sinalId}`

          if (!sinalVital) { return res.status(404).json({ message: 'Sinal Vital não encontrado', id: sinalId, url: url, method: 'GET' }); }

          return res.status(200).json({ sinalVital, message: 'Sinal Vital Localizado', url: url, method: 'GET' });

        } catch (error) {
          return res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // LISTAR TODOS OS SINAIS VITAIS
      // -------------------------

      else {
        try {
          const sinaisVitais = await mainCollection.find({},).toArray();
          const url = `SinaisVitaisController`

          return res.status(200).json({ sinaisVitais, message: 'Lista de Sinais Vitais', url: url });
        } catch (err) {
          return res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
        }
      }

      break;

    case 'POST':

      // -------------------------
      // CRIAR NOVO SINAL VITAL
      // -------------------------

      try {
        const novoSinal = JSON.parse(req.body)
        const dataFields = {
          "idoso": novoSinal.idoso,
          "idoso_id": novoSinal.idoso_id,
          "data": novoSinal.data,
          "datalancamento": novoSinal.datalancamento,
          "consciencia": novoSinal.consciencia,
          "hemodinamico": novoSinal.hemodinamico,
          "cardiovascular": novoSinal.cardiovascular,
          "pressaoarterial": novoSinal.pressaoarterial,
          "respiratorio": novoSinal.respiratorio,
          "mucosas": novoSinal.mucosas,
          "integridadecutanea": novoSinal.integridadecutanea,
          "mmss": novoSinal.mmss,
          "mmii": novoSinal.mmii,
          "aceitacaodadieta": novoSinal.aceitacaodadieta,
          "abdomen": novoSinal.abdomen,
          "eliminacoes": novoSinal.eliminacoes,
          "eliminacoesintestinais": novoSinal.eliminacoesintestinais,
          "auscultapulmonar": novoSinal.auscultapulmonar,
          "observacoes": novoSinal.observacoes ? novoSinal.observacoes : "Não preenchido",
          "id_usuario_cadastro": novoSinal.id_usuario_cadastro,
          "nome_usuario": novoSinal.nome_usuario,
          "registro_usuario": novoSinal.registro_usuario,
          "funcao_usuario": novoSinal.funcao_usuario,
          "createdAt": formatDateBR(Date.now()),
          "updatedAt": formatDateBR(Date.now()),
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

        const isUser = await mainCollection.findOne({ idoso_id: dataFields.idoso_id, data: dataFields.data })
        if (isUser) {
          return res.status(400).json({ message: `Já existe um sinal cadastrado para o idoso nesta data.: ${dataFields.idoso} na data ${dataFields.data}.`, method: 'POST', url: `SinaisVitaisController` });
        }

        const novoSinalVital = await mainCollection.insertOne(dataFields);
        const message = `Novo Sinal: ${dataFields.idoso} | Data: ${dataFields.data}`
        const url = `SinaisVitaisController?id=${novoSinalVital.insertedId}`
        return res.status(201).json({ message: message, url: url, method: 'POST' });
      } catch (err) {
        return res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
      }
      break;

    // -------------------------
    // ALTERA USUÁRIO | FOTO | SENHA | TUDO
    // -------------------------

    case 'PUT':
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

  await client.close();
}