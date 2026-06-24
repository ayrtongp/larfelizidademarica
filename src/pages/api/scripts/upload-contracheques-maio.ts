import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import fs from 'fs';
import path from 'path';

export const config = { api: { bodyParser: false } };

const EXPRESS_URL = process.env.NEXT_PUBLIC_URLDO ?? 'https://lobster-app-gbru2.ondigitalocean.app';
const PDF_DIR = 'C:\\Users\\MainUser\\Downloads\\contracheques_individuais_05_2026';
const JSON_PATH = 'C:\\Users\\MainUser\\Downloads\\folha_pagamento_05_2026_comprimida.json';
const PERIODO = { mes: 5, ano: 2026 };

function normalizeCpf(cpf: string): string {
  return (cpf ?? '').replace(/\D/g, '');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Use POST para executar.' });
  }

  const { db } = await connect();
  const funcionariosCol = db.collection('funcionarios_clt');
  const docsCol = db.collection('rh_documentos_periodo');

  // 1. Ler JSON com CPFs
  const jsonData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
  const funcionariosJson = jsonData.funcionarios as { nome: string; cpf: string }[];

  // 2. Listar PDFs
  const pdfFiles = fs.readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf'));

  // 3. Buscar todos os funcionários CLT com join no usuario
  const funcionariosClt = await funcionariosCol.aggregate([
    { $addFields: { usuarioObjectId: { $toObjectId: '$usuarioId' } } },
    { $lookup: { from: 'usuario', localField: 'usuarioObjectId', foreignField: '_id', as: 'usuarioArr' } },
    { $addFields: { u: { $arrayElemAt: ['$usuarioArr', 0] } } },
    { $project: {
      _id: 1, 'dadosPessoais.cpf': 1, status: 1,
      nomeCompleto: { $concat: [{ $ifNull: ['$u.nome', ''] }, ' ', { $ifNull: ['$u.sobrenome', ''] }] },
    }},
  ]).toArray();

  // 4. Map CPF → funcionario _id
  const cpfToFuncionario = new Map<string, { id: string; nome: string }>();
  for (const f of funcionariosClt) {
    const cpf = normalizeCpf(f.dadosPessoais?.cpf ?? '');
    if (cpf) cpfToFuncionario.set(cpf, { id: f._id.toString(), nome: (f.nomeCompleto ?? '').trim() });
  }

  // 5. Map nome no JSON → CPF, e extrair nome do filename para match
  const nomeJsonToCpf = new Map<string, string>();
  for (const fj of funcionariosJson) {
    nomeJsonToCpf.set(fj.nome.toUpperCase().trim(), normalizeCpf(fj.cpf));
  }

  // 6. Para cada PDF, extrair nome do filename e encontrar o CPF
  const resultados: any[] = [];

  for (const pdfFile of pdfFiles) {
    // Filename format: 01_000003_CARLOS_HENRIQUE_GONCALVES_TRINDADE.pdf
    const baseName = pdfFile.replace('.pdf', '');
    const parts = baseName.split('_');
    // Remove os 2 primeiros segmentos (número e código)
    const nomeParts = parts.slice(2);
    const nomeFromFile = nomeParts.join(' ').toUpperCase();

    // Tentar match com o JSON pelo nome
    let cpfMatch: string | undefined;
    let nomeJsonMatch: string | undefined;

    for (const [nomeJson, cpf] of nomeJsonToCpf) {
      const nomeJsonNorm = nomeJson
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^A-Z ]/g, '').trim();
      const nomeFileNorm = nomeFromFile
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^A-Z ]/g, '').trim();

      if (nomeJsonNorm === nomeFileNorm) {
        cpfMatch = cpf;
        nomeJsonMatch = nomeJson;
        break;
      }
    }

    if (!cpfMatch) {
      resultados.push({ arquivo: pdfFile, status: 'ERRO', motivo: 'Não encontrado no JSON', nomeExtraido: nomeFromFile });
      continue;
    }

    const funcionario = cpfToFuncionario.get(cpfMatch);
    if (!funcionario) {
      resultados.push({ arquivo: pdfFile, status: 'ERRO', motivo: `CPF ${cpfMatch} não encontrado no CLT`, nomeJson: nomeJsonMatch });
      continue;
    }

    // Verificar se já existe contracheque para este período
    const jaExiste = await docsCol.findOne({
      tipo: 'contracheque',
      funcionarioId: funcionario.id,
      'periodo.mes': PERIODO.mes,
      'periodo.ano': PERIODO.ano,
    });

    if (jaExiste) {
      resultados.push({ arquivo: pdfFile, status: 'PULADO', motivo: 'Já existe contracheque para este período', nome: funcionario.nome });
      continue;
    }

    // Upload para R2
    const filePath = path.join(PDF_DIR, pdfFile);
    const fileBuffer = fs.readFileSync(filePath);
    const fileSize = fileBuffer.length;

    const boundary = `----FormBoundary${Date.now()}`;
    const folder = funcionario.id;
    const resource = 'funcionarios_clt';
    const collection = 'contracheque';

    const bodyParts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${pdfFile}"\r\nContent-Type: application/pdf\r\n\r\n`,
      fileBuffer,
      `\r\n--${boundary}\r\nContent-Disposition: form-data; name="originalName"\r\n\r\n${pdfFile}`,
      `\r\n--${boundary}\r\nContent-Disposition: form-data; name="createdBy"\r\n\r\nscript`,
      `\r\n--${boundary}\r\nContent-Disposition: form-data; name="userId"\r\n\r\nscript`,
      `\r\n--${boundary}\r\nContent-Disposition: form-data; name="collection"\r\n\r\n${collection}`,
      `\r\n--${boundary}\r\nContent-Disposition: form-data; name="folder"\r\n\r\n${folder}`,
      `\r\n--${boundary}\r\nContent-Disposition: form-data; name="resource"\r\n\r\n${resource}`,
      `\r\n--${boundary}\r\nContent-Disposition: form-data; name="isPublic"\r\n\r\nfalse`,
      `\r\n--${boundary}--\r\n`,
    ];

    const bodyBuffers = bodyParts.map(p => typeof p === 'string' ? Buffer.from(p) : p);
    const fullBody = Buffer.concat(bodyBuffers);

    try {
      const uploadRes = await fetch(`${EXPRESS_URL}/r2_upload`, {
        method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
        body: fullBody,
      });

      const uploadResult = await uploadRes.json();

      if (!uploadRes.ok || !uploadResult.ok) {
        resultados.push({ arquivo: pdfFile, status: 'ERRO', motivo: 'Falha no upload R2', nome: funcionario.nome, detalhe: uploadResult });
        continue;
      }

      const r2FileId = String(uploadResult.file.id);

      // Criar registro no banco
      const now = new Date().toISOString();
      await docsCol.insertOne({
        tipo: 'contracheque',
        funcionarioId: funcionario.id,
        funcionarioNome: funcionario.nome,
        periodo: PERIODO,
        cloudURL: '',
        filename: pdfFile,
        cloudFilename: r2FileId,
        r2FileId,
        size: String(fileSize),
        format: 'application/pdf',
        descricao: 'Upload em lote — Mai/2026',
        uploadedBy: 'script',
        uploadedByNome: 'Upload automático',
        createdAt: now,
      });

      resultados.push({ arquivo: pdfFile, status: 'OK', nome: funcionario.nome, funcionarioId: funcionario.id });
    } catch (err: any) {
      resultados.push({ arquivo: pdfFile, status: 'ERRO', motivo: err.message, nome: funcionario.nome });
    }
  }

  const ok = resultados.filter(r => r.status === 'OK').length;
  const erros = resultados.filter(r => r.status === 'ERRO').length;
  const pulados = resultados.filter(r => r.status === 'PULADO').length;

  return res.status(200).json({
    resumo: { total: pdfFiles.length, ok, erros, pulados },
    detalhes: resultados,
  });
}
