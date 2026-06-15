/**
 * Importa a folha de pagamento do JSON comprimido para a collection folha_pagamento.
 *
 * Uso:
 *   node --env-file=.env.local scripts/import-folha-pagamento.mjs
 *
 * O script:
 *   1. Lê o JSON de Downloads/folha_pagamento_05_2026_comprimida.json
 *   2. Para cada funcionário, busca o _id em funcionarios_clt pelo CPF
 *   3. Cria o documento na collection folha_pagamento (bloqueia se já existir)
 */

import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const JSON_PATH = join(homedir(), 'Downloads', 'folha_pagamento_05_2026_comprimida.json');

const client = new MongoClient(process.env.DATABASE_URI);

function somaLancamentos(lista) {
  return (lista || []).reduce((s, l) => s + Number(l.valor || 0), 0);
}

async function run() {
  await client.connect();
  const db = client.db(process.env.DB_LAR);

  // ── Lê o JSON ──────────────────────────────────────────────────────────────
  let folhaJson;
  try {
    folhaJson = JSON.parse(readFileSync(JSON_PATH, 'utf-8'));
  } catch {
    console.error(`❌ Não foi possível ler o arquivo: ${JSON_PATH}`);
    process.exit(1);
  }
  console.log(`✅ JSON lido: ${folhaJson.funcionarios.length} funcionários`);

  const periodo = { mes: 5, ano: 2026 };

  // ── Verifica se já existe folha para o período ──────────────────────────────
  const existente = await db.collection('folha_pagamento').findOne({
    'periodo.mes': periodo.mes,
    'periodo.ano': periodo.ano,
  });
  if (existente) {
    console.error(`❌ Já existe folha para ${periodo.mes}/${periodo.ano} (_id: ${existente._id}). Abortando.`);
    process.exit(1);
  }

  // ── Busca todos os funcionários ativos com CPF ──────────────────────────────
  const funcionariosClt = await db
    .collection('funcionarios_clt')
    .aggregate([
      { $match: {} },
      {
        $addFields: { usuarioObjectId: { $toObjectId: '$usuarioId' } },
      },
      {
        $lookup: {
          from: 'usuario',
          localField: 'usuarioObjectId',
          foreignField: '_id',
          as: 'usuarioArr',
        },
      },
      {
        $addFields: {
          usuario: { $arrayElemAt: ['$usuarioArr', 0] },
        },
      },
      {
        $project: {
          _id: 1,
          cpf: '$dadosPessoais.cpf',
          cargo: '$contrato.cargo',
          nome: { $concat: ['$usuario.nome', ' ', '$usuario.sobrenome'] },
        },
      },
    ])
    .toArray();

  // Índice por CPF para lookup rápido
  const porCpf = {};
  for (const f of funcionariosClt) {
    if (f.cpf) porCpf[f.cpf.replace(/\D/g, '')] = f;
  }

  console.log(`✅ ${funcionariosClt.length} funcionários encontrados no banco`);

  // ── Monta os itens ──────────────────────────────────────────────────────────
  const itens = [];
  const naoEncontrados = [];

  for (const f of folhaJson.funcionarios) {
    const cpfLimpo = (f.cpf || '').replace(/\D/g, '');
    const cadastrado = porCpf[cpfLimpo];

    if (!cadastrado) {
      // Funcionários em benefício/férias com líquido 0 — aceitável não encontrar
      if (f.totais.liquido === 0) {
        console.warn(`⚠️  ${f.nome} (CPF ${f.cpf}) não encontrado — líquido R$0, ignorado`);
        continue;
      }
      naoEncontrados.push(f.nome);
      continue;
    }

    const totalProventos = somaLancamentos(f.proventos);
    const totalDescontos = somaLancamentos(f.descontos);

    itens.push({
      funcionarioId: cadastrado._id.toString(),
      funcionarioNome: cadastrado.nome,
      cargo: cadastrado.cargo || f.funcao,
      proventos: f.proventos.map((p) => ({ descricao: p.descricao, valor: Number(p.valor) })),
      descontos: f.descontos.map((d) => ({ descricao: d.descricao, valor: Number(d.valor) })),
      totalProventos,
      totalDescontos,
      salarioLiquido: totalProventos - totalDescontos,
    });
  }

  if (naoEncontrados.length > 0) {
    console.error('❌ Funcionários com líquido > 0 não encontrados no banco:');
    naoEncontrados.forEach((n) => console.error(`   - ${n}`));
    console.error('Corrija os registros e tente novamente. Abortando.');
    process.exit(1);
  }

  // ── Calcula totais ──────────────────────────────────────────────────────────
  const totalBruto     = itens.reduce((s, i) => s + i.totalProventos, 0);
  const totalDescontos = itens.reduce((s, i) => s + i.totalDescontos, 0);
  const totalLiquido   = itens.reduce((s, i) => s + i.salarioLiquido,  0);

  // ── Busca o usuário admin para createdBy ───────────────────────────────────
  const admin = await db.collection('usuario').findOne({ email: 'ayrtongp@gmail.com' });
  const createdBy = admin?._id?.toString() || 'import-script';

  // ── Insere o documento ─────────────────────────────────────────────────────
  const now = new Date().toISOString();
  const doc = {
    periodo,
    itens,
    totalBruto:     Number(totalBruto.toFixed(2)),
    totalDescontos: Number(totalDescontos.toFixed(2)),
    totalLiquido:   Number(totalLiquido.toFixed(2)),
    createdBy,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection('folha_pagamento').insertOne(doc);

  console.log('');
  console.log('✅ Folha de pagamento importada com sucesso!');
  console.log(`   _id          : ${result.insertedId}`);
  console.log(`   Período      : ${periodo.mes}/${periodo.ano}`);
  console.log(`   Funcionários : ${itens.length}`);
  console.log(`   Total bruto  : R$ ${doc.totalBruto.toFixed(2)}`);
  console.log(`   Total desc.  : R$ ${doc.totalDescontos.toFixed(2)}`);
  console.log(`   Total líq.   : R$ ${doc.totalLiquido.toFixed(2)}`);
}

run()
  .catch((err) => { console.error('❌ Erro:', err); process.exit(1); })
  .finally(() => client.close());
