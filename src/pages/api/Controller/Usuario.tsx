import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'

export default async function handler(req: NextApiRequest, res: NextApiResponse,) {

  const { db } = await connect();
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
            usuario = await mainCollection.findOne({ _id: new ObjectId(userId) },
              { projection: { admin: 1 } })
          }
          else {
            usuario = await mainCollection.findOne({ _id: new ObjectId(userId) },)
          }

          const url = `Usuario?id=${userId}`

          if (!usuario) { return res.status(404).json({ message: 'Usuário não encontrado', id: userId, url: url, method: 'GET' }); }
          return res.status(200).json({ usuario, message: 'Usuário Localizado', url: url, method: 'GET' });

        } catch (error) {
          console.error(error)
          return res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // GET All Residentes
      // -------------------------

      else if (req.query.type === 'getProfissionais') {
        try {
          const documents = await mainCollection.find(
            {},
            { projection: { _id: 1, nome: 1, sobrenome: 1, funcao: 1, registro: 1 } })
            .sort({ nome: 1 }).toArray();
          return res.status(200).json(documents);
        } catch (err) {
          console.error(err)
          return res.status(500).json({ message: 'getAll: Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // GET DADOS PERFIL - Retorna dados do usuário e grupos associados
      // -------------------------

      else if (req.query.type === 'getDadosPerfil') {
        const userId = req.query._id as string;

        try {

          const result = await mainCollection.aggregate(pipe_usu_dados_grupos(userId)).toArray();

          if (result.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado', id: userId, method: 'GET' });
          }
          return res.status(200).json({ result: result[0], message: 'Usuário Localizado', method: 'GET' });

        } catch (err) {
          console.error(err)
          return res.status(500).json({ message: 'getAll: Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // LISTAR POR FUNCAO (ex: type=getByFuncao&funcao=familiar)
      // -------------------------

      else if (req.query.type === 'getByFuncao') {
        const { funcao } = req.query;
        if (!funcao) return res.status(400).json({ message: 'funcao é obrigatório.' });
        try {
          const docs = await mainCollection.find(
            { funcoes: funcao },
            { projection: { _id: 1, nome: 1, sobrenome: 1, usuario: 1, email: 1, ativo: 1, funcoes: 1 } }
          ).sort({ nome: 1 }).toArray();
          return res.status(200).json(docs);
        } catch (err) {
          return res.status(500).json({ message: 'getByFuncao: Erro não identificado.' });
        }
      }

      // -------------------------
      // LISTAR TODOS OS USUÁRIOS
      // -------------------------

      else {
        try {
          const usuarios = await mainCollection.find(
            {},
            { projection: { _id: 1, usuario: 1, nome: 1, sobrenome: 1, email: 1, foto_base64: 1, ativo: 1, admin: 1, dataNascimento: 1, funcao: 1, funcoes: 1, registro: 1 } })
            .toArray();
          const url = `Usuario`

          return res.status(200).json({ usuarios, message: 'Lista de Usuários', url: url });
        } catch (err) {
          return res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
        }
      }

      break;

    case 'POST':

      // -------------------------
      // RETORNAR UM ARRAY DE USUARIOS
      // -------------------------

      if (req.query.type == 'arrayIds') {
        try {

          const { arrayIds } = JSON.parse(req.body)
          const transformedData = arrayIds.map((id: string) => new ObjectId(id));
          const query = {
            _id: { $in: transformedData }
          }

          const fields = {
            projection: { _id: 1, nome: 1, sobrenome: 1, funcao: 1, registro: 1 }
          }

          const result = await mainCollection.find(query, fields).toArray()

          return res.status(201).json({ result, method: 'POST', type: 'arrayIds' });

        } catch (error) {
          return res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
        }
      }

      // -------------------------
      // CRIAR USUÁRIO FAMILIAR (campos simplificados, sem CPF/telefone)
      // -------------------------

      if (req.query.type === 'newFamiliar') {
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const { nome, sobrenome, usuario, email, senha, funcoes = ['familiar'], ativo = 'S' } = body;

          if (!nome?.trim() || !usuario?.trim() || !senha) {
            return res.status(400).json({ message: 'nome, usuario e senha são obrigatórios.' });
          }
          if (String(senha).length < 6) {
            return res.status(400).json({ message: 'Senha deve ter mínimo 6 caracteres.' });
          }

          const jaExiste = await mainCollection.findOne({ usuario: usuario.trim() });
          if (jaExiste) {
            return res.status(400).json({ message: `Usuário já existe: ${usuario.trim()}` });
          }

          const senhaHash = await bcrypt.hash(String(senha), 10);
          const doc = {
            nome:       nome.trim(),
            sobrenome:  sobrenome?.trim() || '',
            usuario:    usuario.trim(),
            email:      email?.trim() || null,
            senha:      senhaHash,
            funcoes:    Array.isArray(funcoes) ? funcoes : [funcoes],
            ativo,
            admin:      'N',
            createdAt:  Date.now(),
            updatedAt:  Date.now(),
          };

          const result = await mainCollection.insertOne(doc);
          return res.status(201).json({ id: result.insertedId });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'newFamiliar: Erro não identificado.' });
        }
      }

      // -------------------------
      // CRIAR NOVO USUÁRIO
      // -------------------------

      try {
        const novoUsuario = JSON.parse(req.body)

        if (!novoUsuario.nome || !novoUsuario.sobrenome || !novoUsuario.cpf || !novoUsuario.dataNascimento
          || !novoUsuario.telefone || !novoUsuario.usuario || !novoUsuario.senha
          || !novoUsuario.admin || !novoUsuario.ativo || !novoUsuario.repetirSenha) {
          return res.status(400).json({ message: 'Faltam campos obrigatórios: nome, sobrenome, CPF, nascimento, telefone, usuário e senha são necessários.', method: 'POST', url: `Usuario` });
        }

        const isUser = await mainCollection.findOne({ usuario: novoUsuario.usuario })
        if (isUser) {
          return res.status(400).json({ message: `Este usuário já existe: ${novoUsuario.usuario}.`, method: 'POST', url: `Usuario` });
        }

        const isCpf = await mainCollection.findOne({ cpf: novoUsuario.cpf })
        if (isCpf) {
          return res.status(400).json({ message: `Este CPF já está cadastrado.`, method: 'POST', url: `Usuario` });
        }

        if (novoUsuario.email) {
          const isEmail = await mainCollection.findOne({ email: novoUsuario.email })
          if (isEmail) {
            return res.status(400).json({ message: `Este email já está cadastrado: ${novoUsuario.email}.`, method: 'POST', url: `Usuario` });
          }
        }

        const passMatch = novoUsuario.senha === novoUsuario.repetirSenha
        if (!passMatch) {
          return res.status(400).json({ message: `As senhas informadas não são idênticas`, method: 'POST', url: `Usuario` });
        }

        if (novoUsuario.senha.length < 6) {
          return res.status(400).json({ message: 'A senha deve conter no mínimo 6 caracteres' });
        }

        const hashedPassword = await bcrypt.hash(novoUsuario.senha, 10);

        const userObj = {
          "nome": novoUsuario.nome,
          "sobrenome": novoUsuario.sobrenome,
          "cpf": novoUsuario.cpf,
          "dataNascimento": novoUsuario.dataNascimento,
          "telefone": novoUsuario.telefone,
          "usuario": novoUsuario.usuario,
          "email": novoUsuario.email || null,
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
        const url = `Usuario?id=${newUser.insertedId}`
        return res.status(201).json({ message: message, url: url, method: 'POST', userId: newUser.insertedId });
      } catch (err) {
        return res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
      }
      break;

    // -------------------------
    // ALTERA USUÁRIO | FOTO | SENHA | TUDO
    // -------------------------

    case 'PUT':

      try {
        const myObjectId = new ObjectId(req.query.id as unknown as ObjectId);
        const bodyObject = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
        if (req.query.tipo === 'alteraFoto' && bodyObject.foto_base64) {
          const myObjectId = new ObjectId(req.query.id as unknown as ObjectId);
          const bodyObject = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
          const novaFoto = bodyObject.foto_base64
          await mainCollection.updateOne({ _id: myObjectId }, { $set: { foto_base64: novaFoto } },);
          return res.status(201).json({ message: 'Foto do usuário alterada com sucesso!', method: 'PUT', url: `Usuario?tipo=${req.query.tipo}&id=${req.query.id}` });
        }

        // ********************************
        // ********************************
        // PUT - ALTERA SENHA
        // ********************************
        // ********************************

        else if (req.query.tipo === 'alteraSenha') {
          const { currentPass, newPass, repPass } = bodyObject;
          if (!currentPass || !newPass || !repPass) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
          }

          // Verifica se nova senha e confirmação batem
          if (newPass !== repPass) {
            return res.status(400).json({ message: 'Nova senha e confirmação não coincidem.' });
          }

          // Validação de força da senha (exemplo: mínimo 8 caracteres, letra maiúscula, número)
          const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
          if (!passwordRegex.test(newPass)) {
            return res.status(400).json({
              message:
                'A senha deve conter no mínimo 8 caracteres, incluindo pelo menos uma letra maiúscula e um número.',
            });
          }

          // Busca usuário
          const user = await mainCollection.findOne({ _id: myObjectId });
          if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
          }

          // Verifica se a senha atual está correta
          const match = await bcrypt.compare(currentPass, user.senha);
          if (!match) {
            return res.status(401).json({ message: 'Senha atual incorreta.' });
          }

          // Criptografa e atualiza nova senha
          const novaSenha = await bcrypt.hash(newPass, 10);
          await mainCollection.updateOne({ _id: myObjectId }, { $set: { senha: novaSenha } });

          return res.status(200).json({
            message: 'Senha alterada com sucesso!',
            method: 'PUT',
            url: `Usuario?tipo=alteraSenha&id=${req.query.id}`
          });
        }

        // ********************************
        // ********************************
        // PUT - ALTERA DADOS
        // ********************************
        // ********************************

        else if (req.query.tipo === 'alteraDados') {
          const myObjectId = new ObjectId(req.query.id as unknown as ObjectId);
          const bodyObject = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
          await mainCollection.updateOne({ _id: myObjectId }, { $set: bodyObject },);
          return res.status(201).json({ message: 'Dados alterados com sucesso!', method: 'PUT', url: `Usuario?tipo=${req.query.tipo}&id=${req.query.id}` });
        }

        else if (req.query.tipo === 'toggleAtivo') {
          const ativo = req.query.ativo as string;
          if (ativo !== 'S' && ativo !== 'N') {
            return res.status(400).json({ message: 'Valor inválido para ativo. Use S ou N.' });
          }
          await mainCollection.updateOne({ _id: myObjectId }, { $set: { ativo } });
          return res.status(200).json({ ok: true, message: `Usuário ${ativo === 'S' ? 'ativado' : 'desativado'} com sucesso.` });
        }
        else {
          return res.status(409).json({ message: 'Condição inválida, verificar a requisição!', method: 'PUT', url: `Usuario?tipo=${req.query.tipo}&id=${req.query.id}` });
        }
      } catch (err) {
        return res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
      }
      break;

    // -------------------------
    // EXCLUI UM USUÁRIO
    // -------------------------

    case 'DELETE':
      try {
        const myObjectId = new ObjectId(req.query.id as unknown as ObjectId);
        const url = `Usuario?id=${req.query.id}`
        const result = await mainCollection.deleteOne({ _id: myObjectId });

        if (result.deletedCount === 0) {
          return res.status(404).json({ message: 'Usuário não encontrado!', });
        }

        return res.status(201).json({ message: 'Usuário deletado com sucesso', url: url, method: 'DELETE' });
      } catch (err) {
        return res.status(500).json({ message: 'Erro não identificado. Procure um administrador.' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

}


// ***************************************************
// ***************************************************
// ***************************************************
// ***************************************************
// PIPELINES
// ***************************************************
// ***************************************************
// ***************************************************
// ***************************************************

function pipe_usu_dados_grupos(userId: string) { // Retorna os dados do usuário e os grupos associados

  return (
    [
      {
        $match: { _id: new ObjectId(userId) }
      },
      {
        $addFields: {
          id_usuario_str: { $toString: "$_id" }
        }
      },
      {
        $lookup: {
          from: "grupos_usuario",
          let: { usuarioIdStr: "$id_usuario_str" },
          pipeline: [{ $match: { $expr: { $eq: ["$id_usuario", "$$usuarioIdStr"] } } }],
          as: "relacoes"
        }
      },
      {
        $lookup: {
          from: "grupos",
          let: { grupoIds: "$relacoes.id_grupo" },
          pipeline: [{ $match: { $expr: { $in: [{ $toString: "$_id" }, "$$grupoIds"] } } }],
          as: "grupos"
        }
      },
      {
        $project: {
          relacoes: 0,
          senha: 0,
          ativo: 0,
          id_usuario_str: 0,
          admin: 0,
          "grupos.createdAt": 0,
          "grupos.updatedAt": 0,
          "grupos._id": 0
        }
      }
    ]
  )
}