import React, { useEffect, useState } from 'react'
import PortalBase from '@/components/Portal/PortalBase'
import PermissionWrapper from '@/components/PermissionWrapper'
import Preferencias from '@/components/Paginas/Configuracoes/Preferencias'
import Senhas from '@/components/Paginas/Configuracoes/Senhas'
import Biometria from '@/components/Paginas/Configuracoes/Biometria'
import { Usuario_getDadosPerfil } from '@/actions/Usuario'
import { getUserID } from '@/utils/Login'

type Tab = 'preferencias' | 'senhas' | 'biometria'

const TABS: { value: Tab; label: string; icon: string }[] = [
  { value: 'preferencias', label: 'Perfil', icon: '👤' },
  { value: 'senhas', label: 'Senha', icon: '🔑' },
  { value: 'biometria', label: 'Biometria', icon: '🔐' },
]

const Index = () => {
  const [tab, setTab] = useState<Tab>('preferencias')
  const [userInfo, setUserInfo] = useState<any>(null)
  const userId = getUserID()

  useEffect(() => {
    if (!userId) return
    Usuario_getDadosPerfil(userId).then((data) => setUserInfo(data.result))
  }, [userId])

  const displayName = userInfo
    ? `${userInfo.nome ?? ''} ${userInfo.sobrenome ?? ''}`.trim()
    : '...'

  const initials = userInfo
    ? `${(userInfo.nome ?? '')[0] ?? ''}${(userInfo.sobrenome ?? '')[0] ?? ''}`.toUpperCase()
    : ''

  return (
    <PermissionWrapper href='/portal'>
      <PortalBase>
        <div className='col-span-full p-4 space-y-5 max-w-3xl mx-auto w-full'>

          {/* Identity card */}
          <div className='bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center gap-5'>
            {userInfo?.foto_base64 ? (
              <img
                src={userInfo.foto_base64}
                alt={displayName}
                className='w-16 h-16 rounded-full object-cover ring-2 ring-gray-100 shrink-0'
              />
            ) : (
              <div className='w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold shrink-0'>
                {initials || '?'}
              </div>
            )}
            <div className='min-w-0'>
              <h1 className='text-lg font-bold text-gray-800 truncate'>{displayName}</h1>
              <p className='text-sm text-gray-500 truncate'>{userInfo?.funcao ?? ''}</p>
              {userInfo?.email && (
                <p className='text-xs text-gray-400 truncate'>{userInfo.email}</p>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className='bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden'>

            {/* Tab nav */}
            <div className='flex border-b border-gray-100'>
              {TABS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors
                    ${tab === t.value
                      ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className='p-6'>
              {tab === 'preferencias' && userInfo && <Preferencias userInfo={userInfo} />}
              {tab === 'senhas' && <Senhas />}
              {tab === 'biometria' && <Biometria />}
            </div>

          </div>

        </div>
      </PortalBase>
    </PermissionWrapper>
  )
}

export default Index
