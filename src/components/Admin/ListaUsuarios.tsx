import axios from 'axios';
import Image from 'next/image';
import React, { useEffect, useState } from 'react'
import ImagemPadrao from '../../../public/images/lar felizidade logo transparente.png'

type ListaData = {
  _id: string;
  admin: string;
  ativo: string;
  email: string;
  foto_base64: string;
  funcao: string;
  nome: string;
  registro: string;
  sobrenome: string;
  usuario: string;
}

const ListaUsuarios = () => {
  const [listaUsuarios, setListaUsuarios] = useState<ListaData[]>([]);

  async function getListaUsuarios() {
    if (listaUsuarios.length < 1) {
      const result = await axios.get('/api/Controller/UsuarioController')

      if (result.status >= 200 && result.status < 300) {
        setListaUsuarios(result.data.usuarios)
      }
    }
  }

  useEffect(() => { getListaUsuarios() }, [])

  return (
    <div className='relative overflow-x-auto shadow-md sm:rounded-lg'>
      <table className='table-auto w-full text-xs bg-white'>
        <thead className='uppercase'>
          <tr className='bg-black text-white font-bold'>
            <th className='px-2 py-1'>Usuário</th>
            <th className='px-2 py-1'>Nome</th>
            <th className='px-2 py-1'>Sobrenome</th>
            <th className='px-2 py-1'>Email</th>
            <th className='px-2 py-1'>Ativo</th>
            <th className='px-2 py-1'>Admin</th>
            <th className='px-2 py-1'>Função</th>
            <th className='px-2 py-1'>Registro</th>
            <th className='px-2 py-1'>ID</th>
          </tr>
        </thead>
        <tbody >
          {listaUsuarios.map((linha, index) => {
            const imagemUsuario = linha.foto_base64
            return (
              <tr key={index} className={`border-b ${index % 2 == 0 ? 'bg-gray-50' : 'bg-white'}`}>
                <td className='px-2 py-1 whitespace-nowrap min-w-[160px]'>
                  <div className='flex flex-row items-center gap-1 justify-start'>
                    <Image className='rounded-full w-10 h-10' width={30} height={30} src={imagemUsuario ? imagemUsuario : ImagemPadrao} alt={linha?.nome} />
                    {linha?.usuario}
                  </div>
                </td>
                <td className='text-center px-2 py-1 whitespace-nowrap'>{linha?.nome}</td>
                <td className='text-center px-2 py-1 whitespace-nowrap'>{linha?.sobrenome}</td>
                <td className='text-center px-2 py-1 whitespace-nowrap'>{linha?.email}</td>
                <td className='text-center px-2 py-1 whitespace-nowrap'>{linha?.ativo}</td>
                <td className='text-center px-2 py-1 whitespace-nowrap'>{linha?.admin}</td>
                <td className='text-center px-2 py-1 whitespace-nowrap'>{linha?.funcao}</td>
                <td className='text-center px-2 py-1 whitespace-nowrap'>{linha?.registro}</td>
                <td className='text-center px-2 py-1 whitespace-nowrap'>{linha?._id}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default ListaUsuarios
