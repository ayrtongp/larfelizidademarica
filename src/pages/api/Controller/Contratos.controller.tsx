import { NextApiRequest, NextApiResponse } from 'next';
import connect from '@/utils/Database';
import { Collection, ObjectId } from 'mongodb';
import { getCurrentDateTime } from '@/utils/Functions';
import { Contrato } from '@/models/contratos.model';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { db } = await connect();
    const mainCollection: Collection<Contrato> = db.collection('contratos')

    switch (req.method) {
        case 'GET': {
            const { type } = req.query;

            // GET ALL
            if (type === 'getAll') {
                try {
                    const contratos = await mainCollection
                        .find()
                        .sort({ data_assinatura: -1 })
                        .toArray();
                    return res.status(200).json(contratos);
                } catch (error) {
                    console.error(error);
                    return res.status(500).json({ message: 'Erro ao buscar contratos.' });
                }
            }

            // GET BY USER
            if (type === 'getByUser' && req.query.usuario_id) {
                try {
                    const userId = req.query.usuario_id as string;
                    const contratos = await mainCollection
                        .find({ usuario_id: userId })
                        .sort({ data_assinatura: -1 })
                        .toArray();
                    return res.status(200).json(contratos);
                } catch (error) {
                    console.error(error);
                    return res.status(500).json({ message: 'Erro ao buscar contratos do usuário.' });
                }
            }

            // GET BY ID
            if (type === 'getID' && req.query.id) {
                try {
                    const id = new ObjectId(req.query.id as string);
                    const contrato = await mainCollection.findOne({ _id: id });
                    if (!contrato) {
                        return res
                            .status(404)
                            .json({ message: 'Contrato não encontrado.' });
                    }
                    return res.status(200).json(contrato);
                } catch (error) {
                    console.error(error);
                    return res.status(500).json({ message: 'Erro ao buscar contrato.' });
                }
            }

            // COUNT DOCUMENTS
            if (type === 'countDocuments') {
                try {
                    const count = await mainCollection.countDocuments();
                    return res.status(200).json({ count });
                } catch (error) {
                    console.error(error);
                    return res.status(500).json({ message: 'Erro ao contar contratos.' });
                }
            }

            // PAGINATED
            if (type === 'pages') {
                try {
                    const page = parseInt(req.query.page as string, 10) || 1;
                    const limit = parseInt(req.query.limit as string, 10) || 10;
                    const skip = (page - 1) * limit;

                    const [metadata, data] = await Promise.all([
                        mainCollection.countDocuments(),
                        mainCollection
                            .find()
                            .sort({ data_assinatura: -1 })
                            .skip(skip)
                            .limit(limit)
                            .toArray(),
                    ]);

                    return res.status(200).json({ page, limit, total: metadata, data });
                } catch (error) {
                    console.error(error);
                    return res.status(500).json({ message: 'Erro na paginação.' });
                }
            }

            return res.status(400).json({ message: 'GET: tipo não reconhecido.' });
        }

        case 'POST': {
            const { type } = req.query;
            if (type === 'new') {
                try {
                    // Gera número sequencial de contrato no formato NNN/YYYY
                    const year = new Date().getFullYear().toString();
                    const last = await mainCollection
                        .find({ numero_contrato: { $regex: `^\\d{3}/${year}$` } })
                        .sort({ numero_contrato: -1 })
                        .limit(1)
                        .toArray();
                    let seq = 1;
                    if (last.length > 0) {
                        const lastNum = parseInt(last[0].numero_contrato.split('/')[0], 10);
                        seq = lastNum + 1;
                    }
                    const numero_contrato = seq.toString().padStart(3, '0') + `/${year}`;

                    // Lê payload e inclui numero_contrato gerado
                    const payload = req.body as Omit<Contrato, '_id' | 'createdAt' | 'updatedAt'>;
                    payload.numero_contrato = numero_contrato;

                    // Valida campos obrigatórios (sem numero_contrato)
                    const required = [
                        'usuario_id',
                        'data_assinatura',
                        'data_inicio',
                        'dia_pagamento',
                        'valor',
                        'tipo',
                        'status',
                        'regime_pagamento',
                        'periodicidade',
                        'papel',
                    ];
                    const missing = required.filter(f => !payload[f as keyof typeof payload]);
                    if (missing.length) {
                        return res
                            .status(400)
                            .json({ message: `Campos faltando: ${missing.join(', ')}` });
                    }

                    const now = getCurrentDateTime();
                    const toInsert = {
                        ...payload,
                        createdAt: now,
                        updatedAt: now,
                    };

                    const result = await mainCollection.insertOne(toInsert as any);
                    return res.status(201).json({ id: result.insertedId, numero_contrato });
                } catch (error) {
                    console.error(error);
                    return res.status(500).json({ message: 'Erro ao criar contrato.' });
                }
            }

            return res.status(400).json({ message: 'POST: tipo não reconhecido.' });
        }

        case 'PUT': {
            const { type, id } = req.query;
            if (type === 'update' && id) {
                try {
                    const objId = new ObjectId(id as string);
                    const updates = JSON.parse(req.body) as Partial<Contrato>;
                    updates.updatedAt = getCurrentDateTime();

                    const result = await mainCollection.updateOne(
                        { _id: objId },
                        { $set: updates }
                    );
                    if (result.matchedCount === 0) {
                        return res.status(404).json({ message: 'Contrato não encontrado.' });
                    }
                    return res.status(200).json({ message: 'Contrato atualizado.' });
                } catch (error) {
                    console.error(error);
                    return res.status(500).json({ message: 'Erro ao atualizar contrato.' });
                }
            }

            return res.status(400).json({ message: 'PUT: tipo não reconhecido.' });
        }

        case 'DELETE': {
            if (req.query.id) {
                try {
                    const objId = new ObjectId(req.query.id as string);
                    const result = await mainCollection.deleteOne({ _id: objId });
                    if (result.deletedCount === 0) {
                        return res.status(404).json({ message: 'Contrato não encontrado.' });
                    }
                    return res.status(200).json({ message: 'Contrato removido.' });
                } catch (error) {
                    console.error(error);
                    return res.status(500).json({ message: 'Erro ao deletar contrato.' });
                }
            }
            return res.status(400).json({ message: 'DELETE: id não informado.' });
        }

        default:
            res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
            return res.status(405).json({ message: `Method ${req.method} not allowed.` });
    }
}


function pipe_ContratosComResidente() {
    return [
        [
            { $sort: { data_assinatura: -1 } },
            {
                $lookup: {
                    from: 'residentes',
                    let: { userId: '$usuario_id' },
                    pipeline: [
                        { $addFields: { convertId: { $toString: '$_id' } } },
                        { $match: { $expr: { $eq: ['$convertId', '$$userId'] } } },
                        { $project: { nome: 1, foto_base64: 1 } }
                    ],
                    as: 'residente'
                }
            },
            {
                $unwind: { path: "$residente", preserveNullAndEmptyArrays: true }
            },
            {
                $set: {
                    nome: "$residente.nome",
                    foto_base64: "$residente.foto_base64"
                }
            },
            {
                $unset: "residente"
            }
        ]
    ]
}