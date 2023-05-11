import React from 'react'
import EditFormSinaisVitais from '@/components/EditFormSinaisVitais'
import BotaoPadrao from '@/components/BotaoPadrao'
import Navportal from '@/components/Navportal'
import PermissionWrapper from '@/components/PermissionWrapper'

const cadastro_sinaisvitais = () => {
  return (
    <PermissionWrapper href='/portal'>
      <div>
        <Navportal />
        <BotaoPadrao href='/portal' text='Voltar ao Portal' />
        <EditFormSinaisVitais />
      </div>
    </PermissionWrapper>
  )
}

export default cadastro_sinaisvitais
