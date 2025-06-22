import Link from 'next/link'
import React from 'react'

const BotaoPadrao = ({href, text}: any) => {
  return (
    <div className="flex justify-center m-2">
      <Link href={href}>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          {text}
        </button>
      </Link>
    </div>

  )
}

export default BotaoPadrao
