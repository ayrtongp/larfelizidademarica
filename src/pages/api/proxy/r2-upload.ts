import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
    api: {
        bodyParser: false,
    },
};

const EXPRESS_URL = process.env.NEXT_PUBLIC_URLDO ?? 'https://lobster-app-gbru2.ondigitalocean.app';

function readRawBody(req: NextApiRequest): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'Método não permitido' });
    }

    try {
        const rawBody = await readRawBody(req);
        const contentType = req.headers['content-type'] ?? '';

        const expressRes = await fetch(`${EXPRESS_URL}/r2_upload`, {
            method: 'POST',
            headers: { 'Content-Type': contentType },
            body: rawBody,
        });

        const payload = await expressRes.json().catch(() => ({}));

        return res.status(expressRes.status).json(payload);
    } catch (err: any) {
        return res.status(500).json({ ok: false, error: err?.message ?? 'Erro no proxy de upload' });
    }
}
