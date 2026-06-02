import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/utils/authMiddleware';
import connect from '@/utils/Database';
import { ObjectId } from 'mongodb';
import { zipSync } from 'fflate';
import { sendDocument } from '@/pages/api/WhatsApp';

const EXPRESS_URL = process.env.NEXT_PUBLIC_URLDO ?? 'https://lobster-app-gbru2.ondigitalocean.app';
const GRUPO_CONTABILIDADE = process.env.WPP_GRUPO_CONTABILIDADE ?? '';

const MESES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function sanitize(name: string): string {
  return String(name)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^\w.\-]+/g, '_')
    .trim() || 'arquivo';
}

export const config = { api: { responseLimit: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!requireAuth(req, res)) return;

  const mes = Number(req.query.mes);
  const ano = Number(req.query.ano);
  if (!mes || !ano) return res.status(400).json({ error: 'mes e ano obrigatórios' });

  if (!GRUPO_CONTABILIDADE) {
    return res.status(500).json({ error: 'WPP_GRUPO_CONTABILIDADE não configurado no servidor' });
  }

  try {
    const { db } = await connect();

    // 1. Busca documentos do período
    const periodDocs = await db.collection('rh_documentos_periodo')
      .find({ tipo: 'folha_ponto', 'periodo.mes': mes, 'periodo.ano': ano })
      .toArray();

    if (periodDocs.length === 0) {
      return res.status(404).json({ error: 'Nenhuma folha de ponto encontrada para este período' });
    }

    const r2Ids = periodDocs
      .map((d: any) => d.r2FileId || d.cloudFilename)
      .filter(Boolean);

    const objectIds = r2Ids
      .map((id: string) => { try { return new ObjectId(id); } catch { return null; } })
      .filter(Boolean) as ObjectId[];

    const r2Records = await db.collection('arquivosr2')
      .find({ _id: { $in: objectIds } })
      .toArray();

    const r2Map = new Map<string, any>(r2Records.map((r: any) => [r._id.toString(), r]));

    // 2. Baixa cada arquivo e monta o ZIP
    const zipEntries: Record<string, Uint8Array> = {};
    const usedNames = new Set<string>();

    await Promise.all(periodDocs.map(async (doc: any) => {
      const r2Id = doc.r2FileId || doc.cloudFilename;
      if (!r2Id) return;
      const r2Record = r2Map.get(r2Id);
      if (!r2Record) return;

      try {
        const urlRes = await fetch(`${EXPRESS_URL}/r2_files/${encodeURIComponent(r2Id)}`);
        if (!urlRes.ok) return;
        const { url } = await urlRes.json();
        if (!url) return;

        const fileRes = await fetch(url);
        if (!fileRes.ok) return;
        const buffer = await fileRes.arrayBuffer();

        const ext = (r2Record.originalName ?? 'pdf').split('.').pop() ?? 'pdf';
        const baseName = sanitize(doc.funcionarioNome || 'funcionario');
        let filename = `${baseName}_${String(mes).padStart(2, '0')}_${ano}.${ext}`;
        let i = 2;
        while (usedNames.has(filename)) {
          filename = `${baseName}_${String(mes).padStart(2, '0')}_${ano}_${i++}.${ext}`;
        }
        usedNames.add(filename);
        zipEntries[filename] = new Uint8Array(buffer);
      } catch {
        // arquivo individual falha — continua
      }
    }));

    if (Object.keys(zipEntries).length === 0) {
      return res.status(404).json({ error: 'Nenhum arquivo disponível' });
    }

    const zipBuffer = Buffer.from(zipSync(zipEntries, { level: 6 }));
    const mesStr = String(mes).padStart(2, '0');
    const zipFilename = `folhas-ponto-${MESES[mes - 1]}_${ano}.zip`;

    // 3. Faz upload do ZIP no R2 como arquivo público para obter URL permanente
    const formData = new FormData();
    formData.append('file', new Blob([zipBuffer], { type: 'application/zip' }), zipFilename);
    formData.append('originalName', zipFilename);
    formData.append('createdBy', 'sistema');
    formData.append('userId', 'sistema');
    formData.append('collection', 'folha_ponto_zip');
    formData.append('folder', `rh/${ano}/${mesStr}`);
    formData.append('resource', 'rh');
    formData.append('isPublic', 'true');

    const uploadRes = await fetch(`${EXPRESS_URL}/r2_upload`, {
      method: 'POST',
      body: formData,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      throw new Error(err.error ?? 'Erro ao fazer upload do ZIP');
    }

    const uploadData = await uploadRes.json();
    const zipUrl: string = uploadData.file?.url;
    if (!zipUrl) throw new Error('URL do ZIP não retornada pelo R2');

    // 4. Envia ao WhatsApp
    const caption = `📊 *Folhas de Ponto — ${MESES[mes - 1]}/${ano}*\n${Object.keys(zipEntries).length} arquivo(s) incluído(s).`;
    await sendDocument(GRUPO_CONTABILIDADE, zipUrl, 'application/zip', zipFilename, caption);

    return res.status(200).json({ ok: true, arquivos: Object.keys(zipEntries).length });
  } catch (err: any) {
    console.error('[folha-ponto-contabilidade]', err);
    return res.status(500).json({ error: err?.message ?? 'Erro ao enviar para contabilidade' });
  }
}
