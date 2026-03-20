export interface T_DadosPrestador {
  cpf?: string;             // PF
  cnpj?: string;            // PJ
  razaoSocial?: string;
  nomeFantasia?: string;
  inscricaoMunicipal?: string;
  inscricaoEstadual?: string;
}

export interface T_EnderecoPrestador {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

export interface T_ContratoPrestador {
  tipoServico: string;
  descricaoServico?: string;
  tipoCobranca: 'hora' | 'mensal' | 'fixo' | 'diaria';
  valor: number;
  dataInicio: string;
  dataFim?: string;
  periodicidadePagamento: 'semanal' | 'quinzenal' | 'mensal';
  diaPagamento?: number;
  emiteNF: boolean;
  cnaeServico?: string;
}

export interface T_DadosBancariosPrestador {
  banco?: string;
  agencia?: string;
  conta?: string;
  tipoConta?: 'corrente' | 'poupanca';
  pixChave?: string;
  pixTipo?: 'cpf' | 'cnpj' | 'email' | 'celular' | 'aleatoria';
}

export interface T_PrestadorServico {
  _id?: string;
  usuarioId: string;
  status: 'ativo' | 'inativo' | 'suspenso';
  tipoPessoa: 'pf' | 'pj';
  dados: T_DadosPrestador;
  endereco: T_EnderecoPrestador;
  contrato: T_ContratoPrestador;
  dadosBancarios: T_DadosBancariosPrestador;
  observacoes?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface T_PrestadorServicoComUsuario extends T_PrestadorServico {
  usuario?: {
    _id: string;
    nome: string;
    sobrenome: string;
    email?: string;
    funcao?: string;
    foto_cdn?: string;
    foto_base64?: string;
  };
}
