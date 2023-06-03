import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { formatDateBR, formatDateBRHora, pillsBadge } from '@/utils/Functions';
import { FaEye } from 'react-icons/fa';
import { BsArrowUpRightCircleFill } from 'react-icons/bs';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css'
import axios from 'axios';
import { notifyError } from '@/utils/Functions';
import Link from 'next/link';
import fotoPadrao from '../../../public/images/lar felizidade logo transparente.png'

type Data = {
  _id: string;
  nome: string;
  foto_base64: string;
  lastEntrySinais?: { usuario_nome?: string, createdAt?: string };
  lastEntryAnotacoes?: { usuario_nome?: string, data?: string };
}

const EvolucaoResidente = () => {

  const [dataAnotacoes, setDataAnotacoes] = useState<Data[]>([]);

  const fetchData = async () => {
    const response = await axios.get(`/api/Controller/ResidenteAggregateController?type=getTable`)
    const result = response.data
    if (response.status === 200) {
      setDataAnotacoes(result)
    } else {
      notifyError("Ocorreu um erro ao buscar os dados")
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const dateHoje = formatDateBRHora(new Date)

  return (
    <div className="col-span-full bg-white shadow-lg rounded-sm border border-slate-200">
      <header className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-800 text-center">Hoje, {dateHoje}</h2>
        <h2 className="font-semibold mt-1 text-xs text-red-500">FALTA CADASTRO: ANOTAÇÕES DE ENFERMAGEM</h2>
      </header>
      <div className="p-3">

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap border">

            {/* Table header */}
            <thead className="text-xs uppercase text-slate-400 bg-slate-200 rounded-sm">
              <tr className='text-center'>
                <th className="p-2">
                  <div className="font-semibold text-center">Idoso</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-center">anot nome</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-center">anot data</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-center">sinais nome</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-center">sinais data</div>
                </th>
              </tr>
            </thead>


            {/* Table body */}
            <tbody className="text-sm font-medium divide-y divide-slate-200">
              {dataAnotacoes && (
                dataAnotacoes.map((item, index) => {
                  const foto = item.foto_base64 ? item.foto_base64 : fotoPadrao

                  const dateAnot = new Date(item.lastEntryAnotacoes?.data as string)
                  dateAnot.setHours(dateAnot.getHours() + 3)
                  const testDateAnot = dateAnot.getDate() < new Date().getDate() && new Date().getHours() > 10

                  const dateSinais = new Date(item.lastEntrySinais?.createdAt as string)
                  const timeDifference = new Date().getTime() - dateSinais.getTime();
                  const hoursDifference = timeDifference / (1000 * 60 * 60);
                  const testDateSinais = hoursDifference > 6

                  return (
                    // /* Row */
                    <tr key={index} className={`text-center ${index % 2 == 0 ? 'bg-slate-100' : ''}`}>
                      <td className="p-2 overflow-hidden max-w-[150px]">
                        <div className="flex items-center">
                          <Image width={40} height={40} className='rounded-full w-10 h-10 shrink-0 mr-2' src={foto} alt={`${item.nome} Idosa Lar Felizidade`} />
                          <div className="text-slate-800">{item.nome}</div>
                        </div>
                      </td>
                      <td className={`pl-1`}>
                        <span className={`${testDateAnot ? 'bg-red-500 rounded px-2 py-1' : ''}`}>
                          {formatDateBR(item.lastEntryAnotacoes?.data)}
                        </span>
                      </td>
                      <td className='pl-1 max-w-[50px] overflow-hidden'>
                        {item.lastEntryAnotacoes?.usuario_nome}
                      </td>
                      <td className='pl-1'>
                        <span className={`${testDateSinais ? 'bg-red-500 rounded px-2 py-1' : ''}`}>
                          {item.lastEntrySinais?.createdAt}
                        </span>
                      </td>
                      <td className='pl-1 max-w-[50px] overflow-hidden'>
                        {item.lastEntrySinais?.usuario_nome}
                      </td>
                    </tr>
                  )
                })
              )}

            </tbody>
          </table>

        </div>
      </div>
    </div >
  )
}

export default EvolucaoResidente
