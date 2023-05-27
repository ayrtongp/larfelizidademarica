import { MongoClient, Db, } from "mongodb";

let db = null

export default async function connect() {
  if (db) {
    return { db }
  }

  const database_uri = process.env.DATABASE_URI

  const client = new MongoClient(database_uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })

  await client.connect()
  db = client.db(process.env.DB_LAR)

  return { db }

}