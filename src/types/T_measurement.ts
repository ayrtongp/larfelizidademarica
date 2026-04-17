export type MeasurementTypeCode =
  // Sinais vitais
  | 'BP_SYS' | 'BP_DIA' | 'HR' | 'RR' | 'TEMP' | 'SPO2'
  // Metabólico
  | 'GLUCOSE' | 'HBA1C' | 'BMI'
  // Antropométrico
  | 'WEIGHT' | 'HEIGHT' | 'ABD_CIRC'
  // Avaliações clínicas
  | 'PAIN_SCORE' | 'DIURESIS' | 'GCS'
  // Escalas geriátricas
  | 'BRADEN' | 'BARTHEL' | 'MMSE' | 'GDS';

export type MeasurementCategory =
  | 'vitals'
  | 'metabolic'
  | 'anthropometric'
  | 'clinical'
  | 'geriatric';

export type MeasurementStatus = 'final' | 'preliminary' | 'amended' | 'cancelled';
export type SessionStatus     = 'active' | 'amended' | 'cancelled';
export type SourceType        = 'manual' | 'device' | 'imported' | 'corrected';
export type AbnormalFlag      = 'H' | 'L' | 'HH' | 'LL' | 'N';

export interface MeasurementSession {
  _id?: string;
  patient_id: string;          // FK → patient._id
  patient_name?: string;       // desnormalizado no momento da criação
  measured_at: string;
  recorded_at: string;
  recorded_by_user_id: string;
  recorded_by_name?: string;   // desnormalizado no momento da criação
  source_type: SourceType;
  source_reference?: string;
  location?: string;
  notes?: string;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
}

export interface Measurement {
  _id?: string;
  session_id: string;
  type_code: MeasurementTypeCode;
  type_label: string;
  value_numeric?: number;
  value_text?: string;
  unit?: string;
  comparator?: '<' | '<=' | '=' | '>=' | '>';
  body_site?: string;
  method?: string;
  device_id?: string;
  reference_min?: number;
  reference_max?: number;
  abnormal_flag?: AbnormalFlag;
  status: MeasurementStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MeasurementSessionWithMeasurements extends MeasurementSession {
  measurements: Measurement[];
}

export interface MeasurementTypeMeta {
  code: MeasurementTypeCode;
  label: string;
  shortLabel: string;
  unit: string;
  category: MeasurementCategory;
  reference_min?: number;
  reference_max?: number;
  step?: number;
  min?: number;
  max?: number;
  isPressurePart?: boolean;   // BP_SYS e BP_DIA são exibidos juntos
  isCalculated?: boolean;     // BMI é calculado automaticamente
  loinc?: string;             // código LOINC FHIR
  hint?: string;              // texto de ajuda no card
}

export const MEASUREMENT_TYPES: MeasurementTypeMeta[] = [
  // ── Sinais Vitais ──────────────────────────────────────
  { code: 'BP_SYS',     label: 'Pressão Sistólica',       shortLabel: 'Sist.',    unit: 'mmHg', category: 'vitals',        reference_min: 90,   reference_max: 139,  min: 50,  max: 250, isPressurePart: true,  loinc: '8480-6' },
  { code: 'BP_DIA',     label: 'Pressão Diastólica',      shortLabel: 'Diast.',   unit: 'mmHg', category: 'vitals',        reference_min: 60,   reference_max: 89,   min: 30,  max: 150, isPressurePart: true,  loinc: '8462-4' },
  { code: 'HR',         label: 'Freq. Cardíaca',          shortLabel: 'FC',       unit: 'bpm',  category: 'vitals',        reference_min: 60,   reference_max: 100,  min: 20,  max: 300, loinc: '8867-4' },
  { code: 'RR',         label: 'Freq. Respiratória',      shortLabel: 'FR',       unit: 'ipm',  category: 'vitals',        reference_min: 12,   reference_max: 20,   min: 4,   max: 60,  loinc: '9279-1' },
  { code: 'TEMP',       label: 'Temperatura',             shortLabel: 'Temp',     unit: '°C',   category: 'vitals',        reference_min: 36.0, reference_max: 37.5, min: 30,  max: 43,  step: 0.1, loinc: '8310-5' },
  { code: 'SPO2',       label: 'Saturação O₂',            shortLabel: 'SpO₂',    unit: '%',    category: 'vitals',        reference_min: 95,   reference_max: 100,  min: 50,  max: 100, loinc: '59408-5' },

  // ── Metabólico ─────────────────────────────────────────
  { code: 'GLUCOSE',    label: 'Glicemia',                shortLabel: 'Glicemia', unit: 'mg/dL',category: 'metabolic',     reference_min: 70,   reference_max: 180,  min: 20,  max: 700, loinc: '2339-0',  hint: '0 = não mensurado' },
  { code: 'HBA1C',      label: 'Hemoglobina Glicada',     shortLabel: 'HbA1c',   unit: '%',    category: 'metabolic',     reference_min: 4.0,  reference_max: 7.0,  min: 3,   max: 20,  step: 0.1, loinc: '4548-4' },
  { code: 'BMI',        label: 'IMC',                     shortLabel: 'IMC',      unit: 'kg/m²',category: 'metabolic',    reference_min: 22,   reference_max: 27,   min: 10,  max: 60,  step: 0.1, isCalculated: true, loinc: '39156-5', hint: 'Calculado a partir de Peso + Altura' },

  // ── Antropométrico ─────────────────────────────────────
  { code: 'WEIGHT',     label: 'Peso',                    shortLabel: 'Peso',     unit: 'kg',   category: 'anthropometric',                                         min: 20,  max: 300, step: 0.1, loinc: '29463-7' },
  { code: 'HEIGHT',     label: 'Altura',                  shortLabel: 'Altura',   unit: 'cm',   category: 'anthropometric',                                         min: 50,  max: 250, loinc: '8302-2' },
  { code: 'ABD_CIRC',   label: 'Circ. Abdominal',         shortLabel: 'C. Abd.',  unit: 'cm',   category: 'anthropometric', reference_min: 0, reference_max: 88,    min: 40,  max: 200, loinc: '8287-5', hint: 'Risco metabólico: >88cm (♀) / >102cm (♂)' },

  // ── Avaliações Clínicas ────────────────────────────────
  { code: 'PAIN_SCORE', label: 'Escala de Dor (EVA)',     shortLabel: 'Dor',      unit: '/10',  category: 'clinical',      reference_min: 0,    reference_max: 3,    min: 0,   max: 10,  loinc: '72514-3', hint: '0 = sem dor · 10 = dor máxima' },
  { code: 'DIURESIS',   label: 'Diurese',                 shortLabel: 'Diurese',  unit: 'ml',   category: 'clinical',      reference_min: 800,  reference_max: 2500, min: 0,   max: 5000, loinc: '9187-6', hint: 'Volume urinário nas últimas 24h' },
  { code: 'GCS',        label: 'Escala de Glasgow',       shortLabel: 'Glasgow',  unit: 'pts',  category: 'clinical',      reference_min: 13,   reference_max: 15,   min: 3,   max: 15,  loinc: '9267-6', hint: '15 = normal · ≤8 = coma' },

  // ── Escalas Geriátricas ────────────────────────────────
  { code: 'BRADEN',     label: 'Escala de Braden',        shortLabel: 'Braden',   unit: 'pts',  category: 'geriatric',     reference_min: 19,   reference_max: 23,   min: 6,   max: 23,  loinc: '38213-5', hint: '6–9 muito alto · 10–12 alto · 13–14 moderado · 15–18 baixo · 19–23 sem risco' },
  { code: 'BARTHEL',    label: 'Índice de Barthel',       shortLabel: 'Barthel',  unit: 'pts',  category: 'geriatric',     reference_min: 91,   reference_max: 100,  min: 0,   max: 100, loinc: '72107-6', hint: '0–20 dependência total · 21–60 severa · 61–90 moderada · 91–99 leve · 100 independente' },
  { code: 'MMSE',       label: 'MMSE (Mini-Mental)',      shortLabel: 'MMSE',     unit: 'pts',  category: 'geriatric',     reference_min: 24,   reference_max: 30,   min: 0,   max: 30,  loinc: '72106-8', hint: '≥24 normal · 19–23 leve · 10–18 moderado · <10 grave' },
  { code: 'GDS',        label: 'Escala de Depressão (GDS)',shortLabel: 'GDS',     unit: 'pts',  category: 'geriatric',     reference_min: 0,    reference_max: 5,    min: 0,   max: 15,  loinc: '35088-6', hint: '0–5 normal · 6–10 depressão leve · 11–15 depressão grave' },
];

export const CATEGORY_LABELS: Record<MeasurementCategory, string> = {
  vitals:         'Sinais Vitais',
  metabolic:      'Metabólico',
  anthropometric: 'Antropométrico',
  clinical:       'Avaliações Clínicas',
  geriatric:      'Escalas Geriátricas',
};

// Tipos que aparecem no painel de monitoramento "Hoje"
export const PANEL_COLUMNS: MeasurementTypeCode[] = ['BP_SYS', 'HR', 'TEMP', 'SPO2', 'GLUCOSE', 'PAIN_SCORE'];

export function calcAbnormalFlag(code: MeasurementTypeCode, value: number): AbnormalFlag | undefined {
  const meta = MEASUREMENT_TYPES.find(t => t.code === code);
  if (!meta || meta.reference_min === undefined || meta.reference_max === undefined) return undefined;

  // Escalas com lógica invertida (menor = pior risco)
  if (code === 'BRADEN' || code === 'BARTHEL' || code === 'MMSE') {
    if (value < meta.reference_min * 0.5) return 'LL';
    if (value < meta.reference_min)       return 'L';
    return 'N';
  }
  // GDS e dor: maior = pior
  if (code === 'GDS' || code === 'PAIN_SCORE') {
    if (value > meta.reference_max * 2) return 'HH';
    if (value > meta.reference_max)     return 'H';
    return 'N';
  }

  const criticalHigh = meta.reference_max * 1.2;
  const criticalLow  = meta.reference_min * 0.8;
  if (value >= criticalHigh) return 'HH';
  if (value <= criticalLow)  return 'LL';
  if (value > meta.reference_max) return 'H';
  if (value < meta.reference_min) return 'L';
  return 'N';
}

export function calcBMI(weightKg: number, heightCm: number): number {
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}
