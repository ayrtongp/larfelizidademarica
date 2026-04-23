import { MongoClient, ObjectId } from 'mongodb';

const client = new MongoClient(process.env.DATABASE_URI);

async function run() {
  await client.connect();
  const db = client.db(process.env.DB_LAR);

  const patients    = db.collection('patient');
  const idososCol   = db.collection('idoso_detalhes');

  const allPatients = await patients.find({}).toArray();
  console.log(`\n📋 Total de patients: ${allPatients.length}`);

  let criados = 0;
  let jaExistiam = 0;
  let pulados = 0;

  for (const p of allPatients) {
    const pid = p._id.toString();

    // Verifica se já existe idoso_detalhes vinculado a este patient
    const porPatientId  = await idososCol.findOne({ patient_id: pid });

    // Verifica também pelo usuarioId (vínculo legado)
    const porUsuarioId  = p.usuario_id
      ? await idososCol.findOne({ usuarioId: p.usuario_id })
      : null;

    if (porPatientId || porUsuarioId) {
      console.log(`  ✅ Já existe: ${p.display_name ?? p.given_name}`);
      jaExistiam++;
      continue;
    }

    // Cria idoso_detalhes mínimo vinculado ao patient
    const now = new Date().toISOString();
    const doc = {
      patient_id:         pid,
      usuarioId:          p.usuario_id ?? undefined,
      status:             'ativo',
      admissao: {
        dataEntrada:         now.split('T')[0],   // hoje
        modalidadePrincipal: 'residencia_fixa',
      },
      responsavel:         {},
      composicaoFamiliar:  [],
      historico:           {},
      documentos:          {},
      observacoes:         '',
      createdBy:           'migration',
      createdAt:           now,
      updatedAt:           now,
    };

    const result = await idososCol.insertOne(doc);
    const idosoId = result.insertedId.toString();

    // Atualiza patient com o idoso_detalhes_id
    await patients.updateOne(
      { _id: p._id },
      { $set: { idoso_detalhes_id: idosoId } }
    );

    console.log(`  ➕ Criado: ${p.display_name ?? p.given_name} (${idosoId})`);
    criados++;
  }

  console.log(`\n✅ Migração concluída`);
  console.log(`   Criados:     ${criados}`);
  console.log(`   Já existiam: ${jaExistiam}`);
  console.log(`   Pulados:     ${pulados}`);
}

run()
  .catch((err) => { console.error('❌ Erro:', err); process.exit(1); })
  .finally(() => client.close());
