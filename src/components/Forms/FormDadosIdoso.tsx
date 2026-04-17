import React, { useState } from 'react'
import Text_M3 from '../Formularios/Text_M3'
import { notifyError, notifySuccess } from '@/utils/Functions'
import { Residentes_PUT_alterarDados } from '@/actions/Residentes'
import Button_M3 from '../Formularios/Button_M3'
import { ComposicaoFamiliarData, Residente } from '@/types/Residente'
import Textarea_M3 from '../Formularios/TextArea_M3'
import Accordion_Modelo1 from '../Accordion_Modelo1'
import Select_M3 from '../Formularios/Select_M3'
import GridM1 from '../GridM1'
import Date_M3 from '../Formularios/Date_M3'
import DynamicGridM1 from '../Formularios/DynamicGridM1'
import { getUserID } from '@/utils/Login'

interface Props {
  residenteData: Residente;
  isEGPP: boolean;
}

const isFilled = (value: any): boolean => value !== undefined && value !== null && value !== '';

const defaultComposicaoFamiliarData: ComposicaoFamiliarData = {
  membros: [],
  acompanhadaOrgaos: '',
  quaisOrgaos: '',
  redeApoio: '',
  visitantesHorarioDiferenciado: [],
  visitantesImpossibilitados: [],
  convivoSocial: '',
  relacaoFamiliaComIdoso: '',
  relacaoIdosoComFamilia: '',
  percepcaoEquipeTecnica: '',
  pessoasNaRotina: [],
};

// Colunas das grids dinâmicas
const colsMembros = [
  { key: 'nome', label: 'Nome', placeholder: 'Nome completo', fullWidth: true },
  { key: 'parentesco', label: 'Parentesco', placeholder: 'Ex: Filho(a)' },
  { key: 'idade', label: 'Idade', placeholder: 'Ex: 45' },
  { key: 'contato', label: 'Contato', placeholder: '(00) 00000-0000' },
  { key: 'observacoes', label: 'Observações', placeholder: '', fullWidth: true },
];

const colsVisitantesHorario = [
  { key: 'pessoa', label: 'Pessoa', placeholder: 'Nome da pessoa', fullWidth: true },
  { key: 'horarioAcordado', label: 'Horário Acordado', placeholder: 'Ex: Sábados 14h–16h', fullWidth: true },
];

const colsVisitantesImpossibilitados = [
  { key: 'pessoa', label: 'Pessoa', placeholder: 'Nome da pessoa' },
  { key: 'parentesco', label: 'Parentesco', placeholder: 'Ex: Filho(a)' },
  { key: 'motivo', label: 'Motivo', placeholder: '', fullWidth: true },
];

const colsPessoasNaRotina = [
  { key: 'nome', label: 'Nome / Grupo', placeholder: 'Nome ou grupo', fullWidth: true },
  { key: 'frequencia', label: 'Frequência', placeholder: 'Ex: Semanal' },
  { key: 'tipoInteracao', label: 'Tipo de Interação', placeholder: 'Ex: Visita, ligação' },
];

const FormDadosIdoso = ({ residenteData, isEGPP = true }: Props) => {
  const [bodyUpdate, setBodyUpdate] = useState({});
  const [formData, setFormData] = useState<Residente>(residenteData);

  const [composicaoData, setComposicaoData] = useState<ComposicaoFamiliarData>(() => ({
    ...defaultComposicaoFamiliarData,
    ...(residenteData.composicaoFamiliarData ?? {}),
  }));

  // ---- Contadores de campos preenchidos ----

  const getCounter = (fields: string[]) => {
    const total = fields.length;
    const filled = fields.filter(field => {
      const parts = field.split('.');
      let obj: any = formData;
      for (const part of parts) obj = obj?.[part];
      return isFilled(obj);
    }).length;
    return { filled, total };
  };

  const counterIdentificacao = getCounter(['nome', 'data_nascimento', 'apelido', 'estadoCivil', 'nacionalidade', 'naturalidade', 'contatoIdoso', 'contatoFamiliar', 'idosoInterditado', 'processoInterdicao', 'nomeCurador', 'contatoCurador', 'genero', 'informacoes']);
  const counterDocumental = getCounter(['cpf', 'identidade', 'certidaoNasCas', 'tituloEleitor', 'reservista', 'carteiraTrabalho', 'carteiraVacinacao']);
  const counterAdmissao = getCounter(['data_entrada', 'numProntuario', 'residenciaAntiga', 'enderecoOrigem']);
  const counterQuestionario = getCounter(['questionario.decisaoMoradia', 'questionario.motivoMoradia', 'questionario.opiniaoMoradia', 'questionario.rotinaAnterior']);

  const getCounterComposicao = () => {
    const fields: boolean[] = [
      composicaoData.membros.length > 0,
      isFilled(composicaoData.acompanhadaOrgaos),
      isFilled(composicaoData.redeApoio),
      isFilled(composicaoData.convivoSocial),
      isFilled(composicaoData.relacaoFamiliaComIdoso),
      isFilled(composicaoData.relacaoIdosoComFamilia),
      isFilled(composicaoData.percepcaoEquipeTecnica),
    ];
    return { filled: fields.filter(Boolean).length, total: fields.length };
  };
  const counterComposicao = getCounterComposicao();

  // ---- Handlers ----

  const handleUpdateDados = async () => {
    const realizadoPor = getUserID() ?? '';
    const [, responseOk] = await Residentes_PUT_alterarDados({
      idResidente: residenteData._id as string,
      body: bodyUpdate,
      realizadoPor,
    });
    if (responseOk) {
      notifySuccess('Dado de Residente Alterado!');
    } else {
      notifyError('Falha ao alterar os dados.');
    }
  };

  const handleChangeDados = (e: any) => {
    setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
    setBodyUpdate((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleChangeComposicao = (field: keyof ComposicaoFamiliarData, value: any) => {
    const updated = { ...composicaoData, [field]: value };
    setComposicaoData(updated);
    setBodyUpdate((prev: any) => ({ ...prev, composicaoFamiliarData: updated }));
  };

  // ---- Opções de select ----

  const options_IdosoInterditado = [
    { value: 'sim', label: 'Sim' },
    { value: 'nao', label: 'Não' },
    { value: 'parcialmente', label: 'Parcialmente' },
    { value: 'emprocesso', label: 'Em Processo' },
  ];

  const options_ResidenciaAntiga = [
    { value: 'sozinho', label: 'Residia Sozinho(a)' },
    { value: 'outraILPI', label: 'Residia em Outra ILPI' },
    { value: 'familiares', label: 'Residia com Familiares' },
  ];

  const options_AcompanhadaOrgaos = [
    { value: 'sim', label: 'Sim' },
    { value: 'nao', label: 'Não' },
  ];

  // ---- Render ----

  return (
    <div className='flex flex-col'>

      <Accordion_Modelo1 titulo='Identificação' initialExpanded={true} counter={counterIdentificacao} child={
        <GridM1 colsNumber={4} >
          <Text_M3 highlightEmpty className={'sm:col-span-4 col-span-full'} name={`nome`} label={`Nome do Residente`} value={formData.nome} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Date_M3 highlightEmpty className={'sm:col-span-2 col-span-full'} name={`data_nascimento`} label={`Data de Nascimento`} value={formData.data_nascimento} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 highlightEmpty className={'sm:col-span-2 col-span-full'} name={`apelido`} label={`Apelido`} value={formData.apelido} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 highlightEmpty className={'sm:col-span-2 col-span-full'} name={`estadoCivil`} label={`Estado Civil`} value={formData.estadoCivil} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 highlightEmpty className={'sm:col-span-2 col-span-full'} name={`nacionalidade`} label={`Nacionalidade`} value={formData.nacionalidade} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 highlightEmpty className={'sm:col-span-2 col-span-full'} name={`naturalidade`} label={`Naturalidade`} value={formData.naturalidade} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 highlightEmpty className={'sm:col-span-2 col-span-full'} name={`contatoIdoso`} label={`Núm. Contato (idoso)`} value={formData.contatoIdoso} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 highlightEmpty className={'sm:col-span-2 col-span-full'} name={`contatoFamiliar`} label={`Núm. Contato (familiar)`} value={formData.contatoFamiliar} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Select_M3 highlightEmpty className={'sm:col-span-2 col-span-full'} name={`idosoInterditado`} label={`Pessoa Idosa Interditada`} value={formData.idosoInterditado} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} options={options_IdosoInterditado} />
          <Textarea_M3 highlightEmpty className={'col-span-full'} name={`processoInterdicao`} label={`Dados do Processo Judicial`} value={formData.processoInterdicao} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 highlightEmpty className={'sm:col-span-2 col-span-full'} name={`nomeCurador`} label={`Nome do Curador`} value={formData.nomeCurador} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 highlightEmpty className={'sm:col-span-2 col-span-full'} name={`contatoCurador`} label={`Contato do Curador`} value={formData.contatoCurador} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 highlightEmpty className={'sm:col-span-2 col-span-full'} name={`genero`} label={`Gênero`} value={formData.genero} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Textarea_M3 highlightEmpty className={'col-span-full'} name={`informacoes`} label={`Descrição do Idoso`} value={formData.informacoes} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
        </GridM1>
      } />

      <Accordion_Modelo1 titulo='Situação Documental' initialExpanded={false} counter={counterDocumental} child={
        <div className='mt-2 grid grid-cols-1 sm:grid-cols-4 gap-3'>
          <Text_M3 highlightEmpty className={'sm:col-span-2 col-span-full'} name={`cpf`} label={`CPF`} value={formData.cpf} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 highlightEmpty className={'sm:col-span-2 col-span-full'} name={`identidade`} label={`RG`} value={formData.identidade} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 highlightEmpty className={'sm:col-span-2 col-span-full'} name={`certidaoNasCas`} label={`Certidão de Nascimento/Casamento`} value={formData.certidaoNasCas} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 highlightEmpty className={'sm:col-span-2 col-span-full'} name={`tituloEleitor`} label={`Título de Eleitor`} value={formData.tituloEleitor} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 highlightEmpty className={'sm:col-span-2 col-span-full'} name={`reservista`} label={`Certificado de Reservista`} value={formData.reservista} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 highlightEmpty className={'sm:col-span-2 col-span-full'} name={`carteiraTrabalho`} label={`Carteira de Trabalho`} value={formData.carteiraTrabalho} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 highlightEmpty className={'sm:col-span-2 col-span-full'} name={`carteiraVacinacao`} label={`Carteira de Vacinação`} value={formData.carteiraVacinacao} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
        </div>
      } />

      <Accordion_Modelo1 titulo='Admissão' initialExpanded={false} counter={counterAdmissao} child={
        <div className='mt-2 grid grid-cols-1 sm:grid-cols-4 gap-3'>
          <Date_M3 highlightEmpty className={'sm:col-span-2 col-span-full'} name={`data_entrada`} label={`Data de Entrada`} value={formData.data_entrada} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 highlightEmpty className={'sm:col-span-2 col-span-full'} name={`numProntuario`} label={`Número de Prontuário`} value={formData.numProntuario} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Select_M3 highlightEmpty className={'sm:col-span-2 col-span-full'} name={`residenciaAntiga`} label={`A Pessoa Idosa Antes de Residir na ILPI`} value={formData.residenciaAntiga} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} options={options_ResidenciaAntiga} />
          <Textarea_M3 highlightEmpty className={'col-span-full'} name={`enderecoOrigem`} label={`Endereço de Origem`} value={formData.enderecoOrigem} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
        </div>
      } />

      <Accordion_Modelo1 titulo='Questionário' initialExpanded={false} counter={counterQuestionario} child={
        <div className='mt-2 grid grid-cols-1 sm:grid-cols-4 gap-3'>
          <Textarea_M3 highlightEmpty className={'col-span-full'} name={`questionario.decisaoMoradia`} label={`A institucionalização foi realizada por iniciativa da pessoa idosa ou por decisão de terceiros?`} value={formData.questionario?.decisaoMoradia || ''} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Textarea_M3 highlightEmpty className={'col-span-full'} name={`questionario.motivoMoradia`} label={`Motivo da Institucionalização informada pela pessoa idosa e/ou familiares:`} value={formData.questionario?.motivoMoradia || ''} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Textarea_M3 highlightEmpty className={'col-span-full'} name={`questionario.opiniaoMoradia`} label={`Opinião e expectativas da pessoa idosa quanto à institucionalização:`} value={formData.questionario?.opiniaoMoradia || ''} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Textarea_M3 highlightEmpty className={'col-span-full'} name={`questionario.rotinaAnterior`} label={`Rotina da Pessoa Idosa antes da institucionalização:`} value={formData.questionario?.rotinaAnterior || ''} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
        </div>
      } />

      {/* ---- COMPOSIÇÃO FAMILIAR ---- */}
      <Accordion_Modelo1 titulo='Composição Familiar' initialExpanded={false} counter={counterComposicao} child={
        <div className='mt-2 space-y-6'>

          {/* 1 — Membros da família */}
          <div>
            <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2'>
              Membros da Composição Familiar
            </p>
            <DynamicGridM1
              columns={colsMembros}
              rows={composicaoData.membros as any}
              onChange={rows => handleChangeComposicao('membros', rows)}
              disabled={!isEGPP}
              addLabel='Adicionar familiar'
              emptyMessage='Nenhum familiar cadastrado.'
              rowLabel='Familiar'
            />
          </div>

          <hr className='border-gray-100' />

          {/* 2 — Acompanhamento por órgãos */}
          <div className='grid grid-cols-1 sm:grid-cols-4 gap-3'>
            <Select_M3
              highlightEmpty
              className='sm:col-span-2 col-span-full'
              name='acompanhadaOrgaos'
              label='A família é acompanhada por outros órgãos ou instituições?'
              value={composicaoData.acompanhadaOrgaos}
              disabled={!isEGPP}
              options={options_AcompanhadaOrgaos}
              onChange={isEGPP ? e => handleChangeComposicao('acompanhadaOrgaos', e.target.value) : () => null}
            />
            {composicaoData.acompanhadaOrgaos === 'sim' && (
              <Textarea_M3
                highlightEmpty
                className='col-span-full'
                name='quaisOrgaos'
                label='Se sim, indicar quais órgãos ou instituições:'
                value={composicaoData.quaisOrgaos}
                disabled={!isEGPP}
                rows={3}
                onChange={isEGPP ? e => handleChangeComposicao('quaisOrgaos', e.target.value) : () => null}
              />
            )}
          </div>

          <hr className='border-gray-100' />

          {/* 3 — Rede de apoio */}
          <div>
            <Textarea_M3
              highlightEmpty
              name='redeApoio'
              label='Rede de apoio do idoso (listar pessoas/grupos que prestam algum tipo de suporte ao idoso ou à sua família):'
              value={composicaoData.redeApoio}
              disabled={!isEGPP}
              rows={3}
              onChange={isEGPP ? e => handleChangeComposicao('redeApoio', e.target.value) : () => null}
            />
          </div>

          <hr className='border-gray-100' />

          {/* 4 — Visitantes com horário diferenciado */}
          <div>
            <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2'>
              Pessoas de referência com horário diferenciado para visitação
            </p>
            <DynamicGridM1
              columns={colsVisitantesHorario}
              rows={composicaoData.visitantesHorarioDiferenciado as any}
              onChange={rows => handleChangeComposicao('visitantesHorarioDiferenciado', rows)}
              disabled={!isEGPP}
              addLabel='Adicionar pessoa'
              emptyMessage='Nenhuma pessoa cadastrada.'
              rowLabel='Pessoa'
            />
          </div>

          <hr className='border-gray-100' />

          {/* 5 — Visitantes impossibilitados */}
          <div>
            <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2'>
              Pessoas de referência impossibilitadas de realizar visitação
            </p>
            <DynamicGridM1
              columns={colsVisitantesImpossibilitados}
              rows={composicaoData.visitantesImpossibilitados as any}
              onChange={rows => handleChangeComposicao('visitantesImpossibilitados', rows)}
              disabled={!isEGPP}
              addLabel='Adicionar pessoa'
              emptyMessage='Nenhuma pessoa cadastrada.'
              rowLabel='Pessoa'
            />
          </div>

          <hr className='border-gray-100' />

          {/* 6-9 — Campos textuais */}
          <div className='grid grid-cols-1 gap-3'>
            <Textarea_M3
              highlightEmpty
              name='convivoSocial'
              label='Formas de convívio social exercido pelo idoso antes da institucionalização:'
              value={composicaoData.convivoSocial}
              disabled={!isEGPP}
              rows={3}
              onChange={isEGPP ? e => handleChangeComposicao('convivoSocial', e.target.value) : () => null}
            />
            <Textarea_M3
              highlightEmpty
              name='relacaoFamiliaComIdoso'
              label='Relação da família com o idoso:'
              value={composicaoData.relacaoFamiliaComIdoso}
              disabled={!isEGPP}
              rows={3}
              onChange={isEGPP ? e => handleChangeComposicao('relacaoFamiliaComIdoso', e.target.value) : () => null}
            />
            <Textarea_M3
              highlightEmpty
              name='relacaoIdosoComFamilia'
              label='Relação do idoso com sua família:'
              value={composicaoData.relacaoIdosoComFamilia}
              disabled={!isEGPP}
              rows={3}
              onChange={isEGPP ? e => handleChangeComposicao('relacaoIdosoComFamilia', e.target.value) : () => null}
            />
            <Textarea_M3
              highlightEmpty
              name='percepcaoEquipeTecnica'
              label='Percepção da equipe técnica sobre as relações familiares:'
              value={composicaoData.percepcaoEquipeTecnica}
              disabled={!isEGPP}
              rows={3}
              onChange={isEGPP ? e => handleChangeComposicao('percepcaoEquipeTecnica', e.target.value) : () => null}
            />
          </div>

          <hr className='border-gray-100' />

          {/* 10 — Pessoas presentes na rotina */}
          <div>
            <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2'>
              Pessoas de referência ou membros da rede de apoio mais presentes na rotina do idoso
            </p>
            <DynamicGridM1
              columns={colsPessoasNaRotina}
              rows={composicaoData.pessoasNaRotina as any}
              onChange={rows => handleChangeComposicao('pessoasNaRotina', rows)}
              disabled={!isEGPP}
              addLabel='Adicionar pessoa'
              emptyMessage='Nenhuma pessoa cadastrada.'
              rowLabel='Pessoa'
            />
          </div>

        </div>
      } />

      {isEGPP && (
        <div className='grid grid-cols-12 my-4 border-t-2'>
          <Button_M3 label='Alterar Dados' onClick={handleUpdateDados} bgColor='blue' className='col-span-full sm:col-span-3' />
        </div>
      )}
    </div>
  );
};

export default FormDadosIdoso;
