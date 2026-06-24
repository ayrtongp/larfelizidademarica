import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Use POST' });

  const { db } = await connect();
  const col = db.collection('rh_documentos_periodo');

  // Reverter: contracheques voltam para periodo de referência Mai/2026
  const result = await col.updateMany(
    { tipo: 'contracheque', 'periodo.mes': 6, 'periodo.ano': 2026, uploadedBy: 'script' },
    { $set: { 'periodo.mes': 5, 'periodo.ano': 2026 } }
  );

  return res.status(200).json({
    matched: result.matchedCount,
    modified: result.modifiedCount,
    message: `${result.modifiedCount} contracheques revertidos para periodo referência Mai/2026`,
  });
}
