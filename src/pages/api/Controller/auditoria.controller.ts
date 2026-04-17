import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { db } = await connect();

  const {
    entidade,
    entidadeId,
    acao,
    busca,
    from,
    to,
    page: pageParam = '1',
    limit: limitParam = '20',
  } = req.query;

  if (!entidade || typeof entidade !== 'string') {
    return res.status(400).json({ message: 'Parâmetro "entidade" é obrigatório.' });
  }

  const page  = Math.max(1, parseInt(pageParam  as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(limitParam as string, 10) || 20));
  const skip  = (page - 1) * limit;

  const filter: Record<string, unknown> = { entidade };
  if (entidadeId && typeof entidadeId === 'string') filter.entidadeId = entidadeId;
  if (acao       && typeof acao        === 'string') filter.acao = acao;
  if (busca      && typeof busca       === 'string') filter.nomeEntidade = { $regex: busca, $options: 'i' };

  if (from || to) {
    const dateFilter: Record<string, string> = {};
    if (from && typeof from === 'string') dateFilter.$gte = from;
    if (to   && typeof to   === 'string') dateFilter.$lte = `${to}T23:59:59.999Z`;
    filter.realizadoEm = dateFilter;
  }

  try {
    const [total, data] = await Promise.all([
      db.collection('auditoria').countDocuments(filter),
      db.collection('auditoria')
        .find(filter)
        .sort({ realizadoEm: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
    ]);

    return res.status(200).json({
      data: data.map((d: any) => ({ ...d, _id: d._id.toString() })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao buscar registros de auditoria.' });
  }
}
