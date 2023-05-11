import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export default async function handler(req: NextApiRequest, res: NextApiResponse,) {

  const { db, client } = await connect();
  const mainCollection = db.collection('usuario')

  switch (req.method) {

    case 'POST':

      // -------------------------
      // Realizar o LOGIN
      // -------------------------
<<<<<<< HEAD
=======

>>>>>>> 7339cee648b4818c5c69565314a70e00f419a26e
      try {
        const { usuario, senha } = req.body
        const response = await mainCollection.findOne({ usuario });

        if (!response) {
          return res.status(401).json({ message: 'Problema ao realizar login' });
        }

        const match = await bcrypt.compare(senha, response?.senha);

        if (!match) {
          return res.status(401).json({ message: 'A senha fornecida não confere.' });
        }

        if (response.ativo !== 'S') {
          return res.status(401).json({ message: 'O usuário está desativado' });
        }

        if (response) {
          const secret = process.env.JWT_SECRET as string;
          const token = jwt.sign({ userId: response._id }, secret, { expiresIn: '1h' });
          const userInfo = { id: response._id, nome: response.nome + " " + response.sobrenome, fotoPerfil: response.foto_base64 }
          res.status(200).json({ message: "Logado com sucesso", token, userInfo });
        } else {
          res.status(401).json({ message: "Usuário ou senha inválidos" });
        }
      }
      catch (error) {
<<<<<<< HEAD
=======
        console.log(error)
>>>>>>> 7339cee648b4818c5c69565314a70e00f419a26e
        res.status(500).json({ message: "Ocorreu um erro ao realizar o login", error: error });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  await client.close();
}