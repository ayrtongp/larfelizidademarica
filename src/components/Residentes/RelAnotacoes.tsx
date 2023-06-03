import { formatDateBRHora } from '@/utils/Functions';
import axios from 'axios'
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react'

type RelatorioData = {
  abdomen: string
  aceitacaodadieta: string
  auscultapulmonar: string
  cardiovascular: string
  consciencia: string
  createdAt: string
  data: string
  eliminacoes: string
  eliminacoesintestinais: string
  hemodinamico: string
  integridadecutanea: string
  mmii: string
  mmss: string
  mucosas: string
  observacoes: string
  pressaoarterial: string
  residente_id: string
  respiratorio: string
  updatedAt: string
  usuario_id: string
  usuario_nome: string
  _id: string
}

const RelAnotacoes = () => {
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(100);
  const [total, setTotal] = useState(0);
  const [relatorioData, setRelatorioData] = useState<RelatorioData[]>([]);
  const router = useRouter();
  const residente_id = router.query?.id?.[0]

  const getAnotacoesResidente = async () => {
    const response = await axios.get(`/api/Controller/AnotacoesEnfermagemController?type=pages&residente_id=${residente_id}&skip=${skip}&limit=${limit}`)
    const { count, data } = await response.data
    setTotal(count)
    setRelatorioData(data)
  }

  useEffect(() => {
    getAnotacoesResidente()
  }, [])

  return (
    <div className='text-center mt-3'>
      <h2 className='font-bold text-xl'>RELATÓRIO - ANOTAÇÕES DE ENFERMAGEM</h2>
      <div className='mt-4 w-full overflow-x-auto'>
        <table id='rel-sinais-tabela' className='text-center text-xs border rounded-md p-2'>
          <thead className='bg-gray-200'>
            <tr className="bg-black font-bold text-white">
              <th className='px-2 hidden'>ID</th>
              <th className='px-2'>Data Registro</th>
              <th className='px-2'>Responsável</th>

              <th className='px-2'>Consciência</th>
              <th className='px-2'>Hemodinâmico</th>
              <th className='px-2'>Cardiovascular</th>
              <th className='px-2'>Pressão Arterial</th>
              <th className='px-2'>Respiratório</th>
              <th className='px-2'>Mucoas</th>
              <th className='px-2'>Integridade Cutânea</th>
              <th className='px-2'>MMSS</th>
              <th className='px-2'>MMII</th>
              <th className='px-2'>Aceitação da Dieta</th>
              <th className='px-2'>Abdômen</th>
              <th className='px-2'>Eliminações</th>
              <th className='px-2'>Eliminações Intestinais</th>
              <th className='px-2'>Ausculta Pulmonar</th>
              <th className='px-2'>Observações</th>
            </tr>
          </thead>
          <tbody>
            {relatorioData.map((linha, index) => (
              <tr key={linha._id} className={`${index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}>
                <td className="hidden px-4 py-1 border">{linha._id}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{formatDateBRHora(linha.createdAt)}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.usuario_nome}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.consciencia}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.hemodinamico}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.cardiovascular}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.pressaoarterial}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.respiratorio}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.mucosas}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.integridadecutanea}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.mmss}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.mmii}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.aceitacaodadieta}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.abdomen}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.eliminacoes}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.eliminacoesintestinais}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.auscultapulmonar}</td>
                <td className="whitespace-nowrap px-4 py-1 border">{linha.observacoes}</td>
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
