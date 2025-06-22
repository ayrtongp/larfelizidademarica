import { NextApiRequest, NextApiResponse } from 'next';
import connect from '@/utils/Database'
import { ObjectId } from 'mongodb';
import { getCurrentDateTime } from '@/utils/Functions';
import { I_Arquivo } from '@/types/Arquivos';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { db } = await connect();
    const collection = await db.collection('arquivos')

    switch (req.method) {

        // CASE GET

        case 'GET':

            if (req.query.type == "getArquivo") {
                try {
                    const idArquivo = req.query.idArquivo as string
                    const result = await collection.findOne({ _id: new ObjectId(idArquivo) })
                    return res.status(200).json(result);
                } catch (error) {
                    console.error('Erro ao conectar ao banco de dados:', error);
                    res.status(500).json({ error: 'GET/buscarID - Erro interno do servidor' });
                }
            }

            else if (req.query.type == "getArquivoById") {
                try {
                    const idArquivo = req.query.idArquivo as string
                    const result = await collection.findOne({ _id: new ObjectId(idArquivo) })
                    return res.status(200).json(result);
                } catch (error) {
                    console.error('Erro ao conectar ao banco de dados:', error);
                    res.status(500).json({ error: 'GET/buscarID - Erro interno do servidor' });
                }
            }

            else if (req.query.type == 'getBydbNameAndId') {
                try {
                    const dbName = req.query.dbName;
                    const residenteId = req.query.residenteId
                    const result = await collection.find({ dbName, residenteId }).sort({ createdAt: -1 }).toArray();
                    return res.status(200).json(result)
                } catch (error) {
                    console.error('Erro ao conectar ao banco de dados:', error);
                    res.status(500).json({ error: 'GET/getBydbNameAndId - Erro interno do servidor' });
                }
            }

            else {
                return res.status(400).json({ error: `GET/Requisição 'type' inexistente` });
            }

            break;

        // CASE POST

        case 'POST':

            if (req.query.type == "novoArquivo") {
                try {
                    const data = req.body
                    const newDate = getCurrentDateTime();

                    // Verifica se todos os campos necessários estão presentes no req.body
                    const requiredFields = ['cloudURL', 'filename', 'cloudFilename', 'descricao', 'dbName'];
                    const missingFields = requiredFields.filter(field => !data[field]);

                    if (missingFields.length > 0) {
                        return res.status(400).json({ error: `Campos obrigatórios ausentes: ${missingFields.join(', ')}` });
                    }

                    const dataToInsert: I_Arquivo = {
                        cloudURL: req.body.cloudURL,
                        descricao: req.body.descricao,
                        dbName: req.body.dbName,
                        filename: req.body.filename,
                        cloudFilename: req.body.cloudFilename,
                        size: req.body.size,
                        format: req.body.format,
                        fullName: req.body.fullName,
                        createdAt: newDate,
                        updatedAt: newDate,
                    };

                    req.body.residenteId ? dataToInsert.residenteId = req.body.residenteId : null

                    const result = await collection.insertOne(dataToInsert);

                    res.status(200).json({ message: 'Dados inseridos com sucesso', result: result, newId: result.insertedId });
                } catch (error) {
                    res.status(500).json({ error: 'POST/novoStatus' });
                }
            }

            else {
                return res.status(400).json({ error: `POST/Requisição 'type' inexistente` });
            }

            break;

        // CASE PUT

        case 'PUT':

            break;

        // CASE DELETE

        case 'DELETE':
            if (req.query.type == 'deleteById') {
                const result = await collection.deleteOne({ _id: new ObjectId(req.query.idArquivo as string) });
                if (result.deletedCount > 0) {
                    return res.status(200).json({ resultOk: true, message: 'Excluído com sucesso', });
                }
                else {
                    return res.status(400).json({ resultOk: false, message: 'Falha ao escolher em `arquivos`', error: `${req.method}/${req.query.type}` });
                }
            }
            break;

        default:
            res.status(405).json({ error: 'Método não permitido (req.method)' });
            break;

    }
}