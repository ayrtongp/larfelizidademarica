// import TabelaIdosos from '@/components/TabelaIdosos'
// import Link from 'next/link'
import React from 'react'
// import { listaIdosos } from '../../../utils/Listas'
import BotaoPadrao from '@/components/BotaoPadrao'
// import PermissionWrapper from '@/components/PermissionWrapper'

const index = () => {
  return (
    // <PermissionWrapper href='/portal'>
      <div>
        {/* <Link href='/portal'>
          <h1 className="text-3xl text-black py-2 font-bold text-center">Portal do Lar Felizidade Maricá</h1>
        </Link>
        <div className='flex justify-center items-center flex-wrap'> */}
          <BotaoPadrao href='/portal' text='Voltar ao Portal' />
          {/* <BotaoPadrao href='/portal/idosos/cadastro_idoso' text='+ Novo Idoso' />
        </div>
        <div className="flex justify-center items-center w-max mx-auto flex-col">
          <h2 className='font-bold my-1'>Lista de Idosos</h2>
          <TabelaIdosos idosos={listaIdosos} />
        </div> */}
      </div >
    // </PermissionWrapper>
  )
}

export default index
