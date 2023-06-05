import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { formatDateBR, formatDateBRHora } from '@/utils/Functions';
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
        <h2 className="font-semibold mt-1 text-xs text-red-500">Se a data estiver em vermelho, significa que falta cadastrar para o idoso</h2>
      </header>
      <div className="p-3">

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table-auto w-full whitespace-nowrap border border-collapse">

            {/* Table header */}
            <thead className="text-xs uppercase text-slate-400 bg-slate-200 rounded-sm">
              <tr className='text-center'>
                <th className="p-2">
                  <div className="font-semibold text-center">Nome do Residente</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-center">Anotações de Enfermagem</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-center">Sinais Vitais</div>
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

                  const dataAnotacao = item.lastEntryAnotacoes?.data

                  return (
                    // /* Row */
                    <tr key={index} className={`text-center ${index % 2 == 0 ? 'bg-slate-100' : ''}`}>
                      <td className="p-2 overflow-hidden max-w-[150px]">
                        <Link href={`/portal/residentes/${item._id}`} className="flex items-center">
                          <Image width={40} height={40} className='rounded-full w-10 h-10 shrink-0 mr-2' src={foto} alt={`${item.nome} Idosa Lar Felizidade`} />
                          <div className="text-slate-800">{item.nome}</div>
                        </Link>
                      </td>
                      <td className={`pl-3`}>
                        <span className={`mr-1 ${testDateAnot ? 'bg-red-500 rounded px-2 py-1' : ''}`}>
                          {dataAnotacao ? formatDateBR(dataAnotacao) : ""}
                        </span>
                        <span className='mr-1'>-</span>
                        <span>{item.lastEntryAnotacoes?.usuario_nome}</span>
                      </td>
                      <td className='pl-3'>
                        <span className={`mr-1 ${testDateSinais ? 'bg-red-500 rounded px-2 py-1' : ''}`}>
                          {item.lastEntrySinais?.createdAt}
                        </span>
                        <span className='mr-1'>-</span>
                        <span>{item.lastEntrySinais?.usuario_nome}</span>
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
