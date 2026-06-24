import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const col = db.collection('usuario');

  const amostra = await col.find({ ativo: 'S' }).limit(3).toArray();
  const campos = amostra.map(u => ({
    nome: u.nome,
    campos: Object.keys(u).sort(),
  }));

  return res.status(200).json(campos);
}
