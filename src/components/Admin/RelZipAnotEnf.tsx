import axios from 'axios';
import React, { useEffect, useState } from 'react'
import RelResidentesMes from '@/utils/docxtemplater/relResidentesMes';
import DateSelector from '@/components/DateSelector';

interface ArrayResidentes {
  residente_id: string;
  resultados: any;
}

const RelZipAnotEnf = () => {
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [relatorioData, setRelatorioData] = useState<ArrayResidentes[]>();

  // Function to set dataInicial
  const handleSetDataInicial = (newDataInicial: string) => {
    setDataInicial(newDataInicial);
  };

  // Function to set dataFinal
  const handleSetDataFinal = (newDataFinal: string) => {
    setDataFinal(newDataFinal);
  };

  async function getRelatorioData() {
    const response = await axios.get(`/api/Controller/AnotacoesEnfermagemController?type=getBetweenDates&dataInicio=${dataInicial}&dataFim=${dataFinal}`)
    const dadosAnotacoes = response.data
    const status = response.status

    const response2 = await axios.get(`/api/Controller/SinaisVitaisController?type=getBetweenDates&dataInicio=${dataInicial}&dataFim=${dataFinal}`)
    const dadosSinais = response2.data
    const status2 = response2.status

    const response3 = await axios.get(`/api/Controller/ResidentesController?type=getAll`)
    const dadosResidentes = response3.data
    const status3 = response3.status

    const response4 = await axios.get(`/api/Controller/UsuarioController?type=getProfissionais`)
    const dadosUsuario = response4.data
    const status4 = response4.status

    const response5 = await axios.get(`/api/Controller/EvolucaoController?type=getBetweenDates&dataInicio=${dataInicial}&dataFim=${dataFinal}`)
    const dadosEvolucao = response5.data
    const status5 = response5.status


    if (status === 200) {

      // Converter usuario_nome de que pega o nome completo para Primeiro Nome e Ultimo nome com apenas uma letra e .
      const newData = dadosAnotacoes.map((item: any) => {
        const { usuario_nome, ...rest } = item;

        if (usuario_nome) {
          const nomeArray = usuario_nome.split(" ");
          const firstName = nomeArray[0];
          const lastName = nomeArray[nomeArray.length - 1].charAt(0);
          const newUsuarioNome = `${firstName} ${lastName}.`;

          return { usuario_nome: newUsuarioNome, ...rest };
        }
        return item;
      });

      // Converter usuario_nome de que pega o nome completo para Primeiro Nome e Ultimo nome com apenas uma letra e .
      const newData2 = dadosSinais.map((item: any) => {
        const { usuario_nome, ...rest } = item;

        if (usuario_nome) {
          const nomeArray = usuario_nome.split(" ");
          const firstName = nomeArray[0];
          const lastName = nomeArray[nomeArray.length - 1].charAt(0);
          const newUsuarioNome = `${firstName} ${lastName}.`;

          return { usuario_nome: newUsuarioNome, ...rest };
        }
        return item;
      });

      // Converter usuario_nome de que pega o nome completo para Primeiro Nome e Ultimo nome com apenas uma letra e .
      const newData5 = dadosEvolucao
        .map((item: any) => {
          const { usuario_nome, ...rest } = item;

          if (usuario_nome) {
            const nomeArray = usuario_nome.split(" ");
            const firstName = nomeArray[0];
            const lastName = nomeArray[nomeArray.length - 1].charAt(0);
            const newUsuarioNome = `${firstName} ${lastName}.`;

            return { usuario_nome: newUsuarioNome, ...rest };
          }
          return item;
        })
        .sort((a: any, b: any) => {
          const dateA = new Date(a.dataEvolucao).getTime();
          const dateB = new Date(b.dataEvolucao).getTime();
          return dateB - dateA; // Ordena do mais novo para o mais antigo
        });

      // Preencher o mapa com informações do residente usando dadosResidentes
      const residenteInfoMap = new Map();
      dadosResidentes.forEach((residente: any) => {
        residenteInfoMap.set(residente._id, { nome: residente.nome, cpf: residente.cpf });
      });

      // Preencher o mapa com informações do residente usando dadosResidentes
      const profissionalInfoMap = new Map<string, { nome: string; registro: string }>();
      dadosUsuario.forEach((prof: any) => {
        profissionalInfoMap.set(prof._id, {
          nome: prof.nome + " " + prof.sobrenome,
          registro: prof.funcao + " | " + prof.registro,
        });
      });

      // Filtra valores únicos de 'profissional'
      const uniqueProfissionalIds = Array.from(
        new Set<string>(newData.map((item: any) => item.usuario_id))
      );

      const uniqueProfissionalIds2 = Array.from(
        new Set<string>(newData2.map((item: any) => item.usuario_id))
      );

      const uniqueProfissionalIds5 = Array.from(
        new Set<string>(newData5.map((item: any) => item.usuario_id))
      );

      // Combina os dois conjuntos e filtra apenas os IDs que aparecem no profissionalInfoMap
      const allProfissionalIds = Array.from(
        new Set<string>([...uniqueProfissionalIds, ...uniqueProfissionalIds2, ...uniqueProfissionalIds5])
      );

      // Filtra o profissionalInfoMap com base nos IDs
      const profissionaisFiltrados = Array.from(profissionalInfoMap.entries())
        .filter(([id]) => allProfissionalIds.includes(id))
        .map(([id, info]) => ({ ...info, _id: id }));

      // Filtra valores únicos de 'residente_id'
      const uniqueResidentIds = Array.from(new Set(newData.map((item: any) => item.residente_id)));

      // Cria um array para cada 'residente_id' com os resultados
      const arraysPorResidente = uniqueResidentIds.map(residenteId => {

        const residenteInfo = residenteInfoMap.get(residenteId);
        const resultados = newData.filter((item: any) => item.residente_id === residenteId);
        const sinais = newData2.filter((item: any) => item.residente_id === residenteId);
        const evolucoes = newData5.filter((item: any) => item.residente_id === residenteId);

        return {
          residente_id: residenteId as string,
          residente_info: residenteInfo,
          profissionais: profissionaisFiltrados,
          resultados: resultados,
          sinais: sinais,
          evolucoes: evolucoes
        };
      });

      setRelatorioData(arraysPorResidente)
    }
  }

  const handleSubmit = (event: any) => {
    event.preventDefault();

    getRelatorioData()
  }

  const handleClick = (event: any) => {
    if (relatorioData != null && relatorioData != undefined) {
      RelResidentesMes(relatorioData, dataInicial, dataFinal)
    }
  }


  return (
    <div className='mx-auto'>
      <h1 className='font-bold text-center text-2xl'>Relatório de Anotações da Enfermagem</h1>

      <form onSubmit={handleSubmit} className='grid grid-cols-12 gap-2'>

        <div className='col-span-12'>
          <DateSelector handleSetDataInicial={handleSetDataInicial} handleSetDataFinal={handleSetDataFinal} />
        </div>

        <div className='col-span-12 my-2 flex flex-wrap justify-start gap-2'>
          <div className='border p-2 rounded-md bg-gray-200 max-w-[200px]'>
            <label className='text-xs font-bold' htmlFor="dataInicial">Data Inicial</label>
            <input type="text" name="dataInicial" id="dataInicial" disabled
              value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
          </div>

          <div className='border p-2 rounded-md bg-gray-200 max-w-[200px]'>
            <label className='text-xs font-bold' htmlFor="dataInicial">Data Final</label>
            <input type="text" name="dataFinal" id="dataFinal" disabled
              value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
          </div>
        </div>

        <div className='col-span-12 flex justify-center'>
          <input
            className='cursor-pointer my-2 text-center border p-2 rounded-md bg-blue-200 hover:bg-blue-600 max-w-[200px]'
            type="submit"
            value="Gerar Relatório" />
        </div>

        <div className='col-span-12 flex justify-center'>
          <button onClick={handleClick}
            className='cursor-pointer my-2 text-center border p-2 rounded-md bg-blue-200 hover:bg-blue-600 max-w-[200px]'>
            Baixar Documentos
          </button>
        </div>

      </form>

    </div>
  )
}

export default RelZipAnotEnf
