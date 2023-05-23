import React from 'react'
import EditFormSinaisVitais from '@/components/EditFormSinaisVitais'
import BotaoPadrao from '@/components/BotaoPadrao'
import Navportal from '@/components/Navportal'
import PortalBase from '@/components/Portal/PortalBase'
import PermissionWrapper from '@/components/PermissionWrapper'

const cadastro_sinaisvitais = () => {
  return (
    <PermissionWrapper href='/portal/sinaisvitais'>
      <PortalBase>
        <div className='col-span-12'>
          <EditFormSinaisVitais />
        </div>
      </PortalBase>
    </PermissionWrapper>
  )
}

export default cadastro_sinaisvitais
