import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import Imagem from '../../public/images/idosos/CarmemIacovino.jpg'
import ModalAlergias from './Residentes/ModalAlergias'
import { FaInfoCircle } from 'react-icons/fa'
import { calcularIdade } from '@/utils/Functions'
import svgMulher from '@/svg/svgMulher'
import svgHomem from '@/svg/svgHomem'
import Link from 'next/link'

const svg = () => {
  return (
    <svg className="w-8 h-8 fill-current text-amber-500" viewBox="0 0 32 32">
      <path d="M21 14.077a.75.75 0 01-.75-.75 1.5 1.5 0 00-1.5-1.5.75.75 0 110-1.5 1.5 1.5 0 001.5-1.5.75.75 0 111.5 0 1.5 1.5 0 001.5 1.5.75.75 0 010 1.5 1.5 1.5 0 00-1.5 1.5.75.75 0 01-.75.75zM14 24.077a1 1 0 01-1-1 4 4 0 00-4-4 1 1 0 110-2 4 4 0 004-4 1 1 0 012 0 4 4 0 004 4 1 1 0 010 2 4 4 0 00-4 4 1 1 0 01-1 1z"></path>
    </svg>
  )
}

const svgPathMessageButton = () => {
  return (
    <path d="M8 0C3.6 0 0 3.1 0 7s3.6 7 8 7h.6l5.4 2v-4.4c1.2-1.2 2-2.8 2-4.6 0-3.9-3.6-7-8-7zm4 10.8v2.3L8.9 12H8c-3.3 0-6-2.2-6-5s2.7-5 6-5 6 2.2 6 5c0 2.2-2 3.8-2 3.8z"></path>
  )
}

const svgPathPencil = () => {
  return (
    <path d="M11.7.3c-.4-.4-1-.4-1.4 0l-10 10c-.2.2-.3.4-.3.7v4c0 .6.4 1 1 1h4c.3 0 .5-.1.7-.3l10-10c.4-.4.4-1 0-1.4l-4-4zM4.6 14H2v-2.6l6-6L10.6 8l-6 6zM12 6.6L9.4 4 11 2.4 13.6 5 12 6.6z"></path>
  )
}

const svgHandWashing = () => {
  return (
    <svg width="24px" height="24px" viewBox="-1.51 0 122.88 122.88">
      <path className="cls-1" d="M60.69.67a6.56,6.56,0,1,1-5.24,7.66A6.56,6.56,0,0,1,60.69.67Zm43,77.68a7.45,7.45,0,0,0-2.94-2.9l1.71-.94a7.28,7.28,0,0,0,2.87-9.86h0a7.14,7.14,0,0,0-3.14-3l1.38-.76A7.28,7.28,0,0,0,106.47,51a7.29,7.29,0,0,0-9.86-2.86L95.2,49a7.26,7.26,0,0,0-10.72-7l-7.23,4a8.31,8.31,0,0,0-3.93-4h0a8.39,8.39,0,0,0-4.93-.73l.79-1.62a8.34,8.34,0,0,0-15-7.3l-.8,1.65a8.43,8.43,0,0,0-3.57-3.34,8.35,8.35,0,0,0-11.14,3.86L21.33,70a15.57,15.57,0,0,0-1.06,1.81h0l-1,2.09-.1-.26c-.7-1.84-1.34-3.72-1.59-4.42-1.63-4.76-4.75-7.12-7.9-7.57a7.94,7.94,0,0,0-4.11.48,8.38,8.38,0,0,0-3.38,2.49c-2.2,2.68-3.08,7-.95,12.17l0,.09h0c2.26,6.64,7.56,26.94,13.38,33.33,7.2,7.9,25.85,15.32,35.88,11.78a23.08,23.08,0,0,0,13.11-11.71l1-2.12q18.1-9.94,36.21-19.93a7.28,7.28,0,0,0,2.86-9.86ZM78,49.22c2.67-1.46,5.37-2.93,8.06-4.42a4,4,0,0,1,3-.33,3.93,3.93,0,0,1,2.37,1.89,4,4,0,0,1,.33,3,3.94,3.94,0,0,1-1.89,2.36l-8.2,4.51c-.27-.16-.53-.32-.82-.46h0A8.3,8.3,0,0,0,76.17,55l1-2A8.4,8.4,0,0,0,78,49.22Zm6.2,9.54,14-7.7a4,4,0,0,1,3-.32,3.9,3.9,0,0,1,2.36,1.89,4,4,0,0,1,.33,3A3.88,3.88,0,0,1,102,58L84.32,67.73l.38-.8a8.25,8.25,0,0,0,.37-6.36,8.37,8.37,0,0,0-.87-1.81ZM81.67,73.17l15.41-8.48a3.94,3.94,0,0,1,3-.33,3.9,3.9,0,0,1,2.37,1.89,4,4,0,0,1-1.56,5.37L80.1,83.06,81.69,86l13.76-7.57a4,4,0,0,1,3-.33A3.88,3.88,0,0,1,100.82,80a4,4,0,0,1,.33,3,3.9,3.9,0,0,1-1.89,2.37L67.16,103,81.67,73.17ZM60.21,108.61a19.27,19.27,0,0,1-11,9.81c-8.55,3-25.72-4.06-31.84-10.77C12.22,102,6.5,80.56,4.83,75.66a1.53,1.53,0,0,0-.08-.26L3,76.13l1.74-.73c-1.55-3.74-1.06-6.68.37-8.4A4.56,4.56,0,0,1,7,65.63a4.15,4.15,0,0,1,2.17-.27c1.87.28,3.77,1.84,4.88,5.06.26.74.93,2.7,1.63,4.54a23.84,23.84,0,0,0,2,4.28,1.85,1.85,0,0,0,.8.74h1.67l3.67-6.52C29.84,60.92,35.94,48.61,42.07,36a4.56,4.56,0,0,1,2.61-2.3,4.47,4.47,0,0,1,3.47.2,4.54,4.54,0,0,1,2.3,2.6,4.47,4.47,0,0,1-.2,3.47L38.36,64.43l3.52,1.72L57.59,33.86a4.53,4.53,0,0,1,8.38.52,4.49,4.49,0,0,1-.21,3.46L50.05,70.13l3.6,1.75L65.58,47.37a4.53,4.53,0,0,1,2.61-2.3,4.55,4.55,0,0,1,5.57,6.28L61.82,75.85l3.41,1.66L73.11,61.3A4.53,4.53,0,0,1,75.72,59a4.47,4.47,0,0,1,3.47.2,4.57,4.57,0,0,1,2.1,6.08Q70.75,86.94,60.21,108.61Zm58.46-60.9a3.71,3.71,0,1,0,.21,5.24,3.69,3.69,0,0,0-.21-5.24ZM115.88,49a1.45,1.45,0,1,1-1.15,1.69A1.45,1.45,0,0,1,115.88,49Zm-3.71-21.53a6.57,6.57,0,1,0,.35,9.28,6.57,6.57,0,0,0-.35-9.28Zm-5.1,1.46a3.42,3.42,0,1,1-2.73,4,3.42,3.42,0,0,1,2.73-4ZM85.29,0C87.47,10,94,14.94,94,19.92s-2.17,10-8.7,10-8.71-5-8.71-10S83.11,10,85.29,0ZM44.9,12.54a3.71,3.71,0,1,1-3,4.33,3.71,3.71,0,0,1,3-4.33Zm.42,2.23a1.44,1.44,0,1,1-1.15,1.68,1.45,1.45,0,0,1,1.15-1.68Zm16-11a3.42,3.42,0,1,1-2.73,4,3.42,3.42,0,0,1,2.73-4Z"></path>
    </svg>
  )
}

interface Residente {
  _id: string;
  nome: string;
  apelido: string;
  data_nascimento: string;
  genero: string;
  informacoes: string;
  foto_base64: string;
}

const ResidenteCard = ({ residenteData }: any) => {
  const [dadosResidente, setDadosResidente] = useState<Residente>();

  const idadeAnos = calcularIdade(dadosResidente?.data_nascimento)

  const vars = {
    id: dadosResidente?._id,
    nomeIdoso: dadosResidente?.nome,
    foto_base64: dadosResidente?.foto_base64,
    descricaoIdoso: dadosResidente?.informacoes,
    idade: "(" + idadeAnos + " anos)",
    apelido: dadosResidente?.apelido,
    icone: dadosResidente?.genero == "feminino" ? svgMulher() : svgHomem(),
    svgPathFooterButtonLeft: <FaInfoCircle />,
    svgPathFooterButtonRight: svgPathPencil(),
    textFooterButtonLeft: "Ver mais...",
    textFooterButtonRight: "",
  }

  useEffect(() => {
    setDadosResidente(residenteData)
  }, [residenteData])

  return (
    <div className='col-span-12 sm:col-span-6 lg:col-span-4 bg-white border border-slate-200 rounded-sm shadow-lg'>
      <h1 className='hidden'>{vars.id}</h1>
      <div className='flex flex-col h-full'>
        {/* CARD HEADER */}
        <div className='p-6 grow'>
          {/* CONTENT */}
          <div className='flex justify-between items-start'>
            {/* IMAGEM E NOME */}
            <header>
              <div className="flex mb-2">
                <div className="relative inline-flex items-start mr-5 h-20 w-20" >
                  <div className="absolute top-0 right-0 -mr-2 bg-white rounded-full shadow" aria-hidden="true">
                    {vars.icone}
                  </div>
                  {vars.foto_base64 && (
                    <Image src={vars.foto_base64} width={24} height={24} alt='Foto do Residente' className='block w-full h-full object-cover rounded-full' />
                  )}
                </div>
                <div className="mt-1 pr-1">
                  <div className="inline-flex text-slate-600 hover:text-slate-900" >
                    <h2 className="text-base leading-snug justify-center font-bold">{vars.nomeIdoso}</h2>
                  </div>
                  <div className="flex mt-1 flex-row justify-between text-base items-center gap-1 text-gray-400">
                    <span>{vars.idade}</span>
                    <span>{vars.apelido}</span>
                  </div>
                </div>
              </div>
            </header>
            {/* MENU BUTTON */}
            {/* FAZER DEPOIS */}
          </div>
          {/* BIO */}
          <div className='mt-2'>
            <div className='text-sm'>
              {vars.descricaoIdoso}
            </div>
          </div>
        </div>
        {/* CARD FOOTER */}
        <div className='border-t border-slate-200'>
          <div className="flex divide-x divide-slate-200">
            <Link href={`/portal/residentes/${vars.id}`} className="block flex-1 text-center text-sm text-indigo-500 hover:text-indigo-600 font-bold px-3 py-4">
              <div className="flex items-center justify-center">
                <svg className="w-4 h-4 fill-current shrink-0 mr-2" viewBox="0 0 16 16">{vars.svgPathFooterButtonLeft}</svg>
                <span>{vars.textFooterButtonLeft}</span>
              </div>
            </Link>
            <div className="block flex-1 text-center text-sm text-slate-600 hover:text-slate-800 font-bold px-3 py-4 hover:fill-[#475569]">
              <div className="flex items-center justify-center hover:fill-yellow-500">
                <ModalAlergias>
                  {svgHandWashing()}
                </ModalAlergias>
                <span>{vars.textFooterButtonRight}</span>
              </div>
            </div>
          </div>
        </div>
      </div >
    </div >
  )
}

export default ResidenteCard
