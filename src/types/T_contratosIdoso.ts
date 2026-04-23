// Configuração de contrato fechado (hotelaria / residência)
export interface T_ContratoFechado {
  valorMensalBase: number;
  descontos?: Array<{ descricao: string; valor: number }>;
  taxasExtras?: Array<{ descricao: string; valor: number }>;
  diaVencimento: number;      // 1-31
  dataInicio: string;         // YYYY-MM-DD
  dataFim?: string;
}

// Configuração de pacote avulso (centro_dia)
export interface T_PacoteAvulso {
  totalDias: number;
  valorPorDia: number;
  diasUtilizados: number;     // incrementado via check-in
  dataValidade?: string;      // YYYY-MM-DD
}

// Configuração de diária avulsa
export interface T_ContratoAvulso {
  valorDiaria: number;
}

// Documento principal
export interface T_ContratoIdoso {
  _id?: string;
  usuarioId: string;          // FK → usuario (o idoso)
  idosoDetalhesId: string;    // FK → idoso_detalhes
  status: 'ativo' | 'encerrado' | 'suspenso';

  modalidade: 'residencia_fixa' | 'residencia_temporaria' | 'centro_dia' | 'hotelaria';
  tipoBilling: 'contrato_fechado' | 'pacote_avulso' | 'avulso';

  contratado?: T_ContratoFechado;
  pacote?: T_PacoteAvulso;
  avulso?: T_ContratoAvulso;

  prazo?: number;
  tipoPrazo?: 'dia' | 'mes' | 'ano';
  tipoPagamento?: 'a_vencer' | 'vencido';

  observacoes?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Enriquecido com dados do idoso/usuario para exibição
export interface T_ContratoIdosoComIdoso extends T_ContratoIdoso {
  idoso?: {
    _id: string;
    nome: string;
    sobrenome: string;
    foto_cdn?: string;
    foto_base64?: string;
  };
}

// Labels para exibição
export const MODALIDADE_LABELS: Record<string, string> = {
  residencia_fixa:       'Residência Fixa',
  residencia_temporaria: 'Residência Temporária',
  centro_dia:            'Centro Dia',
  hotelaria:             'Hotelaria',
};

export const BILLING_LABELS: Record<string, string> = {
  contrato_fechado: 'Contrato Fechado',
  pacote_avulso:    'Pacote Avulso',
  avulso:           'Avulso',
};
