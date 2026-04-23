export interface T_Condition {
  _id?: string;
  resourceType: 'Condition';
  patient_id: string;
  clinicalStatus: 'active' | 'recurrence' | 'relapse' | 'inactive' | 'remission' | 'resolved';
  verificationStatus: 'confirmed' | 'provisional' | 'differential' | 'refuted' | 'entered-in-error';
  category?: ('problem-list-item' | 'encounter-diagnosis' | 'health-concern')[];
  severity?: 'mild' | 'moderate' | 'severe';
  code: { text: string; coding?: { system: string; code: string; display: string }[] };
  onsetDateTime?: string;
  abatementDateTime?: string;
  recordedDate?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}
