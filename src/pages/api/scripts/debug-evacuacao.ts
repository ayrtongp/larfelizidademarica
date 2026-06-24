import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const sinaisCol = db.collection('sinaisvitais');
  const residentesCol = db.collection('residentes');

  const residentes = await residentesCol
    .find({ is_ativo: 'S' })
    .project({ nome: 1, apelido: 1 })
    .sort({ nome: 1 })
    .toArray();

  const detalhes: any[] = [];

  for (const r of residentes) {
    const rid = r._id.toString();
    const sinais = await sinaisCol
      .find({ residente_id: rid })
      .sort({ _id: -1 })
      .limit(8)
      .project({ evacuacao: 1, createdAt: 1 })
      .toArray();

    if (sinais.length === 0) continue;

    detalhes.push({
      nome: r.apelido || r.nome,
      ultimos: sinais.map((s: any) => ({ evacuacao: s.evacuacao, createdAt: s.createdAt })),
    });
  }

  return res.status(200).json({ total: detalhes.length, detalhes });
}
