import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import connect from '../../../utils/Database';
import { Patient } from '@/types/T_patient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const patients = db.collection('patient');

  const { type } = req.query;

  // ── GET ─────────────────────────────────────────────────────
  if (req.method === 'GET') {

    // Lista de pacientes ativos (para selects)
    if (type === 'getActivePatients') {
      try {
        // Auto-migração: se patient collection estiver vazia, popula a partir de idoso_detalhes
        const count = await patients.countDocuments();
        if (count === 0) {
          await autoMigrate(db);
        }

        const docs = await patients
          .find({ active: true })
          .project({ _id: 1, display_name: 1, photo_url: 1, active: 1 })
          .sort({ display_name: 1 })
          .toArray();
        return res.status(200).json(docs);
      } catch {
        return res.status(500).json({ message: 'Erro ao buscar pacientes.' });
      }
    }

    // Paciente por ID
    if (type === 'getPatientById' && req.query.id) {
      try {
        const doc = await patients.findOne({ _id: new ObjectId(req.query.id as string) });
        if (!doc) return res.status(404).json({ message: 'Paciente não encontrado.' });
        return res.status(200).json(doc);
      } catch {
        return res.status(500).json({ message: 'Erro ao buscar paciente.' });
      }
    }
  }

  // ── POST ────────────────────────────────────────────────────
  if (req.method === 'POST' && type === 'createPatient') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { residente_id, given_name, family_name, birth_date, gender, cpf, photo_url, active } = body;

      if (!residente_id || !given_name) {
        return res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
      }

      // Idempotência: não cria duplicado
      const existing = await patients.findOne({ residente_id });
      if (existing) {
        return res.status(200).json({ patientId: String(existing._id), created: false });
      }

      const now = new Date().toISOString();
      const doc: Omit<Patient, '_id'> = {
        residente_id,
        given_name,
        family_name: family_name ?? '',
        display_name: `${given_name} ${family_name ?? ''}`.trim(),
        birth_date,
        gender,
        cpf,
        photo_url,
        active: active ?? true,
        created_at: now,
        updated_at: now,
      };

      const result = await patients.insertOne(doc as any);
      return res.status(201).json({ patientId: String(result.insertedId), created: true });
    } catch {
      return res.status(500).json({ message: 'Erro ao criar paciente.' });
    }
  }

  // ── PUT ─────────────────────────────────────────────────────
  if (req.method === 'PUT') {

    // Sync demográfico a partir do usuario (chamado quando usuario é atualizado)
    if (type === 'syncFromUsuario' && req.query.id) {
      try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { given_name, family_name, birth_date, gender, cpf, photo_url } = body;

        const updates: Record<string, any> = { updated_at: new Date().toISOString() };
        if (given_name !== undefined)  updates.given_name  = given_name;
        if (family_name !== undefined) updates.family_name = family_name;
        if (given_name !== undefined || family_name !== undefined) {
          const patient = await patients.findOne({ _id: new ObjectId(req.query.id as string) });
          updates.display_name = `${given_name ?? patient?.given_name} ${family_name ?? patient?.family_name}`.trim();
        }
        if (birth_date !== undefined) updates.birth_date = birth_date;
        if (gender !== undefined)     updates.gender     = gender;
        if (cpf !== undefined)        updates.cpf        = cpf;
        if (photo_url !== undefined)  updates.photo_url  = photo_url;

        await patients.updateOne(
          { _id: new ObjectId(req.query.id as string) },
          { $set: updates }
        );
        return res.status(200).json({ ok: true });
      } catch {
        return res.status(500).json({ message: 'Erro ao sincronizar paciente.' });
      }
    }

    // Atualizar status active (quando idoso muda de status)
    if (type === 'updateActive' && req.query.id) {
      try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        await patients.updateOne(
          { _id: new ObjectId(req.query.id as string) },
          { $set: { active: body.active, updated_at: new Date().toISOString() } }
        );
        return res.status(200).json({ ok: true });
      } catch {
        return res.status(500).json({ message: 'Erro ao atualizar paciente.' });
      }
    }
  }

  return res.status(400).json({ message: 'Operação não reconhecida.' });
}

// ── Auto-migração ─────────────────────────────────────────────
// Popula a collection `patient` a partir de `residentes`.
// Executada automaticamente na primeira chamada a getActivePatients.
async function autoMigrate(db: any) {
  const residentesCol = db.collection('residentes');
  const patientCol    = db.collection('patient');

  const residentes = await residentesCol.find({}).toArray();

  for (const r of residentes) {
    try {
      const existing = await patientCol.findOne({ residente_id: String(r._id) });
      if (existing) continue;

      // Derivar given_name / family_name do nome completo
      const nome: string = r.nome ?? '';
      const spaceIdx = nome.indexOf(' ');
      const given_name  = spaceIdx > 0 ? nome.slice(0, spaceIdx) : nome;
      const family_name = spaceIdx > 0 ? nome.slice(spaceIdx + 1) : '';

      const now = new Date().toISOString();
      await patientCol.insertOne({
        residente_id: String(r._id),
        display_name: nome,
        given_name,
        family_name,
        birth_date:   r.data_nascimento ?? undefined,
        gender:       r.genero          ?? undefined,
        cpf:          r.cpf             ?? undefined,
        photo_url:    r.foto_cdn        ?? undefined,
        active:       r.is_ativo === 'S',
        created_at:   now,
        updated_at:   now,
      });
    } catch { /* pular residente problemático */ }
  }
}
