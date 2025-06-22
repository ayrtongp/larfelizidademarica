import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { formatDateBR, formatDateBRHora } from '@/utils/Functions';
import 'react-tooltip/dist/react-tooltip.css'
import axios from 'axios';
import { notifyError } from '@/utils/Functions';
import Link from 'next/link';
import fotoPadrao from '../../../public/images/lar felizidade logo transparente.png'
import { FaClipboardList, FaStethoscope } from 'react-icons/fa';

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
    <div className="col-span-full bg-white shadow-lg rounded-sm border border-slate-200 max-h-screen overflow-y-auto scrollbar-none">
      <header className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-800 text-center">Hoje, {dateHoje}</h2>
        <h2 className="font-semibold mt-1 text-xs text-red-500">Se a data estiver em vermelho, significa que falta cadastrar para o idoso</h2>
      </header>
      <div className="p-3">

        {dataAnotacoes.length > 0 && dataAnotacoes.map((item, index) => {

          return (
            <IdosoCard
              key={index}
              item={item}
              nome={item.nome}
              fotoUrl={item.foto_base64}
              ultimaMedicao={`${formatDateBRHora(item.lastEntrySinais?.createdAt)} - ${item.lastEntrySinais?.usuario_nome}`}
              ultimaAnotacao={`${formatDateBR(item.lastEntryAnotacoes?.data)} - ${item.lastEntryAnotacoes?.usuario_nome}`}
            />
          )
        })}

      </div>
    </div>
  );
}

export default EvolucaoResidente




interface IdosoCardProps {
  item: Data;
  nome: string;
  fotoUrl?: string;
  ultimaMedicao?: string;
  ultimaAnotacao?: string;
}

const IdosoCard: React.FC<IdosoCardProps> = ({
  item,
  nome,
  fotoUrl,
  ultimaMedicao,
  ultimaAnotacao,
}) => {


  const dateAnot = new Date(item.lastEntryAnotacoes?.data as string)
  dateAnot.setHours(dateAnot.getHours() + 3)
  const testDateAnot = dateAnot.getDate() < new Date().getDate() && new Date().getHours() > 10

  const dateSinais = new Date(item.lastEntrySinais?.createdAt as string)
  const timeDifference = new Date().getTime() - dateSinais.getTime();
  const hoursDifference = timeDifference / (1000 * 60 * 60);
  const testDateSinais = hoursDifference > 6

  return (
    <Link href={`/portal/residentes/${item._id}`} className='flex flex-col mb-2 '>
      <div className="flex gap-4 items-center p-1 rounded-lg shadow-sm border hover:shadow-md transition-all bg-cyan-50 hover:bg-cyan-100 border-slate-200 cursor-pointer">

        {/* FOTO */}
        <div className="flex-shrink-0 w-16 h-16 rounded-full overflow-hidden border">
          {fotoUrl ? (
            <img src={fotoUrl} alt={nome} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
              Sem foto
            </div>
          )}
        </div>

        {/* INFO COM SCROLL */}
        <div className="flex-1 min-w-0 overflow-x-auto whitespace-nowrap scrollbar-none pr-2">
          <div className="inline-block">
            <h3 className="text-md font-semibold text-gray-800">{nome}</h3>

            <p className={`text-sm mt-1 flex items-center gap-2 ${testDateSinais ? 'text-red-500' : 'text-gray-500'}`}>
              <FaStethoscope size={20} color='blue' />
              {ultimaMedicao || 'Sem registro'}
            </p>

            <p className={`text-sm mt-1 flex items-center gap-2 ${testDateAnot ? 'text-red-500' : 'text-gray-500'}`}>
              <FaClipboardList size={20} color='green' />
              {ultimaAnotacao || 'Sem anotação'}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};
