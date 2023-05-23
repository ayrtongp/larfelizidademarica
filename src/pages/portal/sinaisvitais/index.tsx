import React from 'react'
import TabelaSinaisVitais from '@/components/TabelaSinaisVitais'
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '../../../components/Portal/PortalBase'


const Index = () => {
  return (
    <PermissionWrapper href='/portal/sinaisvitais'>
      <PortalBase>
        <div className='col-span-12'>
          <div className="flex justify-center items-center w-max mx-auto flex-col">
            <h2 className='font-bold my-1 text-2xl mb-4'>Lista de Sinais</h2>
            <TabelaSinaisVitais />
          </div>
          <div className='container flex justify-center items-center text-center m-4 mx-auto'>
          </div>
        </div >
      </PortalBase>
    </PermissionWrapper>
  )
}

export default Index
