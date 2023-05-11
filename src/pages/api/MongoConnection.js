import { MongoClient, ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const uri = process.env.DATABASE_URI
  const db_lar = process.env.DB_LAR

  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  });

  // try {
  //   await client.connect();

  //   const database = client.db('larfelizidade');
  //   const collection = database.collection('idoso');
  //   const user = { name: 'Ribeira Charming Duplex' };
  //   const response = await collection.findOne(user);

  //   res.status(200).json(response);
  // } catch (err) {
  //   console.error(err);
  //   res.status(500).json({ error: 'Failed to connect to MongoDB' });
  // }

  try {
    await client.connect()
    const database = client.db('larfelizidade');
    const collection = database.collection('idoso');

    const doc = { name: 'test', age: 'test' }
    const result = await collection.insertOne(doc)

    res.status(200).json(result)
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' })
  } finally {
    await client.close()
  }

  // try {
  //   await client.connect()

  //   const db = client.db('larfelizidade')
  //   const collection = db.collection('idoso')

  //   const id = "6441a6186b59c42c1fc0fc51"

  //   const result = await collection.deleteOne({
  //     _id: new ObjectId(id),
  //   })


  //   console.log(`${stringify(result)}`)
  //   console.log(`${result.deletedCount} document(s) deleted`)

  //   res.status(200).json({ success: true, result: result })
  // } catch (err) {
  //   console.error(err)
  //   res.status(500).json({ success: false })
  // } finally {
  //   await client.close()
  // }

}
