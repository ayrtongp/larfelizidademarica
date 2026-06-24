import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';

const RESEND_API_KEY = (process.env.RESEND_API_KEY ?? '').split(/\s/)[0];
const FROM_EMAIL = 'noreply@larfelizidade.com.br';
const CC_EMAIL = 'larfelizidademarica@gmail.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://larfelizidade.com.br';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Use POST' });

  const { email } = req.body ?? {};
  if (!email) return res.status(400).json({ message: 'email obrigatório' });

  const pdfPath = 'C:\\Users\\MainUser\\Downloads\\contracheques_individuais_05_2026\\01_000003_CARLOS_HENRIQUE_GONCALVES_TRINDADE.pdf';
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfBase64 = pdfBuffer.toString('base64');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        cc: [CC_EMAIL],
        subject: 'Contracheque — Maio/2026 — Lar Felizidade',
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f9fafb;border-radius:12px">
            <img src="${APP_URL}/images/lar felizidade logo transparente.png" alt="Lar Felizidade" style="height:56px;margin-bottom:24px" />
            <h2 style="color:#1e293b;margin-bottom:8px">Olá, Ayrton Pinheiro</h2>
            <p style="color:#475569;font-size:14px;line-height:1.6;margin-bottom:24px">
              Segue em anexo o seu contracheque referente ao período de <strong>Maio/2026</strong>.
            </p>
            <p style="color:#94a3b8;font-size:12px;line-height:1.5">
              Este é um email automático. Em caso de dúvidas, procure o setor de RH.
            </p>
          </div>
        </body></html>`,
        attachments: [{ filename: 'contracheque_05_2026.pdf', content: pdfBase64 }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ ok: false, error: data });
    }
    return res.status(200).json({ ok: true, id: data.id });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
