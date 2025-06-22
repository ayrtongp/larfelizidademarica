import List_M1 from '@/components/Diversos/List_M1';
import { formatDateBRHora } from '@/utils/Functions'
import React, { useEffect, useState } from 'react'

interface Props {
  listaHistorico: object[];
  countHistorico: number;
  clicked: () => void;
}

const HistoricoSuprimentos = ({ listaHistorico, countHistorico, clicked }: Props) => {

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex justify-between px-3 items-center'>
        <button onClick={clicked} className='border shadow-md rounded-2xl border-blue-950 bg-blue-400 hover:bg-blue-600 cursor-pointer px-1 py-2'>Carregar mais 10</button>
        <span className='font-bold'>Mostrando {listaHistorico.length} de {countHistorico} registros.</span>
      </div>
      <div className='text-left px-3'>
        <p className='text-xl font-bold my-3 text-center'>Lista de Entradas/Saídas</p>
        <ul className='flex flex-col gap-2'>
          {listaHistorico.length > 0 && listaHistorico.map((historico: any, index: number) => (
            <li key={index} className={`border-b flex flex-col gap-1 ${historico.quantidade > 0 ? 'text-green-600' : 'text-red-500'}`}>
              <div>
                {formatDateBRHora(historico.createdAt)} - {historico.nomeUsuario}  {historico.quantidade > 0 ? 'adicionou' : 'removeu'} ({historico.quantidade}) {historico.nome_insumo}
              </div>
              <div>
                Obs: {historico.observacoes}
              </div>
            </li>
          ))}
          {listaHistorico.length <= 0 && (
            <li>Nenhum Histórico Encontrado!</li>
          )}
        </ul>
      </div>
    </div>
  )
}

export default HistoricoSuprimentos
