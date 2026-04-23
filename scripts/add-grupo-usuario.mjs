import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.DATABASE_URI);

async function run() {
  await client.connect();
  const db = client.db(process.env.DB_LAR);

  // Busca grupo coordenacao
  const grupo = await db.collection('grupos').findOne({ cod_grupo: 'coordenacao' });
  if (!grupo) {
    console.error('❌ Grupo "coordenacao" não encontrado na collection grupos.');
    process.exit(1);
  }
  console.log(`✅ Grupo encontrado: ${grupo.nome_grupo} (${grupo._id})`);

  // Busca usuário
  const usuario = await db.collection('usuario').findOne({ email: 'ayrtongp@gmail.com' });
  if (!usuario) {
    console.error('❌ Usuário ayrtongp@gmail.com não encontrado.');
    process.exit(1);
  }
  console.log(`✅ Usuário encontrado: ${usuario.nome} (${usuario._id})`);

  const idGrupo  = usuario._id.toString();
  const idGrupoStr = grupo._id.toString();

  // Verifica se já existe
  const jaExiste = await db.collection('grupos_usuario').findOne({
    id_usuario: usuario._id.toString(),
    id_grupo:   grupo._id.toString(),
  });
  if (jaExiste) {
    console.log('ℹ️  Vínculo já existia — nada a fazer.');
    return;
  }

  const now = new Date().toISOString();
  await db.collection('grupos_usuario').insertOne({
    id_usuario: usuario._id.toString(),
    id_grupo:   grupo._id.toString(),
    createdAt:  now,
    updatedAt:  now,
  });
  console.log(`✅ Vínculo criado: ${usuario.nome} → ${grupo.nome_grupo}`);
}

run()
  .catch((err) => { console.error('❌ Erro:', err); process.exit(1); })
  .finally(() => client.close());
