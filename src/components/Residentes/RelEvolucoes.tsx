import { formatDateBRHora, formatStringDate } from '@/utils/Functions';
import axios from 'axios'
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react'
import { FaDownload } from 'react-icons/fa';
import generateDocx from '@/utils/docxjs/docEvolucao';
import CardEvolucao from '../Cards/CardEvolucao';

type RelatorioData = {
  _id: string,
  categoria: string,
  dataEvolucao: string,
  descricao: string,
  area: string,
  residente_id: string,
  usuario_id: string,
  usuario_nome: string,
}

const RelAnotacoes = ({ residenteData }: any) => {
  const [skip, setSkip] = useState(0);
  const [limit] = useState(100);
  const [total, setTotal] = useState(0);
  const [relatorioData, setRelatorioData] = useState<RelatorioData[]>([]);
  const router = useRouter();
  const residente_id = router.query?.id?.[0];
  const [nomesResponsaveis, setNomesResponsaveis] = useState<any>();
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [idResponsaveis, setIdResponsaveis] = useState<any[]>([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [areaFiltro, setAreaFiltro] = useState('');
  const [areasDisponiveis, setAreasDisponiveis] = useState<string[]>([]);

  const getAnotacoesResidente = async (newSkip = 0, append = false) => {
    const response = await axios.get(`/api/Controller/EvolucaoController?type=pages&residente_id=${residente_id}&skip=${newSkip}&limit=${limit}`)
    const { count, data } = await response.data
    setTotal(count)
    setRelatorioData(prev => append ? [...prev, ...data] : data)

    const names = data.map((item: any) => item.usuario_nome);
    const uniqueNames = names.filter((name: any, index: any) => names.indexOf(name) === index);
    const ids = data.map((item: any) => item.usuario_id);
    const uniqueIds = ids.filter((id: any, index: any) => ids.indexOf(id) === index);
    setIdResponsaveis(uniqueIds)
    setNomesResponsaveis(uniqueNames)
  }

  useEffect(() => {
    if (residente_id) {
      getAnotacoesResidente(0, false);
      setSkip(0);
      setIsFiltered(false);
    }
    // eslint-disable-next-line
  }, [residente_id]);

  const reportByDate = async () => {
    const result = await axios.get(`/api/Controller/EvolucaoController?type=report&id=${residente_id}&dataInicio=${dataInicio}&dataFim=${incrementDate(dataFim)}`)
    if (result.status > 199 && result.status < 300) {
      const names = result.data.map((item: any) => item.usuario_nome);
      const uniqueNames = names.filter((name: any, index: any) => names.indexOf(name) === index);
      setRelatorioData(result.data)
      setNomesResponsaveis(uniqueNames)
      setTotal(result.data.length)
      setIsFiltered(true);
    }
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    await reportByDate()
  }

  const handleChangefiltroData = (e: any) => {
    const nomeCampo = e.target.name
    const valorCampo = e.target.value
    if (nomeCampo == "rel_data_inicio") {
      setDataInicio(valorCampo)
    }
    else if (nomeCampo == "rel_data_fim") {
      setDataFim(valorCampo)
    }
    else if (nomeCampo == "rel_area") {
      setAreaFiltro(valorCampo)
    }
  }


  function incrementDate(dateString: string) {
    const [year, month, day] = dateString.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    date.setDate(date.getDate() + 1);
    const incrementedYear = date.getFullYear();
    const incrementedMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    const incrementedDay = date.getDate().toString().padStart(2, '0');
    return `${incrementedYear}-${incrementedMonth}-${incrementedDay}`;
  }

  function docName() {
    const cpf = residenteData.cpf;
    const firstFiveNumbers = cpf.replace(/\D/g, "").slice(0, 5);
    const primeiroNome = residenteData.nome.split(' ')[0]
    const nameOf = `Rel_Evolucao_${primeiroNome}${firstFiveNumbers}_${dataInicio}_${dataFim}`
    return nameOf
  }

  async function getResponsaveisData() {
    const objIds = { "arrayIds": idResponsaveis }
    const res = await fetch("/api/Controller/Usuario?type=arrayIds", {
      method: "POST",
      body: JSON.stringify(objIds),
    });
    const data = await res.json()
    return data.result
  }

  const handleGenerateDoc = async () => {
    const teste = await getResponsaveisData()
    generateDocx(relatorioData, teste, residenteData.nome, residenteData.cpf, formatStringDate('dd/mm/yy', dataInicio), formatStringDate('dd/mm/yy', dataFim), docName())
  }

  const handleLoadMore = async () => {
    const newSkip = relatorioData.length;
    await getAnotacoesResidente(newSkip, true);
    setSkip(newSkip);
  };

  return (
    <div className='text-center mt-3'>
      <div className='flex flex-col  md:flex-row justify-between items-center'>
        {/* HEADER */}
        <h2 className='font-bold text-xl'>RELATÓRIO - EVOLUÇÕES</h2>
        <div onClick={handleGenerateDoc} className='cursor-pointer py-2 px-4 rounded-full text-white bg-blue-500'>
          <FaDownload />
        </div>
      </div>

      {/* TOTAL DE REGISTROS */}
      <div className='my-2 text-sm font-semibold'>
        Total de registros encontrados: {total}
      </div>

      {/* FORM FILTER BY DATE */}
      <div className='my-4 text-xs border rounded-md w-full'>
        <h2 className='font-bold my-2'>Filtro de Data e Área</h2>
        <form onSubmit={handleSubmit} className='flex flex-col md:flex-row gap-4 justify-center items-center p-2' action="">
          <div className='flex flex-col'>
            <label htmlFor="rel_data_inicio">Data Início:</label>
            <input className='border p-1' required onChange={handleChangefiltroData} type="date" name='rel_data_inicio' value={dataInicio} />
          </div>
          <div className='flex flex-col'>
            <label htmlFor="rel_data_fim">Data Fim:</label>
            <input className='border p-1' required onChange={handleChangefiltroData} type="date" name='rel_data_fim' value={dataFim} />
          </div>
          {/* <div className='flex flex-col'>
            <label htmlFor="rel_area">Área:</label>
            <select className='border p-1' name='rel_area' value={areaFiltro} onChange={handleChangefiltroData}>
              <option value="">Todas</option>
              {areasDisponiveis.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div> */}
          <div>
            <button className='mt-3 md:mt-6 border rounded-md shadow-md bg-blue-600 text-white px-3 py-2' type='submit'>Buscar</button>
          </div>
        </form>
      </div>

      {relatorioData.length > 0 && relatorioData.map((item, index) => (
        <CardEvolucao key={item._id} item={item as any} />
      ))}

      {/* MOSTRANDO QUANTOS */}
      <div className='mt-1 text-xs text-right'>
        Mostrando: {relatorioData.length} de {total}
      </div>

      {/* BOTÃO CARREGAR MAIS OU MENSAGEM */}
      {!isFiltered && (
        <div className='flex justify-center my-4'>
          {relatorioData.length < total ? (
            <button
              className='border rounded-md shadow-md bg-blue-600 text-white px-4 py-2'
              onClick={handleLoadMore}
            >
              Carregar mais
            </button>
          ) : total > 0 ? (
            <span className='text-gray-500 text-xs'>Todos os resultados já estão sendo mostrados</span>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default RelAnotacoes