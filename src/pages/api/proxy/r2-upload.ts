import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/utils/authMiddleware';

export const config = {
    api: {
        bodyParser: false,
    },
};

const EXPRESS_URL = process.env.NEXT_PUBLIC_URLDO ?? 'https://lobster-app-gbru2.ondigitalocean.app';

const MAX_BODY_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_CONTENT_TYPES = [
    'multipart/form-data',
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
];

function readRawBody(req: NextApiRequest): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        let totalSize = 0;

        req.on('data', (chunk: Buffer) => {
            totalSize += chunk.length;
            if (totalSize > MAX_BODY_BYTES) {
                req.destroy();
                reject(new Error('Arquivo muito grande. Limite de 10 MB.'));
                return;
            }
            chunks.push(chunk);
        });
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'Método não permitido' });
    }

    if (!requireAuth(req, res)) return;

    const contentType = (req.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase();
    const isAllowed = ALLOWED_CONTENT_TYPES.some(t => contentType.startsWith(t));
    if (!isAllowed) {
        return res.status(415).json({ ok: false, error: 'Tipo de arquivo não permitido.' });
    }

    try {
        const rawBody = await readRawBody(req);
        const fullContentType = req.headers['content-type'] ?? '';

        const expressRes = await fetch(`${EXPRESS_URL}/r2_upload`, {
            method: 'POST',
            headers: { 'Content-Type': fullContentType },
            body: rawBody,
        });

        const payload = await expressRes.json().catch(() => ({}));

        return res.status(expressRes.status).json(payload);
    } catch (err: any) {
        const msg = err?.message ?? 'Erro no proxy de upload';
        return res.status(err?.message?.includes('grande') ? 413 : 500).json({ ok: false, error: msg });
    }
}
