import axios from 'axios';
import Image from 'next/image';
import React, { useEffect, useMemo, useState } from 'react'
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
  const [busca, setBusca] = useState('');

  async function getListaUsuarios() {
    if (listaUsuarios.length < 1) {
      const result = await axios.get('/api/Controller/Usuario')
      if (result.status >= 200 && result.status < 300) {
        setListaUsuarios(result.data.usuarios)
      }
    }
  }

  useEffect(() => { getListaUsuarios() }, [])

  const filtrados = useMemo(() => {
    if (!busca.trim()) return listaUsuarios;
    const q = busca.toLowerCase();
    return listaUsuarios.filter(u =>
      `${u.nome} ${u.sobrenome}`.toLowerCase().includes(q) ||
      u.usuario?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.funcao?.toLowerCase().includes(q)
    );
  }, [listaUsuarios, busca]);

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between gap-3 flex-wrap'>
        <p className='text-sm text-gray-500'>{filtrados.length} usuário(s)</p>
        <input
          type='text'
          placeholder='Buscar por nome, usuário, função...'
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className='border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 w-full sm:w-64'
        />
      </div>

      <div className='overflow-x-auto rounded-lg border border-gray-200'>
        <table className='w-full text-sm text-left'>
          <thead className='bg-gray-50 text-gray-500 text-xs uppercase'>
            <tr>
              <th className='px-3 py-3'>Usuário</th>
              <th className='px-3 py-3'>Nome</th>
              <th className='px-3 py-3'>E-mail</th>
              <th className='px-3 py-3'>Função</th>
              <th className='px-3 py-3'>Registro</th>
              <th className='px-3 py-3'>Admin</th>
              <th className='px-3 py-3'>Ativo</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-100'>
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={7} className='text-center py-10 text-gray-400 text-sm'>Nenhum usuário encontrado.</td>
              </tr>
            )}
            {filtrados.map((linha, index) => (
              <tr key={index} className='hover:bg-gray-50 transition-colors'>
                <td className='px-3 py-2.5 whitespace-nowrap'>
                  <div className='flex items-center gap-2'>
                    <Image
                      className='rounded-full object-cover w-8 h-8 flex-shrink-0'
                      width={32} height={32}
                      src={linha.foto_base64 || ImagemPadrao}
                      alt={linha.nome}
                    />
                    <span className='font-medium text-gray-800'>{linha.usuario}</span>
                  </div>
                </td>
                <td className='px-3 py-2.5 whitespace-nowrap text-gray-700'>{linha.nome} {linha.sobrenome}</td>
                <td className='px-3 py-2.5 whitespace-nowrap text-gray-500 text-xs'>{linha.email}</td>
                <td className='px-3 py-2.5 whitespace-nowrap text-gray-600'>{linha.funcao}</td>
                <td className='px-3 py-2.5 whitespace-nowrap text-gray-500 text-xs'>{linha.registro}</td>
                <td className='px-3 py-2.5'>
                  <StatusBadge value={linha.admin} sim='Sim' nao='Não' simClass='bg-indigo-100 text-indigo-700' naoClass='bg-gray-100 text-gray-500' />
                </td>
                <td className='px-3 py-2.5'>
                  <StatusBadge value={linha.ativo} sim='Ativo' nao='Inativo' simClass='bg-green-100 text-green-700' naoClass='bg-red-100 text-red-600' />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const StatusBadge = ({ value, sim, nao, simClass, naoClass }: {
  value: string; sim: string; nao: string; simClass: string; naoClass: string;
}) => {
  const isS = value === 'S';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${isS ? simClass : naoClass}`}>
      {isS ? sim : nao}
    </span>
  );
};

export default ListaUsuarios
