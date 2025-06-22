import React from 'react'

interface Props {
  disabled?: boolean
  label?: string
  onClick: (e: any) => void;
  color?: string
}

const SubmitButtonM2: React.FC<Props> = ({ disabled = false, label = "Salvar", color = 'blue', onClick }) => {
  let bgColor = color

  if (color == 'red') bgColor = 'bg-red-500 hover:bg-red-700'
  else if (color == 'green') bgColor = 'bg-green-500 hover:bg-green-700'
  else if (color == 'purple') bgColor = 'bg-purple-500 hover:bg-purple-700'
  else bgColor = 'bg-blue-500 hover:bg-blue-700'

  return (
    <div className='mx-auto mt-5 text-center'>
      <hr />
      <button disabled={disabled} className={`mt-2 ${bgColor} text-white font-bold py-1 px-2 rounded`} onClick={onClick} >
        {label}
      </button>
    </div>
  )
}

export default SubmitButtonM2
