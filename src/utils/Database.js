import { MongoClient } from "mongodb";

const database_uri = process.env.DATABASE_URI

const client = new MongoClient(database_uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

export default async function connect() {
  await client.connect()
  const db = client.db(process.env.DB_LAR)
  return {db, client}
}