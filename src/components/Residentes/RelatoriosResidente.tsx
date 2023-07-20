import React, { useState } from 'react'
import RelSinaisVitais from './RelSinaisVitais';
import RelAnotacoes from './RelAnotacoes';
import RelEvolucoes from './RelEvolucoes';

const RelatoriosResidente = ({residenteData}: any) => {
  const [relatorio, setRelatorio] = useState('');

  const handleChangeRelatorio = (event: any) => {
    setRelatorio(event.currentTarget.id)
  }

  return (
    <div>
      {/* RELATÓRIOS DISPONÍVEIS */}
      <ul className='flex flex-row flex-wrap gap-2'>

        {/* ITEM */}
        <li id='rel-sinais' onClick={handleChangeRelatorio}>
          <button className='text-white bg-indigo-500 px-3 py-2 text-xs rounded-md shadow-md'>
            Sinais Vitais
          </button>
        </li>

        {/* ITEM */}
        <li id='rel-anotacoes' onClick={handleChangeRelatorio}>
          <button className='text-white bg-indigo-500 px-3 py-2 text-xs rounded-md shadow-md'>
            Anotações Enf.
          </button>
        </li>

        {/* ITEM */}
        <li id='rel-evolucoes' onClick={handleChangeRelatorio}>
          <button className='text-white bg-indigo-500 px-3 py-2 text-xs rounded-md shadow-md'>
            Evolução
          </button>
        </li>
      </ul>

      {/* DADOS RELATÓRIO */}
      <div>

        {/* CONTEÚDO RELATÓRIO SINAIS VITAIS */}
        {relatorio == "rel-sinais" && (
          <div className='p-3'>
            <RelSinaisVitais residenteData={residenteData} />
          </div>
        )}

        {/* CONTEÚDO RELATÓRIO ANOTAÇÕES ENFERMAGEM */}
        {relatorio == "rel-anotacoes" && (
          <div className='p-3'>
            <RelAnotacoes residenteData={residenteData} />
          </div>
        )}

        {/* CONTEÚDO RELATÓRIO EVOLUÇÃO */}
        {relatorio == "rel-evolucoes" && (
          <div className='p-3'>
            <RelEvolucoes residenteData={residenteData} />
          </div>
        )}

      </div>
    </div>
  )
}

export default RelatoriosResidente
