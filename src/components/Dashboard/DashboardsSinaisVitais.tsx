import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import EdimeMaia from '../../../public/images/idosos/EdimeMaia.jpg'
import CarmemIacovino from '../../../public/images/idosos/CarmemIacovino.jpg'
import { pillsBadge } from '@/utils/Functions';
import { FaEye } from 'react-icons/fa';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css'
import axios from 'axios';

type ResponseData = {
  createdAt: number;
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

const DashboardsSinaisVitais = () => {
  const [data, setData] = useState<ResponseData[]>([]);

  const fetchData = async () => {
    const response = await axios.get('/api/Controller/SinaisVitaisController?type=pages&skip=0&limit=5')
    const { data } = response.data
    setData(data)
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="col-span-full xl:col-span-8 bg-white shadow-lg rounded-sm border border-slate-200">
      <header className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-800">Últimos Sinais Vitais Registrados</h2>
      </header>
      <div className="p-3">

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table-auto w-full whitespace-nowrap">
            {/* Table header */}
            <thead className="text-xs uppercase text-slate-400 bg-slate-50 rounded-sm">
              <tr>
                <th className="p-2">
                  <div className="font-semibold text-left">Idoso</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-center">Data</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-center">Saúde</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-center">Técnico</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-center">Detalhes</div>
                </th>
              </tr>
            </thead>
            {/* Table body */}
            <tbody className="text-sm font-medium divide-y divide-slate-100">
              {/* Row */}
              <tr>
                <td className="p-2">
                  <div className="flex items-center">
                    <Image className='rounded-full w-10 h-10 shrink-0 mr-2' src={EdimeMaia} alt='Edime Maia Idosa Lar Felizidade' />
                    <div className=" text-slate-800">Edime Maia</div>
                  </div>
                </td>
                <td className="p-2 ">
                  <div className="text-center">10/10/2020</div>
                </td>
                <td className="p-2 text-center">
                  {pillsBadge('green', 'Bem')}
                </td>
                <td className="p-2">
                  <div className="text-center">Luciana P.</div>
                </td>
                <td className="p-2 text-center">
                  <button className="text-blue-800 font-bold">
                    <FaEye data-tooltip-id='tt_detalhes' className='m-auto' data-tooltip-content='Ver Detalhes' />
                    <Tooltip id="tt_detalhes" />
                  </button>
                </td>
              </tr>
              {/* Row */}
              <tr>
                <td className="p-2">
                  <div className="flex items-center w-max">
                    <Image className='rounded-full w-10 h-10 shrink-0 mr-2' src={CarmemIacovino} alt='Edime Maia Idosa Lar Felizidade' />
                    <div className="text-slate-800">Carmem Iacovino</div>
                  </div>
                </td>
                <td className="p-2">
                  <div className="text-center">10/10/2020</div>
                </td>
                <td className="p-2 text-center">
                  {pillsBadge('yellow', "Atenção")}
                </td>
                <td className="p-2">
                  <div className="text-center">Luciana P.</div>
                </td>
                <td className="p-2 text-center">
                  <button className="text-blue-800 font-bold">
                    <FaEye data-tooltip-id='tt_detalhes' className='m-auto' data-tooltip-content='Ver Detalhes' />
                    <Tooltip id="tt_detalhes" />
                  </button>
                </td>

              </tr>


            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
}

export default DashboardsSinaisVitais;
