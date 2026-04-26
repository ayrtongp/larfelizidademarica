/**
 * Migração: reestruturação do módulo familiar
 *
 * O que faz:
 * 1. Para cada usuario com tipo:'familia' e id_residente definido,
 *    cria um documento em familiar_residente (se ainda não existir)
 * 2. Remove pin_hash e id_residente do documento do usuario
 * 3. Adiciona funcoes:['familiar'] ao usuario
 * 4. Define senha temporária (deve ser trocada no primeiro acesso)
 *
 * Como rodar:
 *   node scripts/migrate-familiar-residente.mjs
 *
 * Pré-requisito: MONGODB_URI no ambiente (ou .env na raiz)
 */

import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env.local') });

const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'larfelizidade';
const SENHA_TEMPORARIA = 'Trocar@123'; // familiar deve trocar no primeiro acesso

if (!URI) {
  console.error('❌  MONGODB_URI não encontrado no .env.local');
  process.exit(1);
}

const client = new MongoClient(URI);

async function main() {
  await client.connect();
  console.log('✅  Conectado ao MongoDB');

  const db = client.db(DB_NAME);
  const colUsuario = db.collection('usuario');
  const colVinculo = db.collection('familiar_residente');

  const familiaUsers = await colUsuario.find({ tipo: 'familia' }).toArray();
  console.log(`🔍  Encontrados ${familiaUsers.length} usuários com tipo:'familia'`);

  const senhaHash = await bcrypt.hash(SENHA_TEMPORARIA, 10);
  let criados = 0;
  let atualizados = 0;

  for (const u of familiaUsers) {
    const userId = String(u._id);
    const residenteId = u.id_residente ? String(u.id_residente) : null;

    // 1. Cria vínculo se tiver id_residente
    if (residenteId) {
      const jaExiste = await colVinculo.findOne({ usuario_id: userId, residente_id: residenteId });
      if (!jaExiste) {
        await colVinculo.insertOne({
          usuario_id:   userId,
          residente_id: residenteId,
          parentesco:   'outro',  // ajustar manualmente se necessário
          ativo:        true,
          createdAt:    new Date().toISOString(),
          updatedAt:    new Date().toISOString(),
        });
        criados++;
        console.log(`  ↳ Vínculo criado: usuario ${u.nome} → residente ${residenteId}`);
      } else {
        console.log(`  ↳ Vínculo já existe: usuario ${u.nome} → residente ${residenteId} (ignorado)`);
      }
    }

    // 2. Atualiza o usuário: remove tipo/pin_hash/id_residente, adiciona funcoes e senha
    await colUsuario.updateOne(
      { _id: u._id },
      {
        $unset: { tipo: '', pin_hash: '', id_residente: '' },
        $set: {
          funcoes:    ['familiar'],
          senha:      u.senha ?? senhaHash,  // mantém senha existente se já tiver uma
          updatedAt:  new Date().toISOString(),
        },
      }
    );
    atualizados++;
  }

  console.log(`\n✅  Migração concluída:`);
  console.log(`    ${criados} vínculo(s) criado(s) em familiar_residente`);
  console.log(`    ${atualizados} usuário(s) atualizado(s) (pin_hash e id_residente removidos)`);
  console.log(`\n⚠️   Senha temporária definida: "${SENHA_TEMPORARIA}"`);
  console.log(`    Informe a cada familiar para trocar a senha no primeiro acesso.`);
  console.log(`\n⚠️   Parentesco definido como 'outro' para todos — revise manualmente se necessário.`);
}

main()
  .catch(err => { console.error('❌  Erro:', err); process.exit(1); })
  .finally(() => client.close());
