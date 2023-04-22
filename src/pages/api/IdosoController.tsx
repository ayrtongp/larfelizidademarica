import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../utils/Database';
import { ObjectId } from 'mongodb'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { db, client } = await connect();
  const db_lar = 'idoso'

  switch (req.method) {
    case 'GET':
      try {
        const collection = db.collection(db_lar);
        const documents = await collection.find().toArray();
        res.status(200).json({ documents });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
      }
      break;
    case 'POST':
      try {
        const collection = db.collection(db_lar);
        const document = JSON.parse(req.body)
        await collection.insertOne(document);
        res.status(201).json({ message: 'Document created' });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
      }
      break;
    case 'PUT':
      try {
        const collection = db.collection(db_lar);
        await collection.updateOne(
          { _id: req.query.id },
          { $set: req.body },
        );
        res.status(200).json({ message: 'Document updated' });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
      }
      break;
    case 'DELETE':
      try {
        const collection = db.collection(db_lar);
        const id = new ObjectId(req.query.id);
        await collection.deleteOne({ _id: id});
        res.status(200).json({ message: 'Document deleted' });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
      }
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  await client.close();
}