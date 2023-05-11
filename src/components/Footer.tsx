import React from 'react'
import LogoLar from '../../public/images/lar felizidade logo transparente.png'
import Image from 'next/image'
import { FaWhatsapp, FaPhone, FaMailBulk} from 'react-icons/fa'
import { MdLocationOn } from 'react-icons/md'

const Footer = () => {
  return (
    <footer className='bg-purple-200 pt-3'>
      <div className='hidden border-b-[1px] border-purple-600 w-5/6 mx-auto my-6' ></div>
      <div className='text-center grid grid-cols-1 md:grid-cols-3 py-5'>
        <div className='flex items-center justify-center'>
          <div className='max-w-[200px] mb-2'>
            <Image className='w-full h-full' alt='logo lar' src={LogoLar} />
          </div>
        </div>
        <div className='flex flex-col items-center justify-center mb-2'>
          <h2 className='font-bold text-xl'>Conheça:</h2>
          <p>Home</p>
          <p>Galeria</p>
          <p>Sobre Nós</p>
          <p>Contato</p>
          <p></p>
        </div>
        <div className=' mb-2'>
          <h2 className='font-bold text-xl'>Entre em Contato:</h2>
          <div className='text-center md:text-left'>
            <p className='flex items-center m-1 justify-center md:justify-normal'>
              <span className='mx-1 text-gray-400'><FaPhone /></span>
              Telefone: (21) 99926-9047
              <span className='mx-1 text-green-700'><FaWhatsapp /></span>
            </p>
            <p className='flex items-center m-1 justify-center md:justify-normal'>
              <span className='mx-1 text-gray-400'><MdLocationOn /></span>
              Rua das Acácias, Quadra C, Lote 11. Centro de Maricá
            </p>
            <p className='flex items-center m-1 justify-center md:justify-normal'>
              <span className='mx-1 text-gray-400'><FaMailBulk /></span>
              Email: larfelicidademarica@yahoo.com.br
            </p>
          </div>
        </div>
      </div>
      <div className='flex justify-center items-center w-full bg-purple-800 h-10 text-white text-center text-sm'>
        <span className='border-r-2 border-gray-400 mx-2 px-2'>Lar Felizidade - O lugar para o idoso chamar de seu.</span>
        <span className=''>© Todos os direitos reservados. 2013 - {(new Date()).getFullYear()}</span>
      </div>
    </footer>
  )
}

export default Footer
