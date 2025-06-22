import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import connect from '@/utils/Database';
import { getCurrentDateTime } from '@/utils/Functions'; // ou use new Date().toISOString()
import { Lesao, validarLesao, validarUpdateStatus } from '@/models/lesoes.model';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { db } = await connect();
    const lesoesCollection = db.collection('lesoes');
    const type = req.query.type
    switch (req.method) {
        case 'GET':

            if (type === 'getAll')
                return getLesoes(req, res, lesoesCollection);

            if (type === 'getByUserId')
                return getLesoesByUserId(req, res, lesoesCollection);

            if (type === 'getById') {
                const { id } = req.query as { id: string };
                return getLesaoById(id, res, lesoesCollection);
            }

            return res.status(400).json({ message: 'Tipo de requisição GET inválido.' });

        case 'PUT':

            if (type === 'updateLesao') {
                if (!req.query.id || !ObjectId.isValid(req.query.id as string)) {
                    return res.status(400).json({ message: 'ID inválido.' });
                }
                return updateLesao(req.query.id as string, req, res, lesoesCollection);
            }

            else if (type === 'updateStatusLesao') {
                if (!req.query.id || !ObjectId.isValid(req.query.id as string)) {
                    return res.status(400).json({ message: 'ID inválido.' });
                }
                return updateStatusLesao(req.query.id as string, req, res, lesoesCollection);
            }

            else {
                return res.status(400).json({ message: 'Tipo de requisição PUT inválido.' });
            }

        case 'POST':

            if (type !== 'postLesao')
                return postLesao(req, res, lesoesCollection);

            else {
                return res.status(400).json({ message: 'Tipo de requisição POST inválido.' });
            }

        case 'DELETE':
            const { id } = req.query as { id: string };

            if (!id || !ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'ID inválido.' });
            }

            return deleteLesao(id, res, lesoesCollection);

        default:
            return res.status(405).json({ message: 'Método não permitido.' });
    }
}

// *********************************
// *********************************
// FUNCTIONS 
// *********************************
// *********************************

// *********************************
// *********************************
// GET
// *********************************
// *********************************

// GET: Lista todas as lesões
async function getLesoes(req: NextApiRequest, res: NextApiResponse, collection: any) {
    try {
        const lesoes = await collection.find().sort({ createdAt: -1 }).toArray();
        res.status(200).json(lesoes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar lesões.' });
    }
}

// GET: Lista todas as lesões do idoso
async function getLesoesByUserId(req: NextApiRequest, res: NextApiResponse, collection: any) {
    const { userId } = req.query;

    try {
        const lesoes = await collection.find({ userId }).sort({ createdAt: -1 }).toArray();
        res.status(200).json(lesoes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar lesões.' });
    }
}

// POST: Cria uma nova lesão
async function postLesao(req: NextApiRequest, res: NextApiResponse, collection: any) {
    const body: Lesao = req.body;

    // Garante que o createdAt e updatedAt existam
    const now = getCurrentDateTime(); // ou: new Date().toISOString()
    body.createdAt = body.createdAt || now;
    body.updatedAt = body.updatedAt || now;

    const { valido, erros } = validarLesao(body);

    if (!valido) {
        return res.status(400).json({ message: 'Dados inválidos.', erros });
    }

    try {
        const result = await collection.insertOne({
            ...body,
            _id: new ObjectId(),
        });

        res.status(201).json({
            message: 'Lesão cadastrada com sucesso.',
            insertedId: result.insertedId,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao cadastrar lesão.' });
    }
}



// GET /api/Controller/Lesoes/:id
async function getLesaoById(id: string, res: NextApiResponse, collection: any) {
    try {
        const lesao = await collection.findOne({ _id: new ObjectId(id) });

        if (!lesao) {
            return res.status(404).json({ message: 'Lesão não encontrada.' });
        }

        return res.status(200).json(lesao);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao buscar lesão.' });
    }
}

// DELETE /api/Controller/Lesoes/:id
async function deleteLesao(id: string, res: NextApiResponse, collection: any) {
    try {
        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Lesão não encontrada para deletar.' });
        }

        return res.status(200).json({ message: 'Lesão removida com sucesso.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao deletar lesão.' });
    }
}


// *********************************
// *********************************
// PUT
// *********************************
// *********************************

// PUT /api/Controller/Lesoes/:id
async function updateLesao(id: string, req: NextApiRequest, res: NextApiResponse, collection: any) {
    const updates = req.body;

    // Atualiza o campo updatedAt
    updates.updatedAt = new Date().toISOString();

    // Validação parcial (usamos o validador para garantir integridade do objeto resultante)
    const existing = await collection.findOne({ _id: new ObjectId(id) });
    if (!existing) {
        return res.status(404).json({ message: 'Lesão não encontrada.' });
    }

    const merged = { ...existing, ...updates };
    const { valido, erros } = validarLesao(merged);

    if (!valido) {
        return res.status(400).json({ message: 'Atualização inválida.', erros });
    }

    try {
        await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updates }
        );

        return res.status(200).json({ message: 'Lesão atualizada com sucesso.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar lesão.' });
    }
}

// Novo handler para updateStatusLesao com validação
async function updateStatusLesao(id: string, req: NextApiRequest, res: NextApiResponse, collection: any) {
    const { status } = req.body;

    const { valido, erros } = validarUpdateStatus(status);

    if (!valido) {
        return res.status(400).json({ message: 'Status inválido.', erros });
    }

    try {
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { status, updatedAt: new Date().toISOString() } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Lesão não encontrada.' });
        }

        return res.status(200).json({ message: 'Status da lesão atualizado com sucesso.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar status da lesão.' });
    }
}
