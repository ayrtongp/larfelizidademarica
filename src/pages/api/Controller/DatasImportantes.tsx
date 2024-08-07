import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb'
import { getCurrentDateTime } from '@/utils/Functions';

export default async function handler(req: NextApiRequest, res: NextApiResponse,) {

    const { db } = await connect();
    const mainCollection = db.collection('datas_importantes')

    switch (req.method) {
        case 'GET':

            // -------------------------
            // GET All 
            // -------------------------

            if (req.query.type === 'getAll') {
                try {
                    const documents = await mainCollection.find().sort({}).toArray();
                    return res.status(200).json(documents);
                } catch (err) {
                    console.error(err)
                    return res.status(500).json({ message: 'getAll: Erro não identificado. Procure um administrador.' });
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
                        nome_insumo: data['nome_insumo'],
                        unidade: data['unidade'],
                        cod_categoria: data['cod_categoria'],
                        descricao: data['descricao'],
                        createdAt: getCurrentDateTime(),
                        updatedAt: getCurrentDateTime(),
                    }

                    // Verifica se todos os campos necessários estão presentes no req.body
                    const requiredFields = ['nome_insumo', 'unidade', 'cod_categoria', 'descricao'];
                    const missingFields = requiredFields.filter(field => !data[field]);
                    const alreadyExists = await mainCollection.findOne({ nome_insumo: dataFields.nome_insumo })

                    if (missingFields.length > 0) {
                        return res.status(400).json({ error: `Campos obrigatórios ausentes: ${missingFields.join(', ')}` });
                    }
                    else if (alreadyExists) {
                        return res.status(400).json({ message: `Insumo já cadastrado: ${dataFields.nome_insumo} na data ${alreadyExists.createdAt}.`, method: 'POST', });
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