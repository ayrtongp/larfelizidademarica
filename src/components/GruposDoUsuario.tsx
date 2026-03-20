import React, { useEffect, useState } from 'react'
import Usuario_getAtivos from '@/actions/Usuario_getAtivos';
import NovoGrupoUsuario from './Cadastros/NovoGrupoUsuario';
import Grupos_getAll from '@/actions/Grupos_getAll';

const GruposDoUsuario = () => {
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [listaGrupos, setListaGrupos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [usuarios, grupos] = await Promise.all([
          Usuario_getAtivos(),
          Grupos_getAll(),
        ]);
        setListaUsuarios(usuarios.usuarios);
        setListaGrupos(grupos);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <p className='text-sm text-gray-400 py-6 text-center'>Carregando dados...</p>;
  }

  return <NovoGrupoUsuario grupos={listaGrupos} usuarios={listaUsuarios} />;
};

export default GruposDoUsuario;
