import { MeasurementSession, Measurement, MeasurementSessionWithMeasurements } from '@/types/T_measurement';

const BASE = '/api/Controller/measurement.controller';

export interface GetSessionsParams {
  patientId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface CreateSessionPayload {
  session: Omit<MeasurementSession, '_id' | 'recorded_at' | 'patient_name' | 'created_at' | 'updated_at'>;
  measurements: Omit<Measurement, '_id' | 'session_id' | 'created_at' | 'updated_at'>[];
}

async function getSessions(params: GetSessionsParams = {}): Promise<{ sessions: MeasurementSessionWithMeasurements[]; total: number }> {
  const q = new URLSearchParams({ type: 'getSessions' });
  if (params.patientId) q.set('patientId', params.patientId);
  if (params.dateFrom) q.set('dateFrom', params.dateFrom);
  if (params.dateTo)   q.set('dateTo', params.dateTo);
  if (params.page)     q.set('page', String(params.page));
  if (params.limit)    q.set('limit', String(params.limit));

  const res = await fetch(`${BASE}?${q}`);
  if (!res.ok) throw new Error('Erro ao buscar sessões.');
  return res.json();
}

async function getSessionById(id: string): Promise<MeasurementSessionWithMeasurements> {
  const res = await fetch(`${BASE}?type=getSessionById&id=${id}`);
  if (!res.ok) throw new Error('Sessão não encontrada.');
  return res.json();
}

async function createSession(payload: CreateSessionPayload): Promise<{ sessionId: string }> {
  const res = await fetch(`${BASE}?type=createSession`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const { message } = await res.json();
    throw new Error(message || 'Erro ao registrar sessão.');
  }
  return res.json();
}

async function updateSession(id: string, updates: { notes?: string; location?: string; status?: string }): Promise<void> {
  const res = await fetch(`${BASE}?type=updateSession&id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Erro ao atualizar sessão.');
}

async function deleteSession(id: string): Promise<void> {
  const res = await fetch(`${BASE}?type=deleteSession&id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erro ao cancelar sessão.');
}

async function getTodaySummary(date: string) {
  const res = await fetch(`${BASE}?type=getTodaySummary&date=${date}`);
  if (!res.ok) throw new Error('Erro ao carregar painel.');
  return res.json();
}

const measurementService = { getSessions, getSessionById, createSession, updateSession, deleteSession, getTodaySummary };
export default measurementService;
