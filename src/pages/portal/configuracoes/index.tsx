import React, { useEffect, useState } from 'react'

import PortalBase from '@/components/Portal/PortalBase'
import PermissionWrapper from '@/components/PermissionWrapper'

import Preferencias from '@/components/Paginas/Configuracoes/Preferencias'
import Senhas from '@/components/Paginas/Configuracoes/Senhas'

import { Usuario_getDadosPerfil } from '@/actions/Usuario'

import { FaLock, FaUser } from 'react-icons/fa'
import { getUserID } from '@/utils/Login'

// ------------------------------------------------------------------------------

const Index = () => {
  const [componentSelected, setComponentSelected] = useState('preferencias')
  const [userInfo, setUserInfo] = useState({});

  const itens = [
    { name: 'Preferências', icon: <FaUser size={20} />, value: 'preferencias' },
    { name: 'Senhas', icon: <FaLock size={20} />, value: 'senhas' },
    // { name: 'Notificações', icon: <FaBell size={20} />, value: 'notificacoes' },
    // { name: 'Verificação', icon: <MdVerified size={20} />, value: 'verificacao' }
  ]

  const userId = getUserID();

  useEffect(() => {
    async function fetchData() {
      const data = await Usuario_getDadosPerfil(userId);
      setUserInfo(data.result);
    };

    fetchData();
  }, [])


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
              {componentSelected === 'preferencias' && <Preferencias userInfo={userInfo} />}
              {componentSelected === 'senhas' && <Senhas />}
              {/* <PerfilFotoUpload /> */}
            </div>
          </div>
        </div>
      </PortalBase>
    </PermissionWrapper>
  )
}

export default Index
