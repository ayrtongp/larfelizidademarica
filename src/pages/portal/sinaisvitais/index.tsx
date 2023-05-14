import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import BotaoPadrao from '@/components/BotaoPadrao'
import TabelaSinaisVitais from '@/components/TabelaSinaisVitais'
import Navportal from '@/components/Navportal'
import PermissionWrapper from '@/components/PermissionWrapper'
import Calendario from '@/components/Calendario'


const Index = () => {


  useEffect(() => {
  }, []);



  return (
    <PermissionWrapper href='/portal'>
      <div className=''>
        <Navportal />
        <Link href='/portal'>
          <h1 className="text-3xl text-black p-4 font-bold text-center">Portal do Lar Felizidade Maricá</h1>
        </Link>
        <div className='flex justify-center items-center flex-wrap'>
          <BotaoPadrao href='/portal' text='Voltar ao Portal' />
          <BotaoPadrao href='/portal/sinaisvitais/cadastro_sinaisvitais' text='+ Novo' />
        </div>
        
        <div className="flex justify-center items-center w-max mx-auto flex-col">
          <h2 className='font-bold my-1'>Lista de Sinais</h2>
          <TabelaSinaisVitais />
        </div>
        <div className='container flex justify-center items-center text-center m-4 mx-auto'>
        </div>
      </div >
    </PermissionWrapper>
  )
}

export default Index
