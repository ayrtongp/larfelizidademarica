
export interface Residente {
  _id: string;
  createdAt: string;
  updatedAt: string;
  nome: string;
  data_nascimento: string;
  data_entrada: string;
  cpf: string;
  apelido: string;
  motivo_entrada: string;
  nacionalidade: string;
  naturalidade: string;
  estadoCivil: string;
  religiao: string;
  profissao: string;
  identidade: string;
  tituloEleitor: string;
  reservista: string;
  carteiraTrabalho: string;
  enderecoOrigem: string;
  residenciaAntiga: string;
  numProntuario: string;
  carteiraVacinacao: string;
  certidaoNasCas: string;
  pai: string;
  mae: string;
  contatoCurador: string;
  nomeCurador: string;
  processoInterdicao: string;
  idosoInterditado: string;
  contatoFamiliar: string;
  contatoIdoso: string;
  observacao: string;
  informacoes: string;
  data_saida: string;
  motivo_saida: string;
  genero: string;
  is_ativo: string;
  foto_base64: string;
  composicaoFamiliar: ComposicaFamiliar[];
  questionario: Questionario;
}

export interface ComposicaFamiliar {
  nomeCompleto: string;
  parentesco: string;
  sexo: string;
  dataNascimento: string;
}

export interface Questionario {
  decisaoMoradia: string;
  motivoMoradia: string;
  opiniaoMoradia: string;
  rotinaAnterior: string;
}