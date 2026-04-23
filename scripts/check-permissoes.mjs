import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.DATABASE_URI);

async function run() {
  await client.connect();
  const db = client.db(process.env.DB_LAR);

  const usuario = await db.collection('usuario').findOne({ email: 'ayrtongp@gmail.com' });
  console.log(`Usuário: ${usuario.nome} (${usuario._id})`);

  const permissoes = await db.collection('usuario_permissao')
    .find({ usuario_id: usuario._id.toString() }).toArray();
  console.log('\nPermissões (usuario_permissao):');
  console.log(JSON.stringify(permissoes, null, 2));

  const servicos = await db.collection('portal_servicos').find().toArray();
  console.log('\nPortal Serviços disponíveis:');
  servicos.forEach(s => console.log(`  id=${s.id_servico} | ${s.nome} | ${s.href}`));
}

run()
  .catch((err) => { console.error('❌ Erro:', err); process.exit(1); })
  .finally(() => client.close());
