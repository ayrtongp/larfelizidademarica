import React from 'react'
import FormCadastroIdoso from '@/components/FormCadastroIdoso'
import BotaoPadrao from '@/components/BotaoPadrao'

const cadastro_idoso = () => {
  return (
    <div>
      <BotaoPadrao href='/portal' text='Voltar ao Portal' />
      <FormCadastroIdoso />
    </div>
  )
}

export default cadastro_idoso
