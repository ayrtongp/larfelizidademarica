import React, { useState } from 'react'
import Text_M3 from '../Formularios/Text_M3'
import { notifyError, notifySuccess } from '@/utils/Functions'
import { Residentes_PUT_alterarDados } from '@/actions/Residentes'
import Button_M3 from '../Formularios/Button_M3'
import { Residente } from '@/types/Residente'
import Textarea_M3 from '../Formularios/TextArea_M3'
import Accordion_Modelo1 from '../Accordion_Modelo1'
import Select_M3 from '../Formularios/Select_M3'
import GridM1 from '../GridM1'
import Date_M3 from '../Formularios/Date_M3'

interface Props {
  residenteData: Residente;
  isEGPP: boolean;
}

const FormDadosIdoso = ({ residenteData, isEGPP = true }: Props) => {
  const [bodyUpdate, setBodyUpdate] = useState({});
  const [formData, setFormData] = useState<Residente>(residenteData);

  const handleUpdateDados = async () => {
    const [result, responseOk] = await Residentes_PUT_alterarDados({ idResidente: residenteData._id as string, body: bodyUpdate })
    if (responseOk) {
      notifySuccess('Dado de Residente Alterado!')
    } else {
      notifyError('Falha ao alterar os dados.')
    }
  }

  const handleChangeDados = (e: any) => {
    setFormData((prevStatus: any) => ({
      ...prevStatus,
      [e.target.name]: e.target.value,
    }));
    setBodyUpdate((prevStatus: any) => ({
      ...prevStatus,
      [e.target.name]: e.target.value,
    }));
  };

  const options_IdosoInterditado = [
    { value: 'sim', label: "Sim" },
    { value: 'nao', label: "Não" },
    { value: 'parcialmente', label: "Parcialmente" },
    { value: 'emprocesso', label: "Em Processo" },
  ]

  const options_ResidenciaAntiga = [
    { value: 'sozinho', label: "Residia Sozinho(a)" },
    { value: 'outraILPI', label: "Residia em Outra ILPI" },
    { value: 'familiares', label: "Residia com Familiares" },
  ]

  return (
    <div className='flex flex-col'>
      <Accordion_Modelo1 titulo='Identificação' initialExpanded={true} child={
        <GridM1 colsNumber={4} >
          <Text_M3 className={'sm:col-span-4 col-span-full'} name={`nome`} label={`Nome do Residente`} value={formData.nome} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Date_M3 className={'sm:col-span-2 col-span-full'} name={`data_nascimento`} label={`Data de Nascimento`} value={formData.data_nascimento} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 className={'sm:col-span-2 col-span-full'} name={`apelido`} label={`Apelido`} value={formData.apelido} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 className={'sm:col-span-2 col-span-full'} name={`estadoCivil`} label={`Estado Civil`} value={formData.estadoCivil} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 className={'sm:col-span-2 col-span-full'} name={`nacionalidade`} label={`Nacionalidade`} value={formData.nacionalidade} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 className={'sm:col-span-2 col-span-full'} name={`naturalidade`} label={`Naturalidade`} value={formData.naturalidade} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 className={'sm:col-span-2 col-span-full'} name={`contatoIdoso`} label={`Núm. Contato (idoso)`} value={formData.contatoIdoso} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 className={'sm:col-span-2 col-span-full'} name={`contatoFamiliar`} label={`Núm. Contato (familiar)`} value={formData.contatoFamiliar} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Select_M3 className={'sm:col-span-2 col-span-full'} name={`idosoInterditado`} label={`Pessoa Idosa Interditada`} value={formData.idosoInterditado} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} options={options_IdosoInterditado} />
          <Textarea_M3 className={'col-span-full'} name={`processoInterdicao`} label={`Dados do Processo Judicial`} value={formData.processoInterdicao} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 className={'sm:col-span-2 col-span-full'} name={`nomeCurador`} label={`Nome do Curador`} value={formData.nomeCurador} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 className={'sm:col-span-2 col-span-full'} name={`contatoCurador`} label={`Contato do Curador`} value={formData.contatoCurador} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 className={'sm:col-span-2 col-span-full'} name={`genero`} label={`Gênero`} value={formData.genero} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Textarea_M3 className={'col-span-full'} name={`informacoes`} label={`Descrição do Idoso`} value={formData.informacoes} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
        </GridM1>
      } />

      <Accordion_Modelo1 titulo='Situação Documental' initialExpanded={false} child={
        <div className='mt-2 grid grid-cols-1 sm:grid-cols-4 gap-3'>
          <Text_M3 className={'sm:col-span-2 col-span-full'} name={`cpf`} label={`CPF`} value={formData.cpf} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 className={'sm:col-span-2 col-span-full'} name={`identidade`} label={`RG`} value={formData.identidade} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 className={'sm:col-span-2 col-span-full'} name={`certidaoNasCas`} label={`Certidão de Nascimento/Casamento`} value={formData.certidaoNasCas} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 className={'sm:col-span-2 col-span-full'} name={`tituloEleitor`} label={`Título de Eleitor`} value={formData.tituloEleitor} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 className={'sm:col-span-2 col-span-full'} name={`reservista`} label={`Certificado de Reservista`} value={formData.reservista} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 className={'sm:col-span-2 col-span-full'} name={`carteiraTrabalho`} label={`Carteira de Trabalho`} value={formData.carteiraTrabalho} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 className={'sm:col-span-2 col-span-full'} name={`carteiraVacinacao`} label={`Carteira de Vacinação`} value={formData.carteiraVacinacao} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
        </div>
      } />

      <Accordion_Modelo1 titulo='Admissão' initialExpanded={false} child={
        <div className='mt-2 grid grid-cols-1 sm:grid-cols-4 gap-3'>
          <Date_M3 className={'sm:col-span-2 col-span-full'} name={`data_entrada`} label={`Data de Entrada`} value={formData.data_entrada} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Text_M3 className={'sm:col-span-2 col-span-full'} name={`numProntuario`} label={`Número de Prontuário`} value={formData.numProntuario} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Select_M3 className={'sm:col-span-2 col-span-full'} name={`residenciaAntiga`} label={`A Pessoa Idosa Antes de Residir na ILPI`} value={formData.residenciaAntiga} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} options={options_ResidenciaAntiga} />
          <Textarea_M3 className={'col-span-full'} name={`enderecoOrigem`} label={`Endereço de Origem`} value={formData.enderecoOrigem} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
        </div>
      } />

      <Accordion_Modelo1 titulo='Questionário' initialExpanded={false} child={
        <div className='mt-2 grid grid-cols-1 sm:grid-cols-4 gap-3'>
          <Textarea_M3 className={'col-span-full'} name={`questionario.decisaoMoradia`} label={`A institucionalização foi realizada por iniciativa da pessoa idosa ou por decisão de terceiros?`} value={formData.questionario?.decisaoMoradia || ''} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Textarea_M3 className={'col-span-full'} name={`questionario.motivoMoradia`} label={`Motivo da Institucionalização informada pela pessoa idosa e/ou familiares:`} value={formData.questionario?.motivoMoradia || ''} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Textarea_M3 className={'col-span-full'} name={`questionario.opiniaoMoradia`} label={`Opinião e expectativas da pessoa idosa quantoà institucionalização:`} value={formData.questionario?.opiniaoMoradia || ''} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />
          <Textarea_M3 className={'col-span-full'} name={`questionario.rotinaAnterior`} label={`Rotina da Pessoa Idosa antes da institucionalização:`} value={formData.questionario?.rotinaAnterior || ''} disabled={!isEGPP} onChange={isEGPP ? handleChangeDados : () => null} />

        </div>
      } />

      <Accordion_Modelo1 titulo='Composição Familiar' initialExpanded={false} child={
        <div className='mt-2 grid grid-cols-1 sm:grid-cols-4 gap-3'>

        </div>
      } />

      {isEGPP && (
        <div className='grid grid-cols-12 my-4 border-t-2'>
          <Button_M3 label='Alterar Dados' onClick={handleUpdateDados} bgColor='blue' className='col-span-full sm:col-span-3' />
        </div>
      )}
    </div>
  )
}

export default FormDadosIdoso