// Dados pessoais complementares (nome/email/foto ficam em `usuario`)
export interface T_DadosPessoais {
  cpf: string;
  rg?: string;
  rgOrgaoEmissor?: string;
  rgDataEmissao?: string;
  genero?: 'M' | 'F' | 'outro';
  estadoCivil?: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel' | 'outro';
  nomeMae?: string;
  nomePai?: string;
  naturalidade?: string;
  nacionalidade?: string;
  escolaridade?: 'fundamental_incompleto' | 'fundamental_completo' | 'medio_incompleto' | 'medio_completo' | 'superior_incompleto' | 'superior_completo' | 'pos_graduacao';
  deficiencia?: string;
}

export interface T_Endereco {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

export interface T_CTPS {
  numero?: string;
  serie?: string;
  uf?: string;
  dataEmissao?: string;
}

export interface T_Contrato {
  cargo: string;
  setor: string;
  cbo?: string;
  tipoContrato: 'experiencia' | 'prazo_indeterminado' | 'prazo_determinado';
  cargaHorariaSemanal: number;
  turno?: 'manha' | 'tarde' | 'noite' | 'integral' | 'escala_12x36' | 'escala_24x48';
  salarioBase?: number;
  dataAdmissao?: string;
  dataFimExperiencia?: string;
  dataFimContrato?: string;
  sindicato?: string;
}

export interface T_Beneficios {
  valeTransporte: boolean;
  valeTransporteValorDiario?: number;
  valeAlimentacao: boolean;
  valeAlimentacaoValorMensal?: number;
  planoSaude: boolean;
  planoSaudeOperadora?: string;
  planoOdontologico: boolean;
  seguroVida: boolean;
  outrosBeneficios?: string;
}

export interface T_DadosBancarios {
  banco?: string;
  agencia?: string;
  conta?: string;
  tipoConta?: 'corrente' | 'poupanca';
  pixChave?: string;
  pixTipo?: 'cpf' | 'email' | 'celular' | 'aleatoria';
}

export interface T_ASO {
  tipo: 'admissional' | 'periodico' | 'retorno_trabalho' | 'mudanca_funcao' | 'demissional';
  data: string;
  dataVencimento?: string;
  resultado: 'apto' | 'apto_restricoes' | 'inapto';
  observacoes?: string;
}

export interface T_SaudeOcupacional {
  asos: T_ASO[];
}

export interface T_ContatoEmergencia {
  nome?: string;
  parentesco?: string;
  telefone?: string;
  telefone2?: string;
}

export interface T_AtestadoMedico {
  data: string;
  dataInicio: string;
  dataFim: string;
  diasAfastamento?: number;
  tipo: 'doenca_comum' | 'acidente_trabalho' | 'acidente_trajeto' | 'licenca_maternidade' | 'licenca_paternidade' | 'cirurgia' | 'outro';
  cid?: string;
  medico?: string;
  crm?: string;
  observacoes?: string;
  arquivoUrl?: string;
  arquivoNome?: string;
  arquivoCloudNome?: string;
  createdAt?: string;
}

export interface T_Ferias {
  dataInicio: string;
  dataFim: string;
  diasGozados?: number;
  observacoes?: string;
  arquivoUrl?: string;
  arquivoNome?: string;
  arquivoCloudNome?: string;
  createdAt?: string;
}

export interface T_Advertencia {
  data: string;
  tipo: 'verbal' | 'escrita' | 'suspensao';
  diasSuspensao?: number;
  motivo: string;
  observacoes?: string;
  arquivoUrl?: string;
  arquivoNome?: string;
  arquivoCloudNome?: string;
  createdAt?: string;
}

export type T_TipoDemissao = 'sem_justa_causa' | 'com_justa_causa' | 'pedido_demissao' | 'aposentadoria' | 'falecimento' | 'acordo' | 'outro';
export type T_TipoAvisoPrevio = 'trabalhado' | 'indenizado' | 'dispensado';
export type T_TipoDocumentoDemissao = 'aso_demissional' | 'aviso_previo' | 'termo_rescisao' | 'comprovante_pagamento' | 'outro';

export interface T_AvisoPrevio {
  tipo: T_TipoAvisoPrevio;
  dataInicio?: string;
  dataFim?: string;
}

export interface T_DocumentoDemissao {
  tipo: T_TipoDocumentoDemissao;
  descricao?: string;
  cloudURL: string;
  filename: string;
  cloudFilename: string;
  size: string;
  format: string;
  uploadedAt: string;
  uploadedBy: string;
  uploadedByNome?: string;
}

export interface T_FuncionarioCLT {
  _id?: string;
  usuarioId: string;
  status: 'ativo' | 'demitido' | 'afastado' | 'ferias';
  contrato: T_Contrato;
  dadosPessoais: T_DadosPessoais;
  endereco: T_Endereco;
  ctps: T_CTPS;
  pisPasep?: string;
  beneficios: T_Beneficios;
  dadosBancarios: T_DadosBancarios;
  saudeOcupacional: T_SaudeOcupacional;
  contatoEmergencia: T_ContatoEmergencia;
  atestados?: T_AtestadoMedico[];
  ferias?: T_Ferias[];
  advertencias?: T_Advertencia[];
  dataDemissao?: string;
  tipoDemissao?: T_TipoDemissao;
  motivoDemissao?: string;
  avisoPrevio?: T_AvisoPrevio;
  documentosDemissao?: T_DocumentoDemissao[];
  observacoes?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Enriquecido com dados do usuario para exibição
export interface T_FuncionarioCLTComUsuario extends T_FuncionarioCLT {
  usuario?: {
    _id: string;
    nome: string;
    sobrenome: string;
    email?: string;
    telefone?: string;
    funcao?: string;
    foto_cdn?: string;
    foto_base64?: string;
  };
}
