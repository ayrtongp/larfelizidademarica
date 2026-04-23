export interface T_Procedure {
  _id?: string;
  resourceType: 'Procedure';
  patient_id: string;
  status: 'completed' | 'not-done' | 'in-progress' | 'stopped';
  code: { text: string; coding?: { system: string; code: string; display: string }[] };
  performedDateTime?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}
