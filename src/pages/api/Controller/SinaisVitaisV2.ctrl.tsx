import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import connect from '@/utils/Database';
import { getCurrentDateTime } from '@/utils/Functions';
import { SinalVitalV2, validarSinalVital } from '@/models/sinaisvitaisv2.model';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { db } = await connect();
    const sinaisCollection = db.collection('sinaisvitaisv2');
    const type = req.query.type;

    switch (req.method) {
        case 'GET':
            if (type === 'getAll')
                return getAllSinais(req, res, sinaisCollection);

            if (type === 'getPages')
                return getPagesSinais(req, res, sinaisCollection);

            if (type === 'getById') {
                const { id } = req.query as { id: string };
                return getSinalById(id, res, sinaisCollection);
            }

            return res.status(400).json({ message: 'Tipo de requisição GET inválido.' });

        case 'POST':
            if (type === 'insert')
                return insertSinal(req, res, sinaisCollection);

            return res.status(400).json({ message: 'Tipo de requisição POST inválido.' });

        case 'PUT':
            if (type === 'update') {
                const { id } = req.query as { id: string };
                if (!id || !ObjectId.isValid(id)) {
                    return res.status(400).json({ message: 'ID inválido.' });
                }
                return updateSinal(id, req, res, sinaisCollection);
            }
            return res.status(400).json({ message: 'Tipo de requisição PUT inválido.' });

        case 'DELETE':
            const { id } = req.query as { id: string };
            if (!id || !ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'ID inválido.' });
            }
            return deleteSinal(id, res, sinaisCollection);

        default:
            return res.status(405).json({ message: 'Método não permitido.' });
    }
}

// *********************************
// GET ALL
// *********************************
async function getAllSinais(req: NextApiRequest, res: NextApiResponse, collection: any) {
    try {
        const sinais = await collection.find().sort({ createdAt: -1 }).toArray();
        res.status(200).json(sinais);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar sinais vitais.' });
    }
}

// *********************************
// GET PAGES (PAGINADO)
// *********************************

async function getPagesSinais(req: NextApiRequest, res: NextApiResponse, collection: any) {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    // Filtros
    const { idosoId, tipo, foraLimite, dataIni, dataFim } = req.query;
    const filter: any = {};

    if (idosoId) filter.idosoId = idosoId;
    if (tipo) filter.tipo = tipo;
    if (foraLimite === "true") filter.foraLimite = true;
    if (foraLimite === "false") filter.foraLimite = false;

    // Filtro por dataHora (intervalo)
    if (dataIni || dataFim) {
        filter.dataHora = {};
        if (dataIni) filter.dataHora.$gte = dataIni;
        if (dataFim) filter.dataHora.$lte = dataFim;
    }

    try {
        const total = await collection.countDocuments(filter);
        const sinais = await collection.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .toArray();
        res.status(200).json({ total, page, pageSize, sinais });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar sinais vitais paginados.' });
    }
}

// *********************************
// GET BY ID
// *********************************
async function getSinalById(id: string, res: NextApiResponse, collection: any) {
    try {
        const sinal = await collection.findOne({ _id: new ObjectId(id) });
        if (!sinal) {
            return res.status(404).json({ message: 'Sinal vital não encontrado.' });
        }
        return res.status(200).json(sinal);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao buscar sinal vital.' });
    }
}

// *********************************
// INSERT
// *********************************
async function insertSinal(req: NextApiRequest, res: NextApiResponse, collection: any) {
    const body: SinalVitalV2 = req.body;
    const now = getCurrentDateTime();
    body.createdAt = body.createdAt || now;
    body.updatedAt = body.updatedAt || now;

    const { valido, erro } = validarSinalVital(body.tipo, body.valor);

    if (!valido) {
        return res.status(400).json({ message: 'Dados inválidos.', erro });
    }

    try {
        const result = await collection.insertOne({
            ...body,
            _id: new ObjectId(),
        });

        res.status(201).json({
            message: 'Sinal vital cadastrado com sucesso.',
            insertedId: result.insertedId,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao cadastrar sinal vital.' });
    }
}

// *********************************
// UPDATE
// *********************************
async function updateSinal(id: string, req: NextApiRequest, res: NextApiResponse, collection: any) {
    const updates = req.body;
    updates.updatedAt = new Date().toISOString();

    // Busca o registro atual para validação
    const existing = await collection.findOne({ _id: new ObjectId(id) });
    if (!existing) {
        return res.status(404).json({ message: 'Sinal vital não encontrado.' });
    }

    // Validação do valor atualizado
    const tipo = updates.tipo || existing.tipo;
    const valor = updates.valor || existing.valor;
    const { valido, erro } = validarSinalVital(tipo, valor);

    if (!valido) {
        return res.status(400).json({ message: 'Atualização inválida.', erro });
    }

    try {
        await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updates }
        );
        return res.status(200).json({ message: 'Sinal vital atualizado com sucesso.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar sinal vital.' });
    }
}

// *********************************
// DELETE
// *********************************
async function deleteSinal(id: string, res: NextApiResponse, collection: any) {
    try {
        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Sinal vital não encontrado para deletar.' });
        }

        return res.status(200).json({ message: 'Sinal vital removido com sucesso.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao deletar sinal vital.' });
    }
}