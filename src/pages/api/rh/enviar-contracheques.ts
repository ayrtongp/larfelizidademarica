import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb';

const RESEND_API_KEY = (process.env.RESEND_API_KEY ?? '').split(/\s/)[0];
const EXPRESS_URL = process.env.NEXT_PUBLIC_URLDO ?? 'https://lobster-app-gbru2.ondigitalocean.app';
const FROM_EMAIL = 'noreply@larfelizidade.com.br';
const CC_EMAIL = 'larfelizidademarica@gmail.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://larfelizidade.com.br';

async function enviarEmailResend(params: { to: string; cc: string[]; subject: string; html: string; attachments: { filename: string; content: string }[] }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, ...params }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Resend error ${res.status}`);
  }
  return res.json();
}

const MESES = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function isEmailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function resolverDestinatarios(db: any, mes: number, ano: number) {
  const docsCol = db.collection('rh_documentos_periodo');
  const funcionariosCol = db.collection('funcionarios_clt');
  const usuariosCol = db.collection('usuario');

  const contracheques = await docsCol.find({
    tipo: 'contracheque',
    'periodo.mes': Number(mes),
    'periodo.ano': Number(ano),
  }).toArray();

  const destinatarios: { nome: string; email: string; status: 'ok' | 'sem_email' | 'email_invalido'; docId: string; r2FileId: string; filename: string; emailEnviadoEm: string | null }[] = [];

  for (const doc of contracheques) {
    const funcionario = await funcionariosCol.findOne(
      { _id: new ObjectId(doc.funcionarioId) },
      { projection: { usuarioId: 1 } }
    );

    const enviadoEm = doc.emailEnviadoEm ?? null;

    if (!funcionario?.usuarioId) {
      destinatarios.push({ nome: doc.funcionarioNome, email: '', status: 'sem_email', docId: doc._id.toString(), r2FileId: doc.r2FileId ?? doc.cloudFilename, filename: doc.filename, emailEnviadoEm: enviadoEm });
      continue;
    }

    const usuario = await usuariosCol.findOne(
      { _id: new ObjectId(funcionario.usuarioId) },
      { projection: { nome: 1, sobrenome: 1, email: 1 } }
    );

    const email = usuario?.email?.trim() ?? '';
    const nomeCompleto = usuario ? `${usuario.nome ?? ''} ${usuario.sobrenome ?? ''}`.trim() : doc.funcionarioNome;

    if (!email) {
      destinatarios.push({ nome: nomeCompleto, email: '', status: 'sem_email', docId: doc._id.toString(), r2FileId: doc.r2FileId ?? doc.cloudFilename, filename: doc.filename, emailEnviadoEm: enviadoEm });
    } else if (!isEmailValido(email)) {
      destinatarios.push({ nome: nomeCompleto, email, status: 'email_invalido', docId: doc._id.toString(), r2FileId: doc.r2FileId ?? doc.cloudFilename, filename: doc.filename, emailEnviadoEm: enviadoEm });
    } else {
      destinatarios.push({ nome: nomeCompleto, email, status: 'ok', docId: doc._id.toString(), r2FileId: doc.r2FileId ?? doc.cloudFilename, filename: doc.filename, emailEnviadoEm: enviadoEm });
    }
  }

  destinatarios.sort((a, b) => {
    const order = { ok: 0, email_invalido: 1, sem_email: 2 };
    return order[a.status] - order[b.status] || a.nome.localeCompare(b.nome, 'pt-BR');
  });

  return destinatarios;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();

  // GET — preview: lista destinatários com status do email
  if (req.method === 'GET') {
    const mes = Number(req.query.mes);
    const ano = Number(req.query.ano);
    if (!mes || !ano) return res.status(400).json({ message: 'mes e ano obrigatórios.' });

    const destinatarios = await resolverDestinatarios(db, mes, ano);
    const okCount = destinatarios.filter(d => d.status === 'ok').length;
    const semEmail = destinatarios.filter(d => d.status === 'sem_email').length;
    const invalido = destinatarios.filter(d => d.status === 'email_invalido').length;

    return res.status(200).json({
      total: destinatarios.length,
      aptos: okCount,
      semEmail,
      emailInvalido: invalido,
      destinatarios: destinatarios.map(d => ({ nome: d.nome, email: d.email, status: d.status, emailEnviadoEm: d.emailEnviadoEm })),
    });
  }

  // POST — envio efetivo
  if (req.method === 'POST') {
    const { mes, ano } = req.body ?? {};
    if (!mes || !ano) return res.status(400).json({ message: 'mes e ano obrigatórios.' });

    const selecionados: string[] | undefined = req.body.selecionados;
    const destinatarios = await resolverDestinatarios(db, Number(mes), Number(ano));
    const aptos = destinatarios.filter(d => {
      if (d.status !== 'ok') return false;
      if (selecionados && selecionados.length > 0) return selecionados.includes(d.nome);
      return true;
    });

    if (aptos.length === 0) {
      return res.status(400).json({ message: 'Nenhum destinatário com email válido.' });
    }

    const docsCol = db.collection('rh_documentos_periodo');
    const periodoLabel = `${MESES[Number(mes)]}/${ano}`;
    const resultados: { nome: string; email: string; status: 'OK' | 'ERRO'; motivo?: string }[] = [];

    for (const dest of aptos) {
      let pdfBuffer: Buffer;
      try {
        const urlRes = await fetch(`${EXPRESS_URL}/r2_files/${encodeURIComponent(dest.r2FileId)}`);
        if (!urlRes.ok) throw new Error('URL do arquivo não encontrada');
        const { url } = await urlRes.json();
        const fileRes = await fetch(url);
        if (!fileRes.ok) throw new Error('Falha ao baixar arquivo');
        pdfBuffer = Buffer.from(await fileRes.arrayBuffer());
      } catch (err: any) {
        resultados.push({ nome: dest.nome, email: dest.email, status: 'ERRO', motivo: err.message });
        continue;
      }

      try {
        await enviarEmailResend({
          to: dest.email,
          cc: [CC_EMAIL],
          subject: `Contracheque — ${periodoLabel} — Lar Felizidade`,
          html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f9fafb;border-radius:12px">
              <img src="${APP_URL}/images/lar felizidade logo transparente.png" alt="Lar Felizidade" style="height:56px;margin-bottom:24px" />
              <h2 style="color:#1e293b;margin-bottom:8px">Olá, ${dest.nome}</h2>
              <p style="color:#475569;font-size:14px;line-height:1.6;margin-bottom:24px">
                Segue em anexo o seu contracheque referente ao período de <strong>${periodoLabel}</strong>.
              </p>
              <p style="color:#94a3b8;font-size:12px;line-height:1.5">
                Este é um email automático. Em caso de dúvidas, procure o setor de RH.
              </p>
            </div>
          </body></html>`,
          attachments: [{ filename: dest.filename || `contracheque_${mes}_${ano}.pdf`, content: pdfBuffer.toString('base64') }],
        });

        // Registrar envio no documento
        await docsCol.updateOne(
          { _id: new ObjectId(dest.docId) },
          { $set: { emailEnviadoEm: new Date().toISOString(), emailEnviadoPara: dest.email } }
        );

        resultados.push({ nome: dest.nome, email: dest.email, status: 'OK' });
      } catch (err: any) {
        resultados.push({ nome: dest.nome, email: dest.email, status: 'ERRO', motivo: err.message });
      }
    }

    return res.status(200).json({
      enviados: resultados.filter(r => r.status === 'OK').length,
      erros: resultados.filter(r => r.status === 'ERRO').length,
      detalhes: resultados,
    });
  }

  return res.status(405).json({ message: 'Método não permitido.' });
}
