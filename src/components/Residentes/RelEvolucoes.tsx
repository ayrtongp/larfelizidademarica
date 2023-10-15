import { formatDateBRHora, formatStringDate } from '@/utils/Functions';
import axios from 'axios'
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react'
import { FaDownload } from 'react-icons/fa';
import generateDocx from '@/utils/docxjs/docEvolucao';


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
  const [limit, setLimit] = useState(100);
  const [total, setTotal] = useState(0);
  const [relatorioData, setRelatorioData] = useState<RelatorioData[]>([]);
  const router = useRouter();
  const residente_id = router.query?.id?.[0]
  const [nomesResponsaveis, setNomesResponsaveis] = useState();
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [idResponsaveis, setIdResponsaveis] = useState([]);


  const getAnotacoesResidente = async () => {
    const response = await axios.get(`/api/Controller/EvolucaoController?type=pages&residente_id=${residente_id}&skip=${skip}&limit=${limit}`)
    const { count, data } = await response.data
    setTotal(count)
    setRelatorioData(data)
    console.log(data)

    const names = await data.map((item: any) => item.usuario_nome);
    const uniqueNames = names.filter((name: any, index: any) => names.indexOf(name) === index);
    const ids = await data.map((item: any) => item.usuario_id);
    const uniqueIds = ids.filter((name: any, index: any) => ids.indexOf(name) === index);
    setIdResponsaveis(uniqueIds)
    setNomesResponsaveis(uniqueNames)
  }

  useEffect(() => {
    getAnotacoesResidente()
  }, [])

  const reportByDate = async () => {
    console.log('hey')
    const result = await axios.get(`/api/Controller/EvolucaoController?type=report&id=${residente_id}&dataInicio=${dataInicio}&dataFim=${incrementDate(dataFim)}`)
    if (result.status > 199 && result.status < 300) {
      console.log('hey2')
      const names = await result.data.map((item: any) => item.usuario_nome);
      const uniqueNames = names.filter((name: any, index: any) => names.indexOf(name) === index);
      setRelatorioData(await result.data)
      setNomesResponsaveis(uniqueNames)
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

  }

  function incrementDate(dateString: string) {
    // Parse the date string
    const [year, month, day] = dateString.split('-');
    const date = new Date(year as unknown as number, month as unknown as number - 1, day as unknown as number);

    // Increment the date by one day
    date.setDate(date.getDate() + 1);

    // Get the components of the incremented date
    const incrementedYear = date.getFullYear();
    const incrementedMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    const incrementedDay = date.getDate().toString().padStart(2, '0');

    // Return the incremented date string in the format 'yyyy-mm-dd'
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
    const config = { headers: { 'Content-Type': 'application/json' } }
    const res = await fetch("/api/Controller/UsuarioController?type=arrayIds", {
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

  return (
    <div className='text-center mt-3'>
      <div className='flex flex-col  md:flex-row justify-between items-center'>
        {/* HEADER */}
        <h2 className='font-bold text-xl'>RELATÓRIO - ANOTAÇÕES DE ENFERMAGEM</h2>
        <div onClick={handleGenerateDoc} className='cursor-pointer py-2 px-4 rounded-full text-white bg-blue-500'>
          <FaDownload />
        </div>
      </div>

      {/* FORM FILTER BY DATE */}
      <div className='my-4 text-xs border rounded-md w-full'>
        <h2 className='font-bold my-2'>Filtro de Data</h2>
        <form onSubmit={handleSubmit} className='flex flex-col justify-center items-center p-2' action="">
          <div className='flex items-center justify-start flex-col'>
            <label className='' htmlFor="rel_data_inicio">Data Início:</label>
            <input className='border p-1' required onChange={handleChangefiltroData} type="date" name='rel_data_inicio' value={dataInicio} />
          </div>
          <div className='flex items-center justify-start flex-col'>
            <label className='' htmlFor="rel_data_fim">Data Fim:</label>
            <input className='border p-1' required onChange={handleChangefiltroData} type="date" name='rel_data_fim' value={dataFim} />
          </div>
          <div>
            <button className='mt-3 border rounded-md shadow-md bg-blue-600 text-white px-3 py-2' type='submit'>Buscar</button>
          </div>
        </form>
      </div>

      <div className='mt-4 overflow-x-auto'>
        <table id='rel-sinais-tabela' className='text-center text-xs border rounded-md p-2'>
          <thead className='bg-gray-200'>
            <tr className="bg-black font-bold text-white">
              <th className='px-2 hidden'>ID</th>
              <th className='px-2'>Data Registro</th>
              <th className='px-2'>Responsável</th>

              <th className='px-2'>Categoria</th>
              <th className='px-2'>Setor</th>
              <th className='px-2'>Descrição</th>
            </tr>
          </thead>
          <tbody>
            {relatorioData.map((linha, index) => (
              <tr key={linha._id} className={`${index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}>
                <td className="hidden px-4 py-1 border">{linha._id}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{formatStringDate('yyyy-mm-dd', linha.dataEvolucao)}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.usuario_nome}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.categoria}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.area}</td>
                <td className="whitespace-normal px-4 py-1 border">{linha.descricao}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className='mt-1 text-xs text-right'>Mostrando: {1} de {total}</div>

    </div>
  )
}

export default RelAnotacoes
