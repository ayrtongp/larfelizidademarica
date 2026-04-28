import { MongoClient } from "mongodb";

if (!process.env.DATABASE_URI) {
  throw new Error("Please add your Mongo URI to .env.local");
}

// Em dev, o HMR recarrega módulos mas não o objeto global do Node.
// Guardar aqui evita abrir uma nova conexão a cada reload.
const cache = global._mongoCache ?? (global._mongoCache = { client: null, db: null });

export default async function connect() {
  if (cache.db) return { db: cache.db };

  const client = new MongoClient(process.env.DATABASE_URI);
  await client.connect();

  cache.client = client;
  cache.db     = client.db(process.env.DB_LAR);

  return { db: cache.db };
}
