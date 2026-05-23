import React, { useState } from 'react'
import Text_M3 from '../Formularios/Text_M3'
import Textarea_M3 from '../Formularios/TextArea_M3'
import Select_M3 from '../Formularios/Select_M3'
import Button_M3 from '../Formularios/Button_M3'
import Accordion_Modelo1 from '../Accordion_Modelo1'
import GridM1 from '../GridM1'
import Date_M3 from '../Formularios/Date_M3'
import { notifyError, notifySuccess } from '@/utils/Functions'
import { Residentes_PUT_alterarDados } from '@/actions/Residentes'
import { PAISI, Residente } from '@/types/Residente'
import { getUserID } from '@/utils/Login'

interface Props {
  residenteData: Residente;
  isEGPP: boolean;
}

const isFilled = (value: any): boolean => value !== undefined && value !== null && value !== '';

const defaultPAISI: PAISI = {
  diagnosticosCID10: '',
  grauDependencia: '',
  planoDeSaude: '',
  servicosSaudeILPI: '',
  regularidadeAcompanhamento: '',
  origemMedicamentos: '',
  assistenciaSaudeFora: '',
  servicoRemocao: '',
};

const options_IdosoInterditado = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' },
  { value: 'parcialmente', label: 'Parcialmente' },
  { value: 'emprocesso', label: 'Em Processo' },
];

const FormPAISI = ({ residenteData, isEGPP = true }: Props) => {
  const [paisiData, setPaisiData] = useState<PAISI>(() => ({
    ...defaultPAISI,
    ...(residenteData.paisi ?? {}),
  }));

  const handleChange = (field: keyof PAISI, value: string) => {
    setPaisiData(prev => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    handleChange(e.target.name as keyof PAISI, e.target.value);
  };

  const handleSave = async () => {
    const realizadoPor = getUserID() ?? '';
    const [, responseOk] = await Residentes_PUT_alterarDados({
      idResidente: residenteData._id,
      body: { paisi: paisiData },
      realizadoPor,
    });
    if (responseOk) {
      notifySuccess('PAISI atualizado com sucesso!');
    } else {
      notifyError('Falha ao salvar o PAISI.');
    }
  };

  const counterSaude = () => {
    const fields = [
      paisiData.diagnosticosCID10,
      paisiData.grauDependencia,
      paisiData.planoDeSaude,
      paisiData.servicosSaudeILPI,
      paisiData.regularidadeAcompanhamento,
    ];
    const filled = fields.filter(isFilled).length;
    return { filled, total: fields.length };
  };

  const counterAssistencia = () => {
    const fields = [
      paisiData.origemMedicamentos,
      paisiData.assistenciaSaudeFora,
      paisiData.servicoRemocao,
    ];
    const filled = fields.filter(isFilled).length;
    return { filled, total: fields.length };
  };

  return (
    <div className='flex flex-col'>

      {/* IDENTIFICAÇÃO — somente leitura, dados já editáveis no PIA */}
      <Accordion_Modelo1 titulo='Identificação do Idoso' initialExpanded={true} child={
        <GridM1 colsNumber={4}>
          <Text_M3 className={'sm:col-span-4 col-span-full'} name='nome' label='Nome' value={residenteData.nome ?? ''} disabled onChange={() => null} />
          <Text_M3 className={'sm:col-span-2 col-span-full'} name='apelido' label='Apelido' value={residenteData.apelido ?? ''} disabled onChange={() => null} />
          <Date_M3 className={'sm:col-span-2 col-span-full'} name='data_nascimento' label='Data de Nascimento' value={residenteData.data_nascimento ?? ''} disabled onChange={() => null} />
          <Text_M3 className={'sm:col-span-2 col-span-full'} name='estadoCivil' label='Estado Civil' value={residenteData.estadoCivil ?? ''} disabled onChange={() => null} />
          <Text_M3 className={'sm:col-span-2 col-span-full'} name='nacionalidade' label='Nacionalidade' value={residenteData.nacionalidade ?? ''} disabled onChange={() => null} />
          <Text_M3 className={'sm:col-span-2 col-span-full'} name='naturalidade' label='Naturalidade' value={residenteData.naturalidade ?? ''} disabled onChange={() => null} />
          <Text_M3 className={'sm:col-span-2 col-span-full'} name='contatoIdoso' label='Telefone de contato com o idoso' value={residenteData.contatoIdoso ?? ''} disabled onChange={() => null} />
          <Select_M3 className={'sm:col-span-2 col-span-full'} name='idosoInterditado' label='Idoso interditado' value={residenteData.idosoInterditado ?? ''} disabled onChange={() => null} options={options_IdosoInterditado} />
          <Text_M3 className={'sm:col-span-2 col-span-full'} name='nomeCurador' label='Nome do curador' value={residenteData.nomeCurador ?? ''} disabled onChange={() => null} />
          <Text_M3 className={'sm:col-span-2 col-span-full'} name='contatoCurador' label='Contatos do curador' value={residenteData.contatoCurador ?? ''} disabled onChange={() => null} />
          <p className='col-span-full text-xs text-gray-400 mt-1'>
            Para editar os dados de identificação, acesse o menu <strong>PIA</strong>.
          </p>
        </GridM1>
      } />

      {/* DIAGNÓSTICOS E SAÚDE */}
      <Accordion_Modelo1 titulo='Diagnósticos e Saúde' initialExpanded={true} counter={counterSaude()} child={
        <div className='mt-2 grid grid-cols-1 sm:grid-cols-4 gap-3'>
          <Textarea_M3
            highlightEmpty
            className='col-span-full'
            name='diagnosticosCID10'
            label='Diagnósticos médicos com Classificação Internacional de Doenças (CID-10)'
            value={paisiData.diagnosticosCID10}
            disabled={!isEGPP}
            onChange={isEGPP ? handleInputChange : () => null}
          />
          <Textarea_M3
            highlightEmpty
            className='col-span-full'
            name='grauDependencia'
            label='Grau de dependência (com base em instrumentos planejados para medir a habilidade da pessoa em desempenhar suas atividades cotidianas de forma independente e assim determinar as necessárias intervenções de reabilitação)'
            value={paisiData.grauDependencia}
            disabled={!isEGPP}
            onChange={isEGPP ? handleInputChange : () => null}
          />
          <Text_M3
            highlightEmpty
            className='sm:col-span-2 col-span-full'
            name='planoDeSaude'
            label='Nome do plano de saúde contratado (caso exista)'
            value={paisiData.planoDeSaude}
            disabled={!isEGPP}
            onChange={isEGPP ? handleInputChange : () => null}
          />
          <Textarea_M3
            highlightEmpty
            className='col-span-full'
            name='servicosSaudeILPI'
            label='Descrever quais os serviços de saúde a ILPI oferece'
            value={paisiData.servicosSaudeILPI}
            disabled={!isEGPP}
            onChange={isEGPP ? handleInputChange : () => null}
          />
          <Textarea_M3
            highlightEmpty
            className='col-span-full'
            name='regularidadeAcompanhamento'
            label='Regularidade de acompanhamento da equipe multiprofissional'
            value={paisiData.regularidadeAcompanhamento}
            disabled={!isEGPP}
            onChange={isEGPP ? handleInputChange : () => null}
          />
        </div>
      } />

      {/* MEDICAMENTOS E ASSISTÊNCIA EXTERNA */}
      <Accordion_Modelo1 titulo='Medicamentos e Assistência Externa' initialExpanded={true} counter={counterAssistencia()} child={
        <div className='mt-2 grid grid-cols-1 sm:grid-cols-4 gap-3'>
          <Textarea_M3
            highlightEmpty
            className='col-span-full'
            name='origemMedicamentos'
            label='Informar a origem dos medicamentos e a frequência com que são fornecidos (Ex.: Farmácia popular, posto de saúde, família)'
            value={paisiData.origemMedicamentos}
            disabled={!isEGPP}
            onChange={isEGPP ? handleInputChange : () => null}
          />
          <Textarea_M3
            highlightEmpty
            className='col-span-full'
            name='assistenciaSaudeFora'
            label='Detalhar a assistência de saúde do idoso fora da ILPI (atenção básica, atenção secundária, atenção terciária; preferência por instituições próximas ao local onde o idoso vive; respeitar o poder decisório do idoso e familiar; em casos de urgência dar preferência para hospitais mais próximos da ILPI)'
            value={paisiData.assistenciaSaudeFora}
            disabled={!isEGPP}
            onChange={isEGPP ? handleInputChange : () => null}
          />
          <Textarea_M3
            highlightEmpty
            className='col-span-full'
            name='servicoRemocao'
            label='Caso use serviço de remoção particular, informar qual o serviço e telefone para contato. Ou se a instituição contrata serviço de remoção móvel para os idosos institucionalizados'
            value={paisiData.servicoRemocao}
            disabled={!isEGPP}
            onChange={isEGPP ? handleInputChange : () => null}
          />
        </div>
      } />

      {isEGPP && (
        <div className='flex justify-end px-4 pb-6'>
          <Button_M3 label='Salvar PAISI' onClick={handleSave} />
        </div>
      )}
    </div>
  );
};

export default FormPAISI;
