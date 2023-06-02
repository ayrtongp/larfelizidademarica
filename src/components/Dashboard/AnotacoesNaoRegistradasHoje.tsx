import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { formatDateBRHora, pillsBadge } from '@/utils/Functions';
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
  foto_base64: string
}

const AnotacoesNaoRegistradasHoje = () => {

  const [data, setData] = useState<Data[]>([]);

  const currentDate = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', dateStyle: 'short' });
  const year = new Date().getFullYear();
  const today = year + '-' + currentDate.split('/')[0].padStart(2, '0') + '-' + currentDate.split('/')[1].padStart(2, '0');

  const fetchData = async () => {
    const response = await axios.get(`/api/Controller/ResidentesAnotacoesEnfController?type=listNotSinaisToday&searchDate=${today}`)
    const result = response.data.data
    if (response.status === 200) {
      setData(result)
    } else {
      notifyError("Ocorreu um erro ao buscar os dados")
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const dateHoje = formatDateBRHora(new Date)

  return (
    <div className="col-span-full md:col-span-4 bg-white shadow-lg rounded-sm border border-slate-200">
      <header className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-800 text-center">Hoje, {dateHoje}</h2>
        <h2 className="font-semibold mt-1 text-xs text-red-500">FALTA CADASTRO: ANOTAÇÕES DE ENFERMAGEM</h2>
      </header>
      <div className="p-3">

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">

            {/* Table header */}
            <thead className="text-xs uppercase text-slate-400 bg-slate-50 rounded-sm">
              <tr>
                <th className="p-2">
                  <div className="font-semibold text-left">Idoso</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-center">Ações</div>
                </th>
              </tr>
            </thead>


            {/* Table body */}
            <tbody className="text-sm font-medium divide-y divide-slate-100">
              {data && (
                data.map((item, index) => {
                  const foto = item.foto_base64 ? item.foto_base64 : fotoPadrao
                  return (
                    // /* Row */
                    <tr key={index}>
                      <td className="p-2 overflow-hidden max-w-[150px]">
                        <div className="flex items-center">
                          <Image width={40} height={40} className='rounded-full w-10 h-10 shrink-0 mr-2' src={foto} alt={`${item.nome} Idosa Lar Felizidade`} />
                          <div className="text-slate-800">{item.nome}</div>
                        </div>
                      </td>
                      <td className="p-2 overflow-hidden overflow-ellipsis text-center">
                        <Link href={`/portal/residentes/${item._id}`} className="text-blue-800 font-bold flex flex-row items-center justify-center">
                          <span className='mr-1'>Cadastrar</span>
                          <BsArrowUpRightCircleFill data-tooltip-id='tw_detalhes' className='' data-tooltip-content='Cadastrar Agora' />
                          <Tooltip id="tw_detalhes" />
                        </Link >
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

export default AnotacoesNaoRegistradasHoje
