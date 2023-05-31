import React from 'react'

const RelSinaisVitais = () => {
  return (
    <div className='text-center mt-3'>
      <h2 className='font-bold text-xl'>RELATÓRIO SINAIS VITAIS</h2>
      <div className='mt-4 w-full overflow-x-auto'>
        <table className='text-center text-xs border rounded-md p-2'>
          <thead className='bg-gray-200'>
            <th className='px-2'>Data Registro</th>
            <th className='px-2'>Responsável</th>
            <th className='px-2'>Pressão Arterial</th>
            <th className='px-2'>Freq. Cardíaca</th>
            <th className='px-2'>Freq. Respiratória</th>
            <th className='px-2'>Temperatura</th>
            <th className='px-2'>Saturação</th>
            <th className='px-2'>Glicemia Capilar</th>
            <th className='px-2'>Diurese</th>
            <th className='px-2'>Evacuações</th>
          </thead>
          <tbody>
            <tr>30/05/2023</tr>
          </tbody>
        </table>
      </div>

    </div>
  )
}

export default RelSinaisVitais
