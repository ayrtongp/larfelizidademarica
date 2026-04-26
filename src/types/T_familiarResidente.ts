export interface T_FamiliarResidente {
  _id?: string;
  usuario_id: string;    // FK → usuario._id
  residente_id: string;  // FK → patient._id
  parentesco: string;
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface T_FamiliarResidentePopulado extends T_FamiliarResidente {
  usuario?: {
    _id: string;
    nome: string;
    sobrenome?: string;
    usuario: string;
    email?: string;
    ativo: 'S' | 'N';
  };
  residente?: {
    _id: string;
    display_name: string;
    photo_url?: string;
  };
}

export const PARENTESCO_OPTIONS = [
  'filho(a)',
  'cônjuge',
  'irmão(ã)',
  'neto(a)',
  'sobrinho(a)',
  'genro / nora',
  'responsável legal',
  'amigo(a)',
  'outro',
] as const;

export type Parentesco = typeof PARENTESCO_OPTIONS[number];
