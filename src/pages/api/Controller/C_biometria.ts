import { NextApiRequest, NextApiResponse } from 'next';
import connect from '@/utils/Database';
import jwt from 'jsonwebtoken';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import { ObjectId } from 'mongodb';

const RP_NAME = 'Lar Felizidade';

function getRpId(req: NextApiRequest): string {
  const origin = req.headers.origin || `http://${req.headers.host}`;
  try {
    return new URL(origin).hostname;
  } catch {
    return 'localhost';
  }
}

function getOrigin(req: NextApiRequest): string {
  return (req.headers.origin as string) || `http://${req.headers.host}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const usuarios = db.collection('usuario');
  const { tipo } = req.query;

  try {
    // ─── POST: registrar-inicio ───────────────────────────────────────────────
    if (req.method === 'POST' && tipo === 'registrar-inicio') {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ message: 'userId obrigatório' });

      const user = await usuarios.findOne({ _id: new ObjectId(userId) });
      if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

      const existingCredentials = (user.webauthnCredentials ?? []).map((c: any) => ({
        id: c.id,
        type: 'public-key' as const,
        transports: c.transports,
      }));

      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: getRpId(req),
        userName: user.usuario,
        userID: Buffer.from(userId),
        attestationType: 'none',
        excludeCredentials: existingCredentials,
        authenticatorSelection: {
          residentKey: 'required',   // discoverable credential obrigatório
          userVerification: 'preferred',
        },
      });

      await usuarios.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            _webauthnChallenge: {
              challenge: options.challenge,
              expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            },
          },
        }
      );

      return res.status(200).json(options);
    }

    // ─── POST: registrar-finalizar ────────────────────────────────────────────
    if (req.method === 'POST' && tipo === 'registrar-finalizar') {
      const { userId, response: regResponse, credentialName } = req.body as {
        userId: string;
        response: RegistrationResponseJSON;
        credentialName?: string;
      };
      if (!userId || !regResponse) return res.status(400).json({ message: 'Dados inválidos' });

      const user = await usuarios.findOne({ _id: new ObjectId(userId) });
      if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

      const challengeDoc = user._webauthnChallenge;
      if (!challengeDoc || new Date(challengeDoc.expiresAt) < new Date()) {
        return res.status(400).json({ message: 'Challenge expirado. Tente novamente.' });
      }

      const verification = await verifyRegistrationResponse({
        response: regResponse,
        expectedChallenge: challengeDoc.challenge,
        expectedOrigin: getOrigin(req),
        expectedRPID: getRpId(req),
        requireUserVerification: false,
      });

      if (!verification.verified || !verification.registrationInfo) {
        return res.status(400).json({ message: 'Verificação falhou' });
      }

      const { credential } = verification.registrationInfo;

      const newCredential = {
        id: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString('base64'),
        counter: credential.counter,
        deviceType: verification.registrationInfo.credentialDeviceType,
        backedUp: verification.registrationInfo.credentialBackedUp,
        transports: regResponse.response.transports ?? [],
        registeredAt: new Date().toISOString(),
        name: credentialName || 'Biometria',
      };

      await usuarios.updateOne(
        { _id: new ObjectId(userId) },
        {
          $push: { webauthnCredentials: newCredential } as any,
          $unset: { _webauthnChallenge: '' },
        }
      );

      return res.status(200).json({ message: 'Biometria registrada com sucesso!' });
    }

    // ─── POST: autenticar-inicio ──────────────────────────────────────────────
    // Discoverable credentials: não precisa de username.
    // O browser apresenta um seletor com as passkeys disponíveis para este RP.
    if (req.method === 'POST' && tipo === 'autenticar-inicio') {
      const challenges = db.collection('webauthn_challenges');

      const options = await generateAuthenticationOptions({
        rpID: getRpId(req),
        allowCredentials: [], // vazio = discoverable: browser decide
        userVerification: 'preferred',
      });

      // Guarda challenge numa collection temporária (TTL 5 min)
      await challenges.insertOne({
        _id: options.challenge as any,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });

      return res.status(200).json({ options });
    }

    // ─── POST: autenticar-finalizar ───────────────────────────────────────────
    if (req.method === 'POST' && tipo === 'autenticar-finalizar') {
      const { response: authResponse } = req.body as {
        response: AuthenticationResponseJSON;
      };
      if (!authResponse) return res.status(400).json({ message: 'Dados inválidos' });

      const challenges = db.collection('webauthn_challenges');

      // Recupera challenge pelo clientDataJSON
      const clientData = JSON.parse(
        Buffer.from(authResponse.response.clientDataJSON, 'base64url').toString('utf8')
      );
      const challengeDoc = await challenges.findOne({ _id: clientData.challenge as any });

      if (!challengeDoc || new Date(challengeDoc.expiresAt) < new Date()) {
        return res.status(400).json({ message: 'Challenge expirado. Tente novamente.' });
      }
      await challenges.deleteOne({ _id: clientData.challenge as any });

      // Descobre o userId pelo userHandle que o browser devolve
      if (!authResponse.response.userHandle) {
        return res.status(400).json({ message: 'userHandle ausente — credencial não é discoverable.' });
      }
      const userId = Buffer.from(authResponse.response.userHandle, 'base64url').toString('utf8');

      const user = await usuarios.findOne({ _id: new ObjectId(userId), ativo: 'S' });
      if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

      if (!user.biometriaHabilitada) {
        return res.status(403).json({ message: 'Biometria não habilitada para este usuário' });
      }

      const storedCred = (user.webauthnCredentials ?? []).find(
        (c: any) => c.id === authResponse.id
      );
      if (!storedCred) {
        return res.status(400).json({ message: 'Credencial não encontrada' });
      }

      const verification = await verifyAuthenticationResponse({
        response: authResponse,
        expectedChallenge: clientData.challenge,
        expectedOrigin: getOrigin(req),
        expectedRPID: getRpId(req),
        credential: {
          id: storedCred.id,
          publicKey: Buffer.from(storedCred.publicKey, 'base64'),
          counter: storedCred.counter,
          transports: storedCred.transports,
        },
        requireUserVerification: false,
      });

      if (!verification.verified) {
        return res.status(400).json({ message: 'Verificação biométrica falhou' });
      }

      await usuarios.updateOne(
        { _id: new ObjectId(userId), 'webauthnCredentials.id': storedCred.id },
        { $set: { 'webauthnCredentials.$.counter': verification.authenticationInfo.newCounter } }
      );

      const secret = process.env.JWT_SECRET as string;
      const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '1h' });
      const userInfo = {
        id: user._id,
        nome: `${user.nome} ${user.sobrenome}`,
        fotoPerfil: user.foto_base64,
        funcao: user.funcao,
      };

      return res.status(200).json({ message: 'Login biométrico realizado!', token, userInfo });
    }

    // ─── PUT: toggle-biometria ────────────────────────────────────────────────
    if (req.method === 'PUT' && tipo === 'toggle-biometria') {
      const { userId, habilitar } = req.body;
      if (!userId || habilitar === undefined) return res.status(400).json({ message: 'Dados inválidos' });

      await usuarios.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { biometriaHabilitada: Boolean(habilitar) } }
      );

      return res.status(200).json({ message: habilitar ? 'Biometria habilitada' : 'Biometria desabilitada' });
    }

    // ─── DELETE: remover-credencial ───────────────────────────────────────────
    if (req.method === 'DELETE' && tipo === 'remover-credencial') {
      const { userId, credentialId } = req.body;
      if (!userId || !credentialId) return res.status(400).json({ message: 'Dados inválidos' });

      await usuarios.updateOne(
        { _id: new ObjectId(userId) },
        { $pull: { webauthnCredentials: { id: credentialId } } as any }
      );

      return res.status(200).json({ message: 'Credencial removida' });
    }

    // ─── GET: dados-biometria ─────────────────────────────────────────────────
    if (req.method === 'GET' && tipo === 'dados-biometria') {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ message: 'userId obrigatório' });

      const user = await usuarios.findOne(
        { _id: new ObjectId(userId as string) },
        { projection: { webauthnCredentials: 1, biometriaHabilitada: 1 } }
      );
      if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

      const credentials = (user.webauthnCredentials ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        deviceType: c.deviceType,
        registeredAt: c.registeredAt,
        transports: c.transports,
      }));

      return res.status(200).json({
        biometriaHabilitada: user.biometriaHabilitada ?? false,
        credentials,
      });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error('[C_biometria]', error);
    return res.status(500).json({ message: 'Erro interno', error: String(error) });
  }
}
