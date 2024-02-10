import React from 'react'

interface Props {
  label: string;
  name: string;
  handleButton?: any;
  active?: string;
}

const ButtonM1: React.FC<Props> = ({ label, name, handleButton, active }) => {
  return (
    <button onClick={handleButton} name={name}
      className={`px-4 py-2 rounded-lg shadow-md text-sm
      ${active == name ? `text-white bg-purple-500` : `bg-white hover:text-white hover:bg-purple-500`}
      `}>
      {label}
    </button>
  )
}

export default ButtonM1
