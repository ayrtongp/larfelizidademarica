// FHIR R4 Patient — adaptado para o contexto de ILPI (Lar Felizidade)
// Referência: https://www.hl7.org/fhir/patient.html

export type FHIRGender = 'male' | 'female' | 'other' | 'unknown';

// FHIR Identifier — documentos do paciente
export interface T_PatientIdentifier {
  system: 'cpf' | 'rg' | 'cns' | 'prontuario';
  value: string;
}

// FHIR HumanName
export interface T_PatientName {
  use: 'official' | 'usual';
  family: string;    // sobrenome
  given: string[];   // [primeiro nome, ...]
  text: string;      // nome completo (denormalizado para exibição)
}

// FHIR ContactPoint
export interface T_PatientTelecom {
  system: 'phone' | 'email';
  value: string;
  use?: 'home' | 'mobile' | 'work';
}

// FHIR Address
export interface T_PatientAddress {
  use?: 'home' | 'old';
  text?: string;         // endereço em texto livre
  line?: string[];       // logradouro, número, complemento
  city?: string;
  state?: string;        // sigla UF
  postalCode?: string;
}

// FHIR Patient.contact — contatos / responsáveis
export interface T_PatientContact {
  relationship: 'guardian' | 'family' | 'emergency' | 'other';
  name: string;
  telecom?: string;
  isPrimaryGuardian?: boolean;
}

// Extensões customizadas (campos LTC não previstos no FHIR base)
export interface T_PatientExtension {
  estadoCivil?: string;
  religiao?: string;
  escolaridade?: string;
  profissao?: string;
  naturalidade?: string;
}

// ─── Documento principal (collection: patient) ──────────────────────────────
export interface T_Patient {
  _id?: string;
  resourceType: 'Patient';

  // Identificadores externos
  identifier: T_PatientIdentifier[];

  // Nome (FHIR HumanName[])
  name: T_PatientName[];

  // Dados demográficos
  gender: FHIRGender;
  birthDate: string;   // YYYY-MM-DD

  // Contato
  telecom: T_PatientTelecom[];
  address: T_PatientAddress[];

  // Foto
  photo?: string;      // base64 (legado)
  photo_url?: string;  // CDN URL (Cloudflare R2)

  active: boolean;

  // Contatos / responsáveis (FHIR Patient.contact)
  contact: T_PatientContact[];

  // Campos específicos de ILPI (FHIR extensions)
  extension: T_PatientExtension;

  // Links internos
  usuario_id?: string;          // opcional — apenas se tiver login no portal
  idoso_detalhes_id?: string;   // FK → idoso_detalhes._id

  // Campos denormalizados para compat com pipeline existente
  given_name: string;     // name[official].given.join(' ')
  family_name: string;    // name[official].family
  display_name: string;   // nome completo
  birth_date: string;     // alias de birthDate (compat)
  cpf?: string;           // identifier[cpf].value

  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Versão reduzida para selects e listas
export interface T_PatientOption {
  _id: string;
  display_name: string;
  photo?: string;
  active: boolean;
  birthDate?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const getPatientDisplayName = (p: T_Patient): string => {
  const official = p.name?.find((n) => n.use === 'official') ?? p.name?.[0];
  if (!official) return p.display_name ?? '—';
  return official.text || `${official.given.join(' ')} ${official.family}`.trim();
};

export const getPatientCPF = (p: T_Patient): string | undefined =>
  p.identifier?.find((i) => i.system === 'cpf')?.value ?? p.cpf;

export const getPatientPhone = (p: T_Patient): string | undefined =>
  p.telecom?.find((t) => t.system === 'phone')?.value;

export const GENDER_LABELS: Record<FHIRGender, string> = {
  male:    'Masculino',
  female:  'Feminino',
  other:   'Outro',
  unknown: 'Não informado',
};

// Retrocompat: mantém PatientOption como alias
export type PatientOption = T_PatientOption;

/** @deprecated use T_Patient */
export interface Patient {
  _id?: string;
  residente_id: string;
  display_name: string;
  given_name: string;
  family_name: string;
  birth_date?: string;
  gender?: string;
  cpf?: string;
  photo_url?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}
