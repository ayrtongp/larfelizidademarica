import React from 'react'
import FormSinaisVitais from '@/components/FormSinaisVitais'
import PortalBase from '@/components/Portal/PortalBase'
import PermissionWrapper from '@/components/PermissionWrapper'
import GridSinaisVitais from '@/components/GridSinaisVitais'

const cadastro_sinaisvitais = () => {
  return (
    <PermissionWrapper href='/portal/sinaisvitais'>
      <PortalBase>
        <h2 className='col-span-12 font-bold my-1 text-2xl mb-4 text-center'>Novo Registro</h2>
        <div className='col-span-12'>
          <FormSinaisVitais />
        </div>
      </PortalBase>
    </PermissionWrapper>
  )
}

export default cadastro_sinaisvitais
