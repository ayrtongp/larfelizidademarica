import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.DATABASE_URI);

async function run() {
  await client.connect();
  const db  = client.db(process.env.DB_LAR);
  const col = db.collection('financeiro_movimentacoes');

  const transferencias = await col
    .find({ tipoMovimento: 'transferencia' })
    .toArray();

  console.log(`\nEncontrados: ${transferencias.length} registros com tipoMovimento='transferencia'\n`);

  if (!transferencias.length) {
    console.log('Nada a migrar.');
    return;
  }

  const processados = new Set();
  let saidas   = 0;
  let entradas = 0;
  let orfaos   = 0;

  for (const rec of transferencias) {
    const id = rec._id.toString();
    if (processados.has(id)) continue;

    // Encontra o par espelhado (mesma data/valor/historico, contas invertidas)
    const par = transferencias.find(r => {
      if (r._id.toString() === id)          return false;
      if (processados.has(r._id.toString())) return false;
      return (
        r.contaFinanceiraId === rec.contaDestinoId &&
        r.contaDestinoId    === rec.contaFinanceiraId &&
        r.valor             === rec.valor &&
        r.dataMovimento     === rec.dataMovimento &&
        r.historico         === rec.historico
      );
    });

    if (!par) {
      // Sem par correspondente: marca como saída com flag
      await col.updateOne(
        { _id: rec._id },
        { $set: { tipoMovimento: 'saida', isTransferencia: true } },
      );
      processados.add(id);
      orfaos++;
      console.log(`  [ÓRFÃO]  id=${id} historico="${rec.historico}" — salvo como saída`);
      continue;
    }

    // Menor ObjectId foi inserido primeiro pelo controller (docSaida → docEntrada)
    const recIsSaida = rec._id < par._id;
    const saidaDoc   = recIsSaida ? rec : par;
    const entradaDoc = recIsSaida ? par : rec;

    await col.updateOne(
      { _id: saidaDoc._id },
      { $set: { tipoMovimento: 'saida', isTransferencia: true } },
    );
    await col.updateOne(
      { _id: entradaDoc._id },
      { $set: { tipoMovimento: 'entrada', isTransferencia: true } },
    );

    processados.add(rec._id.toString());
    processados.add(par._id.toString());
    saidas++;
    entradas++;

    console.log(
      `  [PAR] "${rec.historico}" ${rec.dataMovimento} R$${rec.valor}` +
      `  →  saída: ${saidaDoc._id}  /  entrada: ${entradaDoc._id}`,
    );
  }

  console.log(`\nConcluído:`);
  console.log(`  ${saidas}  pares migrados (${saidas} saídas + ${entradas} entradas)`);
  console.log(`  ${orfaos} órfãos salvos como saída\n`);
}

run()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => client.close());
