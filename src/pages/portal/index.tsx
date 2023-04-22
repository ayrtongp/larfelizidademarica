import CategoryMenu from '@/components/CategoryMenu'
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
    <div className='flex flex-col justify-center items-center h-screen w-max mx-auto'>
      <h1 className='mb-20 text-4xl font-bold'>Portal do Lar Felizidade Maricá</h1>
      <CategoryMenu categories={categories} />
    </div>
  )
}

export default index
