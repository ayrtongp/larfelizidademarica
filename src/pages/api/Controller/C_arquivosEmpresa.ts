import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import connect from '@/utils/Database';
import { requireAnyGroup } from '@/utils/authMiddleware';
import { ADMINISTRATIVO_GROUP_ID } from '@/constants/accessGroups';

const COMPANY_FOLDER = 'lar-felizidade';
const COMPANY_COLLECTION = 'empresa_arquivos';
const ADMIN_GROUPS = [ADMINISTRATIVO_GROUP_ID, 'administrativo'];

function normalizeFile(doc: any, source: 'empresa' | 'folha_pagamento') {
  const r2FileId = source === 'empresa' ? String(doc._id) : String(doc.r2FileId ?? doc.cloudFilename ?? '');
  return {
    _id: String(doc._id),
    r2FileId,
    source,
    filename: doc.originalName ?? doc.filename ?? '',
    descricao: doc.descricao || doc.originalName || doc.filename || '',
    categoria: source === 'folha_pagamento' ? 'Folha de pagamento' : (Array.isArray(doc.tags) ? doc.tags[0] ?? '' : ''),
    size: String(doc.size ?? ''),
    format: doc.contentType ?? doc.format ?? 'application/octet-stream',
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    periodo: source === 'folha_pagamento' ? doc.periodo : undefined,
  };
}
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!await requireAnyGroup(req, res, ADMIN_GROUPS)) return;

  const { db } = await connect();
  const files = db.collection('arquivosr2');

  if (req.method === 'GET' && req.query.type === 'list') {
    try {
      const [companyFiles, payrollFiles] = await Promise.all([
        files.find({ collection: COMPANY_COLLECTION, folder: COMPANY_FOLDER }).sort({ createdAt: -1 }).toArray(),
        db.collection('folha_pagamento').find({ cloudFilename: { $exists: true, $ne: '' } }).sort({ 'periodo.ano': -1, 'periodo.mes': -1 }).toArray(),
      ]);

      return res.status(200).json({
        ok: true,
        arquivos: [
          ...companyFiles.map((doc: any) => normalizeFile(doc, 'empresa')),
          ...payrollFiles.map((doc: any) => normalizeFile(doc, 'folha_pagamento')),
        ],
      });
    } catch (error: any) {
      return res.status(500).json({ ok: false, error: error?.message ?? 'Erro ao listar arquivos da empresa' });
    }
  }

  if (req.method === 'PUT') {
    const id = typeof req.query.id === 'string' ? req.query.id : '';
    if (!ObjectId.isValid(id)) return res.status(400).json({ ok: false, error: 'id invÃ¡lido' });
    const { descricao, categoria } = req.body ?? {};
    const result = await files.updateOne(
      { _id: new ObjectId(id), collection: COMPANY_COLLECTION, folder: COMPANY_FOLDER },
      { $set: { descricao: String(descricao ?? '').trim(), tags: categoria ? [String(categoria)] : [], updatedAt: new Date().toISOString() } },
    );
    if (!result.matchedCount) return res.status(404).json({ ok: false, error: 'Arquivo da empresa nÃ£o encontrado' });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ ok: false, error: 'MÃ©todo nÃ£o permitido' });
}


