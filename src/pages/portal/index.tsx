import CategoryMenu from '@/components/CategoryMenu'
import CheckToken from '@/components/CheckToken';
import Navportal from '@/components/Navportal';
import PermissionWrapper from '@/components/PermissionWrapper';
import React from 'react'

const categories = [
  {
    name: 'Idosos',
    href: '/portal/idosos',
  },
  {
    name: 'Sinais Vitais',
    href: '/portal/sinaisvitais',
  },
  {
    name: 'Livro de Ocorrências',
    href: '/portal/livrodeocorrencias',
  },
];

const index = () => {
  return (
    <div>
      <PermissionWrapper href='/portal'>
        <Navportal />
        <div className='flex flex-col justify-center items-center h-screen w-max mx-auto'>
          <h1 className='mb-20 text-4xl font-bold'>Portal do Lar Felizidade Maricá</h1>
          <CategoryMenu />
        </div>
      </PermissionWrapper>
    </div>
  )
}

export default index
