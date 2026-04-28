/**
 * Endpoint de migração one-time: cria collection `patient` a partir de idoso_detalhes + usuario.
 *
 * GET /api/admin/migrate-patients?secret=MIGRATION_SECRET
 *
 * Idempotente: pode ser executado múltiplas vezes sem duplicar dados.
 * Retorna relatório com contagens de documentos criados/atualizados.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import connect from '../../../utils/Database';
import crypto from 'crypto';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed.' });

  const secret = process.env.MIGRATION_SECRET;
  const provided = typeof req.query.secret === 'string' ? req.query.secret : '';
  if (!secret || !provided || !timingSafeEqual(secret, provided)) {
    return res.status(403).json({ message: 'Acesso negado.' });
  }

  const { db } = await connect();

  const idosoCol   = db.collection('idoso_detalhes');
  const usuarioCol = db.collection('usuario');
  const patientCol = db.collection('patient');
  const sessionsCol = db.collection('measurement_session');
  const prescCol   = db.collection('prescricao');

  const report = {
    patients_created:   0,
    idosos_updated:     0,
    sessions_updated:   0,
    prescricoes_updated: 0,
    errors:             [] as string[],
  };

  // ── Passo 1: criar patient para cada idoso_detalhes ─────────
  const idosos = await idosoCol.find({}).toArray();

  for (const idoso of idosos) {
    try {
      // Já tem patient_id? Pular criação mas ainda atualizar patient.active se necessário
      const existingPatient = await patientCol.findOne({ usuario_id: String(idoso.usuarioId) });

      if (!existingPatient) {
        // Buscar usuario para dados demográficos
        let usuario: any = null;
        try {
          usuario = await usuarioCol.findOne({ _id: new ObjectId(String(idoso.usuarioId)) });
        } catch {
          report.errors.push(`idoso ${idoso._id}: usuarioId inválido (${idoso.usuarioId})`);
          continue;
        }

        if (!usuario) {
          report.errors.push(`idoso ${idoso._id}: usuario não encontrado (${idoso.usuarioId})`);
          continue;
        }

        const now = new Date().toISOString();
        const insertResult = await patientCol.insertOne({
          usuario_id:        String(idoso.usuarioId),
          idoso_detalhes_id: String(idoso._id),
          given_name:        usuario.nome        ?? '',
          family_name:       usuario.sobrenome   ?? '',
          display_name:      `${usuario.nome ?? ''} ${usuario.sobrenome ?? ''}`.trim(),
          birth_date:        usuario.data_nascimento ?? undefined,
          gender:            usuario.genero      ?? undefined,
          cpf:               usuario.cpf         ?? undefined,
          photo_url:         usuario.foto_cdn    ?? undefined,
          active:            idoso.status === 'ativo',
          created_at:        now,
          updated_at:        now,
        });

        // Gravar patient_id de volta no idoso_detalhes
        await idosoCol.updateOne(
          { _id: idoso._id },
          { $set: { patient_id: String(insertResult.insertedId) } }
        );

        report.patients_created++;
        report.idosos_updated++;
      } else {
        // Garantir que idoso_detalhes tem patient_id atualizado
        if (!idoso.patient_id) {
          await idosoCol.updateOne(
            { _id: idoso._id },
            { $set: { patient_id: String(existingPatient._id) } }
          );
          report.idosos_updated++;
        }
        // Sincronizar status active
        const shouldBeActive = idoso.status === 'ativo';
        if (existingPatient.active !== shouldBeActive) {
          await patientCol.updateOne(
            { _id: existingPatient._id },
            { $set: { active: shouldBeActive, updated_at: new Date().toISOString() } }
          );
        }
      }
    } catch (err: any) {
      report.errors.push(`idoso ${idoso._id}: ${err?.message ?? 'erro desconhecido'}`);
    }
  }

  // ── Passo 2: atualizar measurement_session (elder_id → patient_id) ──
  const sessions = await sessionsCol.find({ elder_id: { $exists: true } }).toArray();

  for (const session of sessions) {
    try {
      // Buscar idoso_detalhes pelo elder_id (antigo ID do idoso)
      const idoso = await idosoCol.findOne({ _id: new ObjectId(String(session.elder_id)) });
      if (!idoso?.patient_id) {
        report.errors.push(`session ${session._id}: patient_id não encontrado para elder_id ${session.elder_id}`);
        continue;
      }

      await sessionsCol.updateOne(
        { _id: session._id },
        {
          $set:   { patient_id: idoso.patient_id },
          $unset: { elder_id: '', elder_name: '' },
        }
      );
      report.sessions_updated++;
    } catch (err: any) {
      report.errors.push(`session ${session._id}: ${err?.message ?? 'erro desconhecido'}`);
    }
  }

  // ── Passo 3: atualizar prescricao (adicionar patient_id) ────
  const prescricoes = await prescCol.find({ patient_id: { $exists: false } }).toArray();

  for (const presc of prescricoes) {
    try {
      if (!presc.residenteId) continue;

      // residenteId aponta para usuario._id
      const idoso = await idosoCol.findOne({ usuarioId: presc.residenteId });
      if (!idoso?.patient_id) {
        report.errors.push(`prescricao ${presc._id}: patient_id não encontrado para residenteId ${presc.residenteId}`);
        continue;
      }

      await prescCol.updateOne(
        { _id: presc._id },
        { $set: { patient_id: idoso.patient_id } }
      );
      report.prescricoes_updated++;
    } catch (err: any) {
      report.errors.push(`prescricao ${presc._id}: ${err?.message ?? 'erro desconhecido'}`);
    }
  }

  return res.status(200).json(report);
}
