import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import BotaoPadrao from '@/components/BotaoPadrao'
import TabelaSinaisVitais from '@/components/TabelaSinaisVitais'


const index = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const response = await fetch('/api/SinaisVitaisController');
      const json = await response.json();
      setData(json);
    }
    fetchData();
  }, []);

  return (
    <div>
      <Link href='/portal'>
        <h1 className="text-3xl text-black py-2 font-bold text-center">Portal do Lar Felizidade Maricá</h1>
      </Link>
      <div className='flex justify-center items-center flex-wrap'>
        <BotaoPadrao href='/portal' text='Voltar ao Portal' />
        <BotaoPadrao href='/portal/sinaisvitais/cadastro_sinaisvitais' text='+ Novo' />
      </div>
      <div className="flex justify-center items-center w-max mx-auto flex-col">
        <h2 className='font-bold my-1'>Lista de Sinais</h2>
        <TabelaSinaisVitais SinaisVitais={ data } />
      </div>
    </div >
  )
}

export default index
