import axios from 'axios';
import Image from 'next/image';
import React, { useEffect, useState } from 'react'
import ImagemPadrao from '../../../public/images/lar felizidade logo transparente.png'
import Residentes_getAll from '@/actions/Residentes_getAll';
import Residentes_put_toggleIsAtivo from '@/actions/Residentes_put_toggleIsAtivo';
import { notifyError, notifySuccess } from '@/utils/Functions';

type ListaData = {
  apelido: string;
  cpf: string;
  createdAt: string;
  data_entrada: string;
  data_nascimento: string;
  foto_base64: string;
  genero: string;
  informacoes: string;
  is_ativo: string;
  nome: string;
  updatedAt: string;
  _id: string;
}

const ListaResidentesAtivos = () => {
  const [listaUsuarios, setListaUsuarios] = useState<ListaData[]>([]);

  useEffect(() => {
    async function fetchResidentes() {
      const residentes = await Residentes_getAll();
      setListaUsuarios(residentes);
    }

    fetchResidentes();
  }, []);

  const handleChangeIsAtivo = async (e: any) => {
    const tr = e.target.closest('tr');
    const idCell = tr.dataset.id
    const isAtivo = tr.dataset.value
    const result = await Residentes_put_toggleIsAtivo(idCell, isAtivo)

    if (result) {
      notifySuccess("Alterado com sucesso")
    } else {
      notifyError("Não foi possível alterar.")
    }
  }

  return (
    <div className='relative overflow-x-auto shadow-md sm:rounded-lg'>
      <table className='table-auto w-full text-xs bg-white'>
        <thead className='uppercase'>
          <tr className='bg-black text-white font-bold'>
            <th className='px-2 py-1'>Apelido</th>
            <th className='px-2 py-1'>Nome</th>
            <th className='px-2 py-1'>Ativo</th>
            <th className='px-2 py-1'>ID</th>
          </tr>
        </thead>
        <tbody >
          {listaUsuarios.map((linha, index) => {
            const imagemUsuario = linha.foto_base64
            return (
              <tr key={index} data-id={linha?._id} data-value={linha.is_ativo} className={`border-b ${index % 2 == 0 ? 'bg-gray-50' : 'bg-white'}`}>
                <td className='px-2 py-1 whitespace-nowrap min-w-[160px]'>
                  <div className='flex flex-row items-center gap-1 justify-start'>
                    <Image className='rounded-full w-10 h-10' width={30} height={30} src={imagemUsuario ? imagemUsuario : ImagemPadrao} alt={linha?.nome} />
                    {linha?.apelido}
                  </div>
                </td>
                <td className='text-center px-2 py-1 whitespace-nowrap'>{linha?.nome}</td>
                <td className='text-center px-2 py-1 whitespace-nowrap' onClick={handleChangeIsAtivo}>
                  <SelectSimNao linha={linha.is_ativo} />
                </td>
                <td className='text-center px-2 py-1 whitespace-nowrap'>{linha?._id}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default ListaResidentesAtivos


const SelectSimNao = ({ linha }: any) => {
  if (linha == "S") linha = true
  else linha = false
  return (
    <div className="flex justify-center items-center border rounded-md border-gray-300 w-20 h-8 mx-auto">
      <div className={`w-1/2 h-full flex justify-center items-center ${linha ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-800 cursor-pointer'}`}>
        S
      </div>
      <div className={`w-1/2 flex h-full justify-center items-center ${!linha ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-800 cursor-pointer'}`}>
        N
      </div>
    </div>
  )
}