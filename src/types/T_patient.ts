export interface Patient {
  _id?: string;
  residente_id: string;        // FK → residentes._id
  display_name: string;        // nome completo
  given_name: string;
  family_name: string;
  birth_date?: string;         // YYYY-MM-DD
  gender?: string;
  cpf?: string;
  photo_url?: string;
  active: boolean;             // derivado de is_ativo === 'S'
  created_at: string;
  updated_at: string;
}

/** Versão reduzida para selects e listas */
export interface PatientOption {
  _id: string;
  display_name: string;
  photo_url?: string;
  active: boolean;
}
