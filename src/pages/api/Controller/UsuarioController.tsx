import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'

export default async function handler(req: NextApiRequest, res: NextApiResponse,) {

  const { db, client } = await connect();
  const mainCollection = db.collection('usuario')

  switch (req.method) {

    case 'GET':

      // -------------------------
      // LOCALIZAR O USUÁRIO PELO ID, CASO TENHA NA QUERY
      // -------------------------

      if (req.query.id) {
        const userId = req.query.id as string
        try {
          let usuario
          if (req.query.registro === "getRegistro") {
            usuario = await mainCollection.findOne({ _id: new ObjectId(userId) },
              { projection: { nome: 1, sobrenome: 1, funcao: 1, registro: 1 } })
          }
          else if (req.query.registro === "admin") {
            process.env.NODE_ENV === "development" ? console.log("Log: UsuarioController") : null
            usuario = await mainCollection.findOne({ _id: new ObjectId(userId) },
              { projection: { admin: 1 } })
          }
          else {
            usuario = await mainCollection.findOne({ _id: new ObjectId(userId) },)
          }

          const url = `UsuarioController?id=${userId}`

          if (!usuario) { res.status(404).json({ message: 'Usuário não encontrado', id: userId, url: url, method: 'GET' }); }
          res.status(200).json({ usuario, message: 'Usuário Localizado', url: url, method: 'GET' });

        } catch (error) {
          console.log(error)
          await client.close();
          res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // LISTAR TODOS OS USUÁRIOS
      // -------------------------

      else {
        try {
          const usuarios = await mainCollection.find(
            {},
            { projection: { _id: 1, usuario: 1, nome: 1, sobrenome: 1, email: 1, tipo: 1, status: 1 } })
            .toArray();
          const url = `UsuarioController`

          res.status(200).json({ usuarios, message: 'Lista de Usuários', url: url });
        } catch (err) {
          await client.close();
          res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
        }
      }

      break;

    case 'POST':

      // -------------------------
      // CRIAR NOVO USUÁRIO
      // -------------------------

      try {
        const novoUsuario = JSON.parse(req.body)

        if (!novoUsuario.nome || !novoUsuario.sobrenome || !novoUsuario.usuario || !novoUsuario.senha
          || !novoUsuario.admin || !novoUsuario.email || !novoUsuario.repetirSenha) {
          res.status(400).json({ message: 'Faltam campos para continuar a ação, favor verificar!', method: 'POST', url: `UsuarioController` });
        }

        const isUser = await mainCollection.findOne({ usuario: novoUsuario.usuario })
        if (isUser) {
          res.status(400).json({ message: `Este usuário já existe: ${novoUsuario.usuario}.`, method: 'POST', url: `UsuarioController` });
        }

        const isEmail = await mainCollection.findOne({ email: novoUsuario.email })
        if (isEmail) {
          res.status(400).json({ message: `Este email já está cadastrado: ${novoUsuario.email}.`, method: 'POST', url: `UsuarioController` });
        }

        const passMatch = novoUsuario.senha === novoUsuario.repetirSenha
        if (!passMatch) {
          res.status(400).json({ message: `As senhas informadas não são idênticas`, method: 'POST', url: `UsuarioController` });
        }

        if (novoUsuario.senha.length < 6) {
          res.status(400).json({ message: 'A senha deve conter no mínimo 6 caracteres' });
        }

        const hashedPassword = await bcrypt.hash(novoUsuario.senha, 10);

        const userObj = {
          "nome": novoUsuario.nome,
          "sobrenome": novoUsuario.sobrenome,
          "usuario": novoUsuario.usuario,
          "dataNascimento": novoUsuario.dataNascimento,
          "email": novoUsuario.email,
          "funcao": novoUsuario.funcao,
          "registro": novoUsuario.registro,
          "senha": hashedPassword,
          "ativo": novoUsuario.ativo,
          "admin": novoUsuario.admin,
          "createdAt": Date.now(),
          "updatedAt": Date.now(),
        }

        const newUser = await mainCollection.insertOne(userObj);
        const message = `Novo usuário: ${novoUsuario.usuario}`
        const url = `UsuarioController?id=${newUser.insertedId}`
        res.status(201).json({ message: message, url: url, method: 'POST', userId: newUser.insertedId });
      } catch (err) {
        await client.close();
        res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
      }
      break;

    // -------------------------
    // ALTERA USUÁRIO | FOTO | SENHA | TUDO
    // -------------------------

    case 'PUT':
      try {
        const myObjectId = new ObjectId(req.query.id as unknown as ObjectId);
        const bodyObject = JSON.parse(req.body)

        if (req.query.tipo === 'alteraFoto' && bodyObject.foto_base64) {
          const novaFoto = bodyObject.foto_base64
          await mainCollection.updateOne({ _id: myObjectId }, { $set: { foto_base64: novaFoto } },);
          res.status(201).json({ message: 'Foto do usuário alterada com sucesso!', method: 'PUT', url: `UsuarioController?tipo=${req.query.tipo}&id=${req.query.id}` });
        }
        else if (req.query.tipo === 'alteraSenha' && (bodyObject.newPass === bodyObject.repPass)) {
          const novaSenha = await bcrypt.hash(bodyObject.newPass, 10);
          await mainCollection.updateOne({ _id: myObjectId }, { $set: { senha: novaSenha } },);
          res.status(201).json({ message: 'Senha do usuário alterada com sucesso!', method: 'PUT', url: `UsuarioController?tipo=${req.query.tipo}&id=${req.query.id}` });
        }
        else if (req.query.tipo === 'alteraDados') {
          await mainCollection.updateOne({ _id: myObjectId }, { $set: bodyObject },);
          res.status(201).json({ message: 'Senha do usuário alterada com sucesso!', method: 'PUT', url: `UsuarioController?tipo=${req.query.tipo}&id=${req.query.id}` });
        }
        else {
          res.status(409).json({ message: 'Condição inválida, verificar a requisição!', method: 'PUT', url: `UsuarioController?tipo=${req.query.tipo}&id=${req.query.id}` });
        }
      } catch (err) {
        await client.close();
        res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
      }
      break;

    // -------------------------
    // EXCLUI UM USUÁRIO
    // -------------------------

    case 'DELETE':
      try {
        const myObjectId = new ObjectId(req.query.id as unknown as ObjectId);
        const url = `UsuarioController?id=${req.query.id}`
        const result = await mainCollection.deleteOne({ _id: myObjectId });

        if (result.deletedCount === 0) {
          res.status(404).json({ message: 'Usuário não encontrado!', });
        }

        res.status(201).json({ message: 'Usuário deletado com sucesso', url: url, method: 'DELETE' });
      } catch (err) {
        await client.close();
        res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  return await client.close();
}