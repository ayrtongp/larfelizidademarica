import ListaUsuarios from '@/components/Admin/ListaUsuarios'
import ListaResidentesAtivos from '@/components/Admin/ListaResidentesAtivos'
import RelZipAnotEnf from '@/components/Admin/RelZipAnotEnf'
import FormNovoUsuario from '@/components/FormNovoUsuario'
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '@/components/Portal/PortalBase'
import React, { useState } from 'react'
import NovoGrupo from '@/components/Cadastros/NovoGrupo'
import GruposDoUsuario from '@/components/GruposDoUsuario'

const Index = () => {
  const [funcaoAdmin, setFuncaoAdmin] = useState('');

  const handleChangeFuncao = (event: any) => {
    setFuncaoAdmin(event.currentTarget.id)
  }

  const botoes = [
    { id: 'fun-novoUsuario', label: 'Novo Usuário', onClick: handleChangeFuncao },
    { id: 'fun-listaUsuarios', label: 'Lista Usuários', onClick: handleChangeFuncao },
    { id: 'fun-AnotEnfV2', label: 'Relatório Geral', onClick: handleChangeFuncao },
    { id: 'fun-ResidentesAtivos', label: 'Residentes Ativos', onClick: handleChangeFuncao },
    { id: 'fun-criarGrupo', label: 'Criar Grupo', onClick: handleChangeFuncao },
    { id: 'fun-usuarioGrupos', label: 'Grupos do Usuário', onClick: handleChangeFuncao },
  ]

  return (
    <PermissionWrapper href='/portal/admin'>
      <PortalBase>



        {/* LISTA DE BOTÕES COM FUNÇÕES */}
        <div className='col-span-12'>
          <ul className='flex flex-row flex-wrap gap-2'>
            {botoes.map((botao: any, index: number) => {
              return (
                <li key={index} id={botao.id} onClick={botao.onClick} >
                  <button className='text-white bg-indigo-500 px-3 py-2 text-xs rounded-md shadow-md'>
                    {botao.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* DISPLAY DA FUNÇÃO ATIVA */}
        <div className='col-span-12'>

          {/* FORMULÁRIO PARA CRIAR NOVO USUÁRIO */}
          {funcaoAdmin == "fun-novoUsuario" && (<div className='p-3'><FormNovoUsuario /></div>)}

          {/* LISTAR TODOS OS USUARIOS */}
          {funcaoAdmin == "fun-listaUsuarios" && (<div className='p-3'><ListaUsuarios /></div>)}

          {/* Baixar ZIP do relatório */}
          {funcaoAdmin == "fun-AnotEnfV2" && (<div className='p-3'><RelZipAnotEnf /></div>)}

          {/* Baixar ZIP do relatório */}
          {funcaoAdmin == "fun-ResidentesAtivos" && (<div className='p-3'><ListaResidentesAtivos /></div>)}

          {/* Criar Novo Grupo */}
          {funcaoAdmin == "fun-criarGrupo" && (<div className='p-3'><NovoGrupo /></div>)}

          {/* Criar Novo Grupo */}
          {funcaoAdmin == "fun-usuarioGrupos" && (<div className='p-3'><GruposDoUsuario /></div>)}

        </div>

      </PortalBase>
    </PermissionWrapper >
  )
}

export default Index
