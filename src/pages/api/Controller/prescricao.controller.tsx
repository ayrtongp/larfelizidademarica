import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import connect from '@/utils/Database';
import { Prescricao, validarPrescricao } from '@/models/prescricao.model';
import { getCurrentDateTime } from '@/utils/Functions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { db } = await connect();
    const collection = db.collection('prescricoes');
    const { type } = req.query;

    switch (req.method) {
        case 'GET':
            if (type === 'getById') return getById(req, res, collection);
            else if (type === 'getByResidente') return getByResidente(req, res, collection);
            else if (type === 'getAll') return getAll(req, res, collection);
            else return res.status(400).json({ message: 'Tipo de requisição GET inválido ou não informado.' });

        case 'POST':
            if (type === 'postPrescricao') return postPrescricao(req, res, collection);
            else return res.status(400).json({ message: 'Tipo de requisição POST inválido ou não informado.' });

        case 'PUT':
            if (type === 'updateStatus') return updateStatus(req, res, collection);
            else if (type === 'updatePrescricao') return updatePrescricao(req, res, collection);
            else return res.status(400).json({ message: 'Tipo de requisição PUT inválido ou não informado.' });

        case 'DELETE':
            if (type === 'deletePrescricao') return deletePrescricao(req, res, collection);
            else return res.status(400).json({ message: 'Tipo de requisição DELETE inválido ou não informado.' });

        default:
            return res.status(405).json({ message: 'Método não permitido.' });
    }
}

// ****************************
// ****************************
// GET: todas as prescrições
// ****************************
// ****************************

async function getAll(req: NextApiRequest, res: NextApiResponse, collection: any) {
    try {
        const result = await collection.find().sort({ createdAt: -1 }).toArray();
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar prescrições.' });
    }
}

// ****************************
// ****************************
// GET: por ID
// ****************************
// ****************************

async function getById(req: NextApiRequest, res: NextApiResponse, collection: any) {
    const { id } = req.query as { id: string };
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'ID inválido.' });

    try {
        const result = await collection.findOne({ _id: new ObjectId(id) });
        if (!result) return res.status(404).json({ message: 'Prescrição não encontrada.' });
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar prescrição.' });
    }
}

// ****************************
// ****************************
// GET: por residente
// ****************************
// ****************************

async function getByResidente(req: NextApiRequest, res: NextApiResponse, collection: any) {
    const { residenteId } = req.query;
    if (!residenteId) return res.status(400).json({ message: 'residenteId é obrigatório.' });

    try {
        const result = await collection.find({ residenteId }).sort({ createdAt: -1 }).toArray();
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar prescrições.' });
    }
}

// ****************************
// ****************************
// POST: nova prescrição
// ****************************
// ****************************

async function postPrescricao(req: NextApiRequest, res: NextApiResponse, collection: any) {
    const body: Prescricao = req.body;
    const now = getCurrentDateTime();

    body.createdAt = now;
    body.updatedAt = now;

    const { valido, erros } = validarPrescricao(body);
    if (!valido) return res.status(400).json({ message: 'Dados inválidos.', erros });

    try {
        const result = await collection.insertOne({ ...body, _id: new ObjectId() });
        res.status(201).json({ message: 'Prescrição cadastrada com sucesso.', insertedId: result.insertedId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao cadastrar prescrição.' });
    }
}

// ****************************
// ****************************
// PUT: atualizar prescrição inteira
// ****************************
// ****************************

async function updatePrescricao(req: NextApiRequest, res: NextApiResponse, collection: any) {
    const { id } = req.query as { id: string };
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'ID inválido.' });

    const updates = req.body;
    updates.updatedAt = getCurrentDateTime();

    const existing = await collection.findOne({ _id: new ObjectId(id) });
    if (!existing) return res.status(404).json({ message: 'Prescrição não encontrada.' });

    const merged = { ...existing, ...updates };
    const { valido, erros } = validarPrescricao(merged);
    if (!valido) return res.status(400).json({ message: 'Atualização inválida.', erros });

    try {
        await collection.updateOne({ _id: new ObjectId(id) }, { $set: updates });
        res.status(200).json({ message: 'Prescrição atualizada com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar prescrição.' });
    }
}

// ****************************
// ****************************
// PUT: apenas status
// ****************************
// ****************************

async function updateStatus(req: NextApiRequest, res: NextApiResponse, collection: any) {
    const { id } = req.query as { id: string };
    const { status } = req.body;

    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'ID inválido.' });
    if (!status) return res.status(400).json({ message: 'Status é obrigatório.' });

    try {
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { status, updatedAt: getCurrentDateTime() } }
        );

        if (result.matchedCount === 0)
            return res.status(404).json({ message: 'Prescrição não encontrada.' });

        return res.status(200).json({ message: 'Status atualizado com sucesso.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar status.' });
    }
}

// ****************************
// ****************************
// DELETE
// ****************************
// ****************************

async function deletePrescricao(req: NextApiRequest, res: NextApiResponse, collection: any) {
    const { id } = req.query as { id: string };
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'ID inválido.' });

    try {
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0)
            return res.status(404).json({ message: 'Prescrição não encontrada para deletar.' });

        return res.status(200).json({ message: 'Prescrição removida com sucesso.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao deletar prescrição.' });
    }
}
