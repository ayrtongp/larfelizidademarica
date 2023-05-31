import { formatDateBRHora } from '@/utils/Functions';
import axios from 'axios'
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react'

type RelatorioData = {
  createdAt: string;
  diurese: string;
  evacuacao: string;
  frequenciaCardiaca: string;
  frequenciaRespiratoria: string;
  glicemiaCapilar: string;
  pressaoArterial: string;
  residente_id: string;
  saturacao: string;
  temperatura: string;
  updatedAt: string;
  usuario_id: string;
  usuario_nome: string;
  _id: string;
}

const RelSinaisVitais = () => {
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(100);
  const [total, setTotal] = useState(0);
  const [relatorioData, setRelatorioData] = useState<RelatorioData[]>([]);
  const router = useRouter();
  const residente_id = router.query?.id?.[0]

  const getSinaisResidente = async () => {
    const response = await axios.get(`/api/Controller/SinaisVitaisController?type=pages&residente_id=${residente_id}&skip=${skip}&limit=${limit}`)
    const { count, data } = await response.data
    setTotal(count)
    setRelatorioData(data)
  }

  useEffect(() => {
    getSinaisResidente()
  }, [])

  return (
    <div className='text-center mt-3'>
      <h2 className='font-bold text-xl'>RELATÓRIO SINAIS VITAIS</h2>
      <div className='mt-4 w-full overflow-x-auto'>
        <table className='text-center text-xs border rounded-md p-2'>
          <thead className='bg-gray-200'>
            <tr className="bg-black font-bold text-white">
              <th className='px-2 hidden'>ID</th>
              <th className='px-2'>Data Registro</th>
              <th className='px-2'>Responsável</th>
              <th className='px-2'>Pressão Arterial</th>
              <th className='px-2'>Freq. Cardíaca</th>
              <th className='px-2'>Freq. Respiratória</th>
              <th className='px-2'>Temperatura</th>
              <th className='px-2'>Saturação</th>
              <th className='px-2'>Glicemia Capilar</th>
              <th className='px-2'>Diurese</th>
              <th className='px-2'>Evacuações</th>
            </tr>
          </thead>
          <tbody>
            {relatorioData.map((linha, index) => (
              <tr key={linha._id} className={`${index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}>
                <td className="hidden px-4 py-1 border">{linha._id}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{formatDateBRHora(linha.createdAt)}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.usuario_nome}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.pressaoArterial}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.frequenciaCardiaca}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.frequenciaRespiratoria}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.temperatura}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.saturacao}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.glicemiaCapilar}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.diurese}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.evacuacao}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className='mt-1 text-xs text-right'>Mostrando: {1} de {total}</div>

    </div>
  )
}

export default RelSinaisVitais
