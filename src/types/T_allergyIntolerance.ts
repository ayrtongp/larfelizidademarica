export interface T_AllergyReaction {
  manifestation: string[];
  severity?: 'mild' | 'moderate' | 'severe';
  description?: string;
  onset?: string;
}

export interface T_AllergyIntolerance {
  _id?: string;
  resourceType: 'AllergyIntolerance';
  patient_id: string;
  clinicalStatus: 'active' | 'inactive' | 'resolved';
  verificationStatus: 'confirmed' | 'unconfirmed' | 'refuted' | 'entered-in-error';
  type?: 'allergy' | 'intolerance';
  category?: ('food' | 'medication' | 'environment' | 'biologic')[];
  criticality?: 'low' | 'high' | 'unable-to-assess';
  code: { text: string; coding?: { system: string; code: string; display: string }[] };
  reaction?: T_AllergyReaction[];
  onsetDateTime?: string;
  recordedDate?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}
