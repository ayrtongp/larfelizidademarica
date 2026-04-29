import ListaUsuarios from '@/components/Admin/ListaUsuarios'
import ListaResidentesAtivos from '@/components/Admin/ListaResidentesAtivos'
import ListaGrupos from '@/components/Admin/ListaGrupos'
import RelZipAnotEnf from '@/components/Admin/RelZipAnotEnf'
import AuditoriaFuncionarios from '@/components/Admin/AuditoriaFuncionarios'
import FormNovoUsuario from '@/components/FormNovoUsuario'
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '@/components/Portal/PortalBase'
import React, { useState } from 'react'
import NovoGrupo from '@/components/Cadastros/NovoGrupo'
import { FaUserPlus, FaUsers, FaFileAlt, FaBed, FaLayerGroup, FaUsersCog, FaHistory } from 'react-icons/fa'

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  color: string
  description: string
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'fun-novoUsuario',      label: 'Novo Usuário',       icon: <FaUserPlus />,   color: 'text-indigo-500', description: 'Cadastrar novo usuário no sistema' },
  { id: 'fun-listaUsuarios',    label: 'Lista de Usuários',  icon: <FaUsers />,      color: 'text-blue-500',   description: 'Ver e gerenciar usuários e grupos' },
  { id: 'fun-criarGrupo',       label: 'Criar Grupo',        icon: <FaLayerGroup />, color: 'text-green-500',  description: 'Cadastrar novo grupo de permissão' },
  { id: 'fun-listaGrupos',      label: 'Grupos e Membros',   icon: <FaLayerGroup />, color: 'text-teal-500',   description: 'Visualizar grupos existentes e seus participantes' },
  { id: 'fun-ResidentesAtivos', label: 'Residentes Ativos',  icon: <FaBed />,        color: 'text-orange-500', description: 'Gerenciar residentes e limites' },
  { id: 'fun-AnotEnfV2',        label: 'Relatório Geral',    icon: <FaFileAlt />,    color: 'text-red-500',    description: 'Gerar relatório de anotações' },
  { id: 'fun-auditoriaFunc',    label: 'Auditoria RH',       icon: <FaHistory />,    color: 'text-slate-500',  description: 'Histórico de alterações em funcionários' },
]

const Index = () => {
  const [funcaoAdmin, setFuncaoAdmin] = useState('')
  const activeItem = MENU_ITEMS.find(m => m.id === funcaoAdmin)
  const efeitoAtivo = 'bg-slate-100 border-l-2 border-purple-500'

  return (
    <PermissionWrapper href='/portal/admin'>
      <PortalBase>
        <div className='col-span-full'>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>

            <div className='col-span-3 sm:col-span-1'>
              <div className='p-3 border shadow-md rounded-md bg-white'>

                <div className='mb-4 px-1'>
                  <p className='text-xs font-semibold text-slate-400 uppercase tracking-widest'>Painel</p>
                  <h2 className='text-lg font-bold text-slate-700 mt-0.5'>Administração</h2>
                </div>

                <div className='grid grid-cols-2 gap-1.5 sm:hidden'>
                  {MENU_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setFuncaoAdmin(item.id)}
                      className={`flex items-center gap-1.5 px-2 py-2 rounded text-left transition-colors text-xs font-medium
                        ${funcaoAdmin === item.id ? 'bg-slate-100 border-l-2 border-purple-500 text-slate-800' : 'text-slate-600 hover:bg-gray-50'}`}
                    >
                      <span className={`${item.color} flex-shrink-0`}>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>

                <ul className='hidden sm:flex flex-col gap-0.5'>
                  {MENU_ITEMS.map((item) => (
                    <li
                      key={item.id}
                      onClick={() => setFuncaoAdmin(item.id)}
                      className={`cursor-pointer flex px-2 py-2.5 flex-row items-center rounded gap-2 transition-colors
                        ${funcaoAdmin === item.id ? efeitoAtivo : 'hover:bg-gray-50'}`}
                    >
                      <span className={`text-sm ${item.color} w-7 flex-shrink-0`}>{item.icon}</span>
                      <div>
                        <p className='text-sm text-slate-700 font-medium leading-tight'>{item.label}</p>
                        <p className='text-xs text-slate-400 leading-tight mt-0.5'>{item.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className='col-span-3 sm:col-span-2 bg-white border shadow-md rounded-md'>

              {!funcaoAdmin ? (
                <div className='flex flex-col items-center justify-center h-full min-h-[300px] text-center px-6 py-12'>
                  <div className='w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-4'>
                    <FaUsersCog size={22} className='text-indigo-400' />
                  </div>
                  <p className='text-base font-semibold text-gray-600'>Selecione uma opção</p>
                  <p className='text-sm text-gray-400 mt-1'>Escolha uma funcionalidade no menu ao lado para começar.</p>
                </div>
              ) : (
                <>
                  <div className='px-5 pt-5 pb-3 border-b'>
                    <div className='flex items-center gap-2'>
                      <span className={`text-base ${activeItem?.color}`}>{activeItem?.icon}</span>
                      <h2 className='text-base font-bold text-slate-700'>{activeItem?.label}</h2>
                    </div>
                    {activeItem?.description && (
                      <p className='text-xs text-gray-400 mt-0.5 ml-6'>{activeItem.description}</p>
                    )}
                  </div>

                  <div className='p-5'>
                    {funcaoAdmin === 'fun-novoUsuario'      && <FormNovoUsuario />}
                    {funcaoAdmin === 'fun-listaUsuarios'    && <ListaUsuarios />}
                    {funcaoAdmin === 'fun-listaGrupos'      && <ListaGrupos />}
                    {funcaoAdmin === 'fun-AnotEnfV2'        && <RelZipAnotEnf />}
                    {funcaoAdmin === 'fun-ResidentesAtivos' && <ListaResidentesAtivos />}
                    {funcaoAdmin === 'fun-criarGrupo'       && <NovoGrupo />}
                    {funcaoAdmin === 'fun-auditoriaFunc'    && <AuditoriaFuncionarios />}
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </PortalBase>
    </PermissionWrapper>
  )
}

export default Index
