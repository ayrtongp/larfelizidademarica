export type TipoDocumentoPeriodo = 'folha_ponto' | 'contracheque';

export interface T_RhDocumentoPeriodo {
  _id?: string;
  tipo: TipoDocumentoPeriodo;
  funcionarioId: string;
  funcionarioNome: string;
  periodo: { mes: number; ano: number };
  cloudURL: string;
  filename: string;
  cloudFilename: string;
  size: string;
  format: string;
  descricao?: string;
  uploadedBy: string;
  uploadedByNome: string;
  createdAt?: string;
}
