import FormNovoUsuario from '@/components/FormNovoUsuario'
import Navportal from '@/components/Navportal'
import Preferencias from '@/components/Paginas/Configuracoes/Preferencias'
import PerfilFotoUpload from '@/components/PerfilFotoUpload'
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '@/components/Portal/PortalBase'
import React, { useState } from 'react'
import { FaBell, FaLock, FaUser } from 'react-icons/fa'
import { MdVerified } from 'react-icons/md'

const index = () => {
  const [componentSelected, setComponentSelected] = useState('preferencias')

  const itens = [
    { name: 'Preferências', icon: <FaUser size={20} />, value: 'preferencias' },
    { name: 'Senhas', icon: <FaLock size={20} />, value: 'senhas' },
    { name: 'Notificações', icon: <FaBell size={20} />, value: 'notificacoes' },
    { name: 'Verificação', icon: <MdVerified size={20} />, value: 'verificacao' }
  ]

  return (
    <PermissionWrapper href='/portal'>
      <PortalBase>
        <div className='col-span-12 grid grid-cols-12 gap-4 bg-gray-100 min-h-screen p-3'>
          <div className='col-span-full md:col-span-2'>
            <div className='bg-white rounded-lg shadow-md py-4'>
              <ul className='text-lg'>
                {itens.map((item) => (
                  <li
                    key={item.value}
                    className={`flex items-center gap-2 p-4 cursor-pointer hover:bg-blue-200 ${componentSelected === item.value ? 'bg-blue-300 font-bold border-r-[6px] border-blue-500' : ''}`}
                    onClick={() => setComponentSelected(item.value)}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className='col-span-full md:col-span-10'>
            <div className='bg-white rounded-lg shadow-md py-4'>
              {componentSelected === 'preferencias' && <Preferencias />}
              {/* <PerfilFotoUpload /> */}
            </div>
          </div>
        </div>
      </PortalBase>
    </PermissionWrapper>
  )
}

export default index
