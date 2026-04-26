import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.DATABASE_URI);

async function run() {
  await client.connect();
  const db = client.db(process.env.DB_LAR);
  const col = db.collection('insumos');

  const result = await col.updateMany(
    { unidade: { $exists: true }, unidade_base: { $exists: false } },
    [{ $set: { unidade_base: '$unidade' } }]
  );

  console.log(`\n✅ Migração concluída: ${result.modifiedCount} documento(s) atualizados.`);
  console.log('   Campo "unidade_base" criado com o valor de "unidade" em cada insumo.\n');
  console.log('   Após validar, remova o campo legado com:');
  console.log('   db.insumos.updateMany({}, { $unset: { unidade: "" } })\n');
}

run().catch(console.error).finally(() => client.close());
