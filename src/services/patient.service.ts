import { Patient, PatientOption } from '@/types/T_patient';

const BASE = '/api/Controller/patient.controller';

async function getActivePatients(): Promise<PatientOption[]> {
  const res = await fetch(`${BASE}?type=getActivePatients`);
  if (!res.ok) throw new Error('Erro ao buscar pacientes.');
  return res.json();
}

async function getPatientById(id: string): Promise<Patient> {
  const res = await fetch(`${BASE}?type=getPatientById&id=${id}`);
  if (!res.ok) throw new Error('Paciente não encontrado.');
  return res.json();
}

async function createPatient(payload: {
  usuario_id: string;
  idoso_detalhes_id: string;
  given_name: string;
  family_name: string;
  birth_date?: string;
  gender?: string;
  cpf?: string;
  photo_url?: string;
  active?: boolean;
}): Promise<{ patientId: string; created: boolean }> {
  const res = await fetch(`${BASE}?type=createPatient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const { message } = await res.json();
    throw new Error(message || 'Erro ao criar paciente.');
  }
  return res.json();
}

async function syncFromUsuario(patientId: string, updates: {
  given_name?: string;
  family_name?: string;
  birth_date?: string;
  gender?: string;
  cpf?: string;
  photo_url?: string;
}): Promise<void> {
  const res = await fetch(`${BASE}?type=syncFromUsuario&id=${patientId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Erro ao sincronizar paciente.');
}

const patientService = { getActivePatients, getPatientById, createPatient, syncFromUsuario };
export default patientService;
