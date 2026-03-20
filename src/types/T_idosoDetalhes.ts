// Dados de admissão e modalidade principal
export interface T_Admissao {
  dataEntrada: string;        // YYYY-MM-DD
  dataSaida?: string;
  motivoEntrada?: string;
  motivoSaida?: string;
  numProntuario?: string;
  modalidadePrincipal: 'residencia_fixa' | 'residencia_temporaria' | 'centro_dia' | 'hotelaria';
}

// Responsável legal / curador
export interface T_ResponsavelIdoso {
  nome?: string;
  parentesco?: string;
  contato?: string;
  interditado?: boolean;
  processoInterdicao?: string;
}

// Membro da composição familiar
export interface T_MembroFamiliar {
  nomeCompleto: string;
  parentesco: string;
  sexo?: string;
  dataNascimento?: string;
  contato?: string;
}

// Histórico social e dados complementares
export interface T_HistoricoIdoso {
  decisaoMoradia?: string;
  motivoMoradia?: string;
  opiniaoMoradia?: string;
  rotinaAnterior?: string;
  profissao?: string;
  religiao?: string;
  estadoCivil?: string;
  escolaridade?: string;
  naturalidade?: string;
  enderecoOrigem?: string;
}

// Referências de documentos físicos
export interface T_DocumentosIdoso {
  carteiraVacinacao?: string;
  certidaoNasCas?: string;
  carteiraTrabalho?: string;
  identidade?: string;
  tituloEleitor?: string;
  reservista?: string;
}

// Documento principal
export interface T_IdosoDetalhes {
  _id?: string;
  usuarioId: string;          // FK → usuario (nome, foto, CPF, data_nasc ficam lá)
  status: 'ativo' | 'alta' | 'falecido' | 'afastado';
  admissao: T_Admissao;
  responsavel: T_ResponsavelIdoso;
  composicaoFamiliar: T_MembroFamiliar[];
  historico: T_HistoricoIdoso;
  documentos: T_DocumentosIdoso;
  observacoes?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Enriquecido com dados do usuario para exibição
export interface T_IdosoDetalhesComUsuario extends T_IdosoDetalhes {
  usuario?: {
    _id: string;
    nome: string;
    sobrenome: string;
    email?: string;
    cpf?: string;
    data_nascimento?: string;
    genero?: string;
    foto_cdn?: string;
    foto_base64?: string;
  };
}
