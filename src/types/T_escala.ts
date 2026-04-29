export type TipoRegra = 'dias_semana' | 'alternado' | '12x36' | '24x48';

export type TipoMembro = 'clt' | 'prestador' | 'manual';

export interface EscalaMembro {
  funcionarioId: string; // ID real para CLT/prestador; 'manual-<uid>' para entradas manuais
  usuarioId?: string;
  nome: string;
  cargo?: string;
  tipo?: TipoMembro;
  dataReferencia?: string; // YYYY-MM-DD — referência p/ cálculo de ciclos
}

export interface EscalaRegra {
  tipo: TipoRegra;
  diasSemana?: number[]; // 0=Dom ... 6=Sáb
  dataReferencia?: string; // nível equipe p/ ciclos
  horarioEntrada: string; // "07:00"
  horarioSaida: string;   // "19:00"
}

export interface T_Equipe {
  _id?: string;
  nome: string;
  descricao?: string;
  cor: string; // hex
  membros: EscalaMembro[];
  regra: EscalaRegra;
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
}
