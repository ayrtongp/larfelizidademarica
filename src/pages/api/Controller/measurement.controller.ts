import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/Database';
import { ObjectId } from 'mongodb';
import { MeasurementSession, Measurement } from '@/types/T_measurement';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connect();
  const sessions    = db.collection('measurement_session');
  const measurements = db.collection('measurement');
  const patientCol  = db.collection('patient');

  const { type } = req.query;

  // ─── GET ─────────────────────────────────────────────────
  if (req.method === 'GET') {

    // Lista paginada de sessões com measurements embutidas
    if (type === 'getSessions') {
      const { patientId, dateFrom, dateTo, page = '1', limit = '20' } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const filter: Record<string, any> = { status: { $ne: 'cancelled' } };
      if (patientId) filter.patient_id = patientId as string;
      if (dateFrom || dateTo) {
        filter.measured_at = {};
        if (dateFrom) filter.measured_at.$gte = dateFrom as string;
        if (dateTo)   filter.measured_at.$lte = (dateTo as string) + 'T23:59:59.999Z';
      }

      try {
        const [total, docs] = await Promise.all([
          sessions.countDocuments(filter),
          sessions.find(filter).sort({ measured_at: -1 }).skip(skip).limit(parseInt(limit as string)).toArray(),
        ]);

        if (docs.length === 0) return res.status(200).json({ sessions: [], total });

        const sessionIds = docs.map((d: any) => String(d._id));
        const measurementDocs = await measurements
          .find({ session_id: { $in: sessionIds }, status: { $ne: 'cancelled' } })
          .toArray();

        // Nome vem diretamente do patient_name gravado na sessão (ou fallback ao patient)
        const missingNames = docs.filter((d: any) => !d.patient_name).map((d: any) => d.patient_id);
        const patientMap = new Map<string, string>();
        if (missingNames.length > 0) {
          const pts = await patientCol
            .find({ _id: { $in: missingNames.map((id: any) => { try { return new ObjectId(id); } catch { return id; } }) } })
            .project({ _id: 1, display_name: 1 })
            .toArray();
          pts.forEach((p: any) => patientMap.set(String(p._id), p.display_name as string));
        }

        const result = docs.map((s: any) => ({
          ...s,
          patient_name: s.patient_name ?? patientMap.get(s.patient_id) ?? 'Paciente',
          measurements: measurementDocs.filter((m: any) => m.session_id === String(s._id)),
        }));

        return res.status(200).json({ sessions: result, total });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao listar sessões.' });
      }
    }

    // Painel "Hoje": último valor por tipo por paciente na data informada
    if (type === 'getTodaySummary') {
      const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
      try {
        const dateFrom = date + 'T00:00:00.000Z';
        const dateTo   = date + 'T23:59:59.999Z';

        const todaySessions = await sessions
          .find({ status: { $ne: 'cancelled' }, measured_at: { $gte: dateFrom, $lte: dateTo } })
          .sort({ measured_at: -1 })
          .toArray();

        if (todaySessions.length === 0) return res.status(200).json([]);

        const sessionIds  = todaySessions.map((s: any) => String(s._id));
        const patientIds  = Array.from(new Set<string>(todaySessions.map((s: any) => s.patient_id as string)));

        const [measurementDocs, patientDocs] = await Promise.all([
          measurements.find({ session_id: { $in: sessionIds }, status: { $ne: 'cancelled' } }).toArray(),
          patientCol
            .find({ _id: { $in: patientIds.map((id: any) => { try { return new ObjectId(id); } catch { return id; } }) } })
            .project({ _id: 1, display_name: 1 })
            .toArray(),
        ]);

        const patientMap = new Map<string, string>(patientDocs.map((p: any) => [String(p._id), p.display_name as string]));
        const sessionTimeMap = new Map<string, string>(todaySessions.map((s: any) => [String(s._id), String(s.measured_at ?? '')]));

        // Para cada paciente, pegar o último valor por type_code
        const patientSummary: Record<string, Record<string, {
          value_numeric?: number; value_text?: string; unit?: string; abnormal_flag?: string; measured_at: string;
        }>> = {};

        for (const m of measurementDocs) {
          const session  = todaySessions.find((s: any) => String(s._id) === m.session_id);
          const pId      = session?.patient_id;
          if (!pId) continue;
          if (!patientSummary[pId]) patientSummary[pId] = {};

          const existing  = patientSummary[pId][m.type_code];
          const measuredAt: string = sessionTimeMap.get(m.session_id) ?? '';
          if (!existing || measuredAt > existing.measured_at) {
            patientSummary[pId][m.type_code] = {
              value_numeric: m.value_numeric,
              value_text:    m.value_text,
              unit:          m.unit,
              abnormal_flag: m.abnormal_flag,
              measured_at:   measuredAt,
            };
          }
        }

        const result = patientIds.map(id => ({
          patient_id:   id,
          patient_name: patientMap.get(id) ?? 'Paciente',
          latest:       patientSummary[id] ?? {},
        }));

        return res.status(200).json(result);
      } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao gerar painel.' });
      }
    }

    // Sessão única com measurements
    if (type === 'getSessionById') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ message: 'ID obrigatório.' });
      try {
        const session = await sessions.findOne({ _id: new ObjectId(id as string) });
        if (!session) return res.status(404).json({ message: 'Sessão não encontrada.' });

        const sessionMeasurements = await measurements
          .find({ session_id: String(session._id) })
          .toArray();

        return res.status(200).json({ ...session, measurements: sessionMeasurements });
      } catch {
        return res.status(500).json({ message: 'Erro ao buscar sessão.' });
      }
    }

    return res.status(400).json({ message: 'type inválido.' });
  }

  // ─── POST — createSession ─────────────────────────────────
  if (req.method === 'POST' && type === 'createSession') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { session, measurements: measurementList } = body as {
        session: Omit<MeasurementSession, '_id' | 'recorded_at' | 'created_at' | 'updated_at'>;
        measurements: Omit<Measurement, '_id' | 'session_id' | 'created_at' | 'updated_at'>[];
      };

      if (!session.patient_id || !session.measured_at || !session.recorded_by_user_id) {
        return res.status(400).json({ message: 'patient_id, measured_at e recorded_by_user_id são obrigatórios.' });
      }
      if (!Array.isArray(measurementList) || measurementList.length === 0) {
        return res.status(400).json({ message: 'Informe ao menos uma medição.' });
      }

      // Desnormalizar nome do paciente e do registrador
      let patient_name = 'Paciente';
      let recorded_by_name = '';
      try {
        const [patient, recorder] = await Promise.all([
          patientCol.findOne(
            { _id: new ObjectId(session.patient_id) },
            { projection: { display_name: 1 } }
          ),
          db.collection('usuario').findOne(
            { _id: new ObjectId(session.recorded_by_user_id) },
            { projection: { nome: 1, sobrenome: 1 } }
          ),
        ]);
        if (patient?.display_name) patient_name = patient.display_name as string;
        if (recorder) recorded_by_name = `${recorder.nome ?? ''} ${recorder.sobrenome ?? ''}`.trim();
      } catch { /* fallback */ }

      const now = new Date().toISOString();
      const newSession: MeasurementSession = {
        ...session,
        patient_name,
        recorded_by_name,
        recorded_at: now,
        status: 'active',
        created_at: now,
        updated_at: now,
      };

      const insertedSession = await sessions.insertOne(newSession as any);
      const sessionId = String(insertedSession.insertedId);

      const measurementDocs = measurementList.map(m => ({
        ...m,
        session_id: sessionId,
        status: m.status ?? 'final',
        created_at: now,
        updated_at: now,
      }));

      await measurements.insertMany(measurementDocs as any[]);

      return res.status(201).json({ message: 'Sessão registrada.', sessionId });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erro ao registrar sessão.' });
    }
  }

  // ─── PUT — updateSession ──────────────────────────────────
  if (req.method === 'PUT' && type === 'updateSession') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ message: 'ID obrigatório.' });
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { notes, location, status } = body;
      const now = new Date().toISOString();
      await sessions.updateOne(
        { _id: new ObjectId(id as string) },
        { $set: { ...(notes !== undefined && { notes }), ...(location !== undefined && { location }), ...(status !== undefined && { status }), updated_at: now } }
      );
      return res.status(200).json({ message: 'Sessão atualizada.' });
    } catch {
      return res.status(500).json({ message: 'Erro ao atualizar sessão.' });
    }
  }

  // ─── DELETE — soft delete ─────────────────────────────────
  if (req.method === 'DELETE' && type === 'deleteSession') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ message: 'ID obrigatório.' });
    try {
      const now = new Date().toISOString();
      const sessionId = String(id);
      await Promise.all([
        sessions.updateOne({ _id: new ObjectId(sessionId) }, { $set: { status: 'cancelled', updated_at: now } }),
        measurements.updateMany({ session_id: sessionId }, { $set: { status: 'cancelled', updated_at: now } }),
      ]);
      return res.status(200).json({ message: 'Sessão cancelada.' });
    } catch {
      return res.status(500).json({ message: 'Erro ao cancelar sessão.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}
