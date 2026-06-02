import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/utils/authMiddleware';
import connect from '@/utils/Database';
import { ObjectId } from 'mongodb';
import { zipSync, strToU8 } from 'fflate';

const EXPRESS_URL = process.env.NEXT_PUBLIC_URLDO ?? 'https://lobster-app-gbru2.ondigitalocean.app';

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
  if (req.method !== 'GET') return res.status(405).end();
  if (!requireAuth(req, res)) return;

  const mes = Number(req.query.mes);
  const ano = Number(req.query.ano);
  if (!mes || !ano) return res.status(400).json({ error: 'mes e ano obrigatórios' });

  try {
    const { db } = await connect();

    // Busca documentos de folha_ponto do período
    const periodDocs = await db.collection('rh_documentos_periodo')
      .find({ tipo: 'folha_ponto', 'periodo.mes': mes, 'periodo.ano': ano })
      .toArray();

    if (periodDocs.length === 0) {
      return res.status(404).json({ error: 'Nenhuma folha de ponto encontrada para este período' });
    }

    // Busca metadados R2 (bucket + key) de cada arquivo
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

    // Para cada documento, busca URL assinada e baixa o arquivo
    const zipEntries: Record<string, Uint8Array> = {};
    const usedNames = new Set<string>();

    await Promise.all(periodDocs.map(async (doc: any) => {
      const r2Id = doc.r2FileId || doc.cloudFilename;
      if (!r2Id) return;

      const r2Record = r2Map.get(r2Id);
      if (!r2Record) return;

      try {
        // Obtém URL assinada do Express
        const urlRes = await fetch(`${EXPRESS_URL}/r2_files/${encodeURIComponent(r2Id)}`);
        if (!urlRes.ok) return;
        const { url } = await urlRes.json();
        if (!url) return;

        // Baixa o arquivo
        const fileRes = await fetch(url);
        if (!fileRes.ok) return;
        const buffer = await fileRes.arrayBuffer();

        // Nomeia o arquivo
        const ext = (r2Record.originalName ?? 'pdf').split('.').pop() ?? 'pdf';
        const baseName = sanitize(doc.funcionarioNome || 'funcionario');
        let filename = `${baseName}_${String(mes).padStart(2, '0')}_${ano}.${ext}`;
        // Garante nomes únicos
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
      return res.status(404).json({ error: 'Nenhum arquivo disponível para download' });
    }

    const zipBuffer = Buffer.from(zipSync(zipEntries, { level: 6 }));
    const periodo = `${MESES[mes - 1]}_${ano}`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="folhas-ponto-${periodo}.zip"`);
    res.setHeader('Content-Length', zipBuffer.length);
    res.send(zipBuffer);
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? 'Erro ao gerar ZIP' });
  }
}
