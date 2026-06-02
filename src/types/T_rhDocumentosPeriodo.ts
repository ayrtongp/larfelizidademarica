export type TipoDocumentoPeriodo = 'folha_ponto' | 'contracheque';

export type StatusFolhaPonto = 'enviado' | 'reenviado' | 'aprovado' | 'reprovado';

export type T_ResumoFolhaPonto = {
  funcionarioId: string;
  nome: string;
  cargo: string;
  setor: string;
  enviado: boolean;
  documento?: T_RhDocumentoPeriodo;
};

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
  r2FileId?: string;
  // workflow de aprovação
  status?: StatusFolhaPonto;
  motivoReprovacao?: string;
  statusAtualizadoEm?: string;
  statusAtualizadoPor?: string;
  statusAtualizadoPorNome?: string;
}
