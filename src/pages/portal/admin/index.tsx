import ListaUsuarios from '@/components/Admin/ListaUsuarios'
import ListaResidentesAtivos from '@/components/Admin/ListaResidentesAtivos'
import RelZipAnotEnf from '@/components/Admin/RelZipAnotEnf'
import FormNovoUsuario from '@/components/FormNovoUsuario'
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '@/components/Portal/PortalBase'
import React, { useState } from 'react'

const Index = () => {
  const [funcaoAdmin, setFuncaoAdmin] = useState('');

  const handleChangeFuncao = (event: any) => {
    setFuncaoAdmin(event.currentTarget.id)
  }

  return (
    <PermissionWrapper href='/portal/admin'>
      <PortalBase>

        {/* LISTA DE BOTÕES COM FUNÇÕES */}
        <div className='col-span-12'>
          <ul className='flex flex-row flex-wrap gap-2'>
            {/* ITEM */}
            <li id='fun-novoUsuario' onClick={handleChangeFuncao}>
              <button className='text-white bg-indigo-500 px-3 py-2 text-xs rounded-md shadow-md'>
                Novo Usuário
              </button>
            </li>

            {/* ITEM */}
            <li id='fun-listaUsuarios' onClick={handleChangeFuncao}>
              <button className='text-white bg-indigo-500 px-3 py-2 text-xs rounded-md shadow-md'>
                Lista Usuários
              </button>
            </li>

            {/* ITEM */}
            <li id='fun-AnotEnfV2' onClick={handleChangeFuncao}>
              <button className='text-white bg-indigo-500 px-3 py-2 text-xs rounded-md shadow-md'>
                Relatório de Anotações Enfermagem
              </button>
            </li>

            {/* ITEM */}
            <li id='fun-ResidentesAtivos' onClick={handleChangeFuncao}>
              <button className='text-white bg-indigo-500 px-3 py-2 text-xs rounded-md shadow-md'>
                Residentes Ativos
              </button>
            </li>


          </ul>
        </div>

        {/* DISPLAY DA FUNÇÃO ATIVA */}
        <div className='col-span-12'>

          {/* FORMULÁRIO PARA CRIAR NOVO USUÁRIO */}
          {funcaoAdmin == "fun-novoUsuario" && (
            <div className='p-3'>
              <FormNovoUsuario />
            </div>
          )}

          {/* LISTAR TODOS OS USUARIOS */}
          {funcaoAdmin == "fun-listaUsuarios" && (
            <div className='p-3'>
              <ListaUsuarios />
            </div>
          )}

          {/* Baixar ZIP do relatório */}
          {funcaoAdmin == "fun-AnotEnfV2" && (
            <div className='p-3'>
              <RelZipAnotEnf />
            </div>
          )}

          {/* Baixar ZIP do relatório */}
          {funcaoAdmin == "fun-ResidentesAtivos" && (
            <div className='p-3'>
              <ListaResidentesAtivos />
            </div>
          )}

        </div>

      </PortalBase>
    </PermissionWrapper>
  )
}

export default Index
