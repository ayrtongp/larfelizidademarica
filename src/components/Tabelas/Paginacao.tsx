import React, { useState } from 'react'
import { MdFirstPage, MdLastPage, MdOutlineChevronLeft, MdOutlineChevronRight } from 'react-icons/md'

interface Props {
  skip?: number;
  limit?: number;
  total?: number;
  handlePage: (number: number) => void;
}

const Paginacao = ({ skip = 1, limit = 20, total = 0, handlePage }: Props) => {

  return (
    <div className="bg-teal-800 flex flex-col xs:flex-row items-center justify-between w-full">
      <div className='p-2'>
        <p className='text-white font-bold text-xs' >
          REGISTROS ENCONTRADOS: {total} ( MOSTRANDO {skip * limit - limit + 1} ATÉ {Math.min(skip * limit, total)} )
        </p>
      </div>
      <div className="flex items-center p-2 gap-2">
        <button onClick={() => handlePage(1)} disabled={skip === 1}
          className={`bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline-gray `}>
          <MdFirstPage />
        </button>
        <button onClick={() => handlePage(skip - 1)} disabled={skip === 1}
          className={`bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline-gray `}>
          <MdOutlineChevronLeft />
        </button>
        <button onClick={() => handlePage(skip + 1)} disabled={skip * limit >= total}
          className={`bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline-gray `}>
          <MdOutlineChevronRight />
        </button>
        <button onClick={() => handlePage(Math.ceil(total / limit))} disabled={skip * limit >= total}
          className={`bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline-gray `}>
          <MdLastPage />
        </button>
      </div>
    </div>
  )
}

export default Paginacao
