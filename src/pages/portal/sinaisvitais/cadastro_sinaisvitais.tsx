import React from 'react'
import FormSinaisVitais from '@/components/FormSinaisVitais'
import BotaoPadrao from '@/components/BotaoPadrao'
import Navportal from '@/components/Navportal'
import PermissionWrapper from '@/components/PermissionWrapper'

const cadastro_sinaisvitais = () => {
  return (
    <PermissionWrapper href='/portal'>
      <div>
        <Navportal />
        <BotaoPadrao href='/portal' text='Voltar ao Portal' />
        <FormSinaisVitais />
      </div>
    </PermissionWrapper>
  )
}

export default cadastro_sinaisvitais
