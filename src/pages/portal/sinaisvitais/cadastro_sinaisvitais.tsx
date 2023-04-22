import React from 'react'
import FormSinaisVitais from '@/components/FormSinaisVitais'
import BotaoPadrao from '@/components/BotaoPadrao'

const cadastro_sinaisvitais = () => {
  return (
    <div>
      <BotaoPadrao href='/portal' text='Voltar ao Portal' />
      <FormSinaisVitais />
    </div>
  )
}

export default cadastro_sinaisvitais
