import React from 'react'
import TabelaSinaisVitais from '@/components/TabelaSinaisVitais'
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '../../../components/Portal/PortalBase'
import { FaPlusCircle } from 'react-icons/fa'
import Link from 'next/link'


const Index = () => {
  return (
    <PermissionWrapper href='/portal/sinaisvitais'>
      <PortalBase>
        <div className='col-span-12'>
          <div className="flex justify-center items-center w-max mx-auto flex-col">
            <h2 className='font-bold my-1 text-2xl mb-4'>Lista de Sinais</h2>
            <TabelaSinaisVitais />
          </div>
          <div className='fixed bottom-0 right-0 m-3'>
            <Link href={'/portal/sinaisvitais/cadastro_sinaisvitais'}>
              <button className='gap-2 bg-indigo-600 rounded-md hover:bg-indigo-800 font-bold text-sm border shadow-md text-white px-3 py-2 flex flex-row items-center '>
                <FaPlusCircle size={30} /> Novo
              </button>
            </Link>
          </div>
        </div >
      </PortalBase>
    </PermissionWrapper>
  )
}

export default Index
