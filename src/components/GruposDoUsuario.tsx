import React, { useEffect, useState } from 'react'
import T_Padrao from './Tabelas/T_Padrao'
import Usuario_getAtivos from '@/actions/Usuario_getAtivos';
import { useSearchParams } from 'next/navigation';
import NovoGrupoUsuario from './Cadastros/NovoGrupoUsuario';
import Grupos_getAll from '@/actions/Grupos_getAll';
import GruposUsuario_getGruposUsuario from '@/actions/GruposUsuario_getGruposUsuario';

const GruposDoUsuario = () => {

  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [listaGrupos, setListaGrupos] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const usuarios = await Usuario_getAtivos();
      const grupos = await Grupos_getAll();
      setListaUsuarios(usuarios.usuarios);
      setListaGrupos(grupos);
    }

    fetchData();
  }, []);

  return (
    <div>
      <h1 className='font-bold text-xl mx-auto'>Grupos do Usuário</h1>
      <NovoGrupoUsuario grupos={listaGrupos} usuarios={listaUsuarios} />
    </div>
  )
}

export default GruposDoUsuario
