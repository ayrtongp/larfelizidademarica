import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import connect from '@/utils/Database';
import { getCurrentDateTime } from '@/utils/Functions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { db } = await connect();
    const col = db.collection('administracoes_medicamento');
    const { type } = req.query;

    switch (req.method) {
        case 'GET':
            if (type === 'getByData') return getByData(req, res, db, col);
            return res.status(400).json({ message: 'Tipo GET inválido.' });

        case 'POST':
            if (type === 'registrar') return registrar(req, res, col);
            return res.status(400).json({ message: 'Tipo POST inválido.' });

        case 'PUT':
            if (type === 'updateStatus') return updateStatus(req, res, col);
            return res.status(400).json({ message: 'Tipo PUT inválido.' });

        default:
            return res.status(405).json({ message: 'Método não permitido.' });
    }
}

// -----------------------------------------------
// GET: retorna todos os slots do dia
// → prescricoes ativas + registros existentes na data
// -----------------------------------------------
async function getByData(req: NextApiRequest, res: NextApiResponse, db: any, col: any) {
    const { data } = req.query as { data: string };
    if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return res.status(400).json({ message: 'Parâmetro "data" obrigatório no formato YYYY-MM-DD.' });
    }

    try {
        // Busca prescrições ativas (inclui 'aguardando' também para não perder)
        const prescricoes = await db.collection('prescricoes').find({
            status: { $in: ['ativa', 'aguardando'] },
            usoSOS: false,
        }).toArray();

        // Busca registros já feitos na data
        const registros = await col.find({ data }).toArray();
        const registroMap: Record<string, any> = {};
        for (const r of registros) {
            const chave = `${r.prescricaoId}__${r.horarioPrevisto}`;
            registroMap[chave] = r;
        }

        // Busca dados dos residentes (nome)
        const residenteIds = Array.from(new Set<string>(prescricoes.map((p: any) => p.residenteId as string)));
        const usuarios = residenteIds.length > 0
            ? await db.collection('idoso_detalhes').aggregate([
                { $match: { _id: { $in: residenteIds.map((id: string) => { try { return new ObjectId(id); } catch { return id; } }) } } },
                { $lookup: { from: 'usuario', localField: 'usuarioId', foreignField: '_id', as: 'usuario' } },
                { $unwind: { path: '$usuario', preserveNullAndEmptyArrays: true } },
                { $project: { _id: 1, nome: { $concat: ['$usuario.nome', ' ', '$usuario.sobrenome'] } } },
            ]).toArray()
            : [];

        const nomeMap: Record<string, string> = {};
        for (const u of usuarios) {
            nomeMap[u._id.toString()] = u.nome || 'Idoso';
        }

        // Monta slots
        const slots: any[] = [];
        for (const p of prescricoes) {
            // Só inclui prescrições dentro do período
            if (p.dataInicio && p.dataInicio > data) continue;
            if (p.dataFim && p.dataFim < data) continue;

            for (const horario of (p.horarios || [])) {
                const chave = `${p._id.toString()}__${horario}`;
                slots.push({
                    prescricaoId: p._id.toString(),
                    residenteId: p.residenteId,
                    nomeResidente: nomeMap[p.residenteId] || 'Idoso',
                    medicamento: p.medicamento,
                    via: p.via,
                    horarioPrevisto: horario,
                    usoSOS: false,
                    registro: registroMap[chave] || null,
                });
            }
        }

        // Ordena por horário → nome do residente
        slots.sort((a, b) => {
            if (a.horarioPrevisto < b.horarioPrevisto) return -1;
            if (a.horarioPrevisto > b.horarioPrevisto) return 1;
            return a.nomeResidente.localeCompare(b.nomeResidente);
        });

        return res.status(200).json(slots);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao buscar dados do dia.' });
    }
}

// -----------------------------------------------
// POST: registra ou atualiza administração (upsert)
// -----------------------------------------------
async function registrar(req: NextApiRequest, res: NextApiResponse, col: any) {
    const body = req.body;
    const { prescricaoId, residenteId, funcionarioId, data, horarioPrevisto, status, horarioAdministrado, observacao } = body;

    if (!prescricaoId || !residenteId || !funcionarioId || !data || !horarioPrevisto || !status) {
        return res.status(400).json({ message: 'Campos obrigatórios: prescricaoId, residenteId, funcionarioId, data, horarioPrevisto, status.' });
    }

    const now = getCurrentDateTime();
    const filtro = { prescricaoId, data, horarioPrevisto };
    const doc = {
        prescricaoId, residenteId, funcionarioId,
        data, horarioPrevisto,
        status,
        horarioAdministrado: horarioAdministrado || null,
        observacao: observacao || null,
        updatedAt: now,
    };

    try {
        const existing = await col.findOne(filtro);
        if (existing) {
            await col.updateOne({ _id: existing._id }, { $set: doc });
            return res.status(200).json({ message: 'Registro atualizado.' });
        } else {
            await col.insertOne({ ...doc, createdAt: now, _id: new ObjectId() });
            return res.status(201).json({ message: 'Registro criado.' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao registrar administração.' });
    }
}

// -----------------------------------------------
// PUT: atualiza status de um registro existente
// -----------------------------------------------
async function updateStatus(req: NextApiRequest, res: NextApiResponse, col: any) {
    const { id } = req.query as { id: string };
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'ID inválido.' });

    const { status, horarioAdministrado, observacao } = req.body;
    if (!status) return res.status(400).json({ message: 'Status é obrigatório.' });

    try {
        const result = await col.updateOne(
            { _id: new ObjectId(id) },
            { $set: { status, horarioAdministrado: horarioAdministrado || null, observacao: observacao || null, updatedAt: getCurrentDateTime() } }
        );
        if (result.matchedCount === 0) return res.status(404).json({ message: 'Registro não encontrado.' });
        return res.status(200).json({ message: 'Status atualizado.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao atualizar status.' });
    }
}
