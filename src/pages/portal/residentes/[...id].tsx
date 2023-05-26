import React, { useEffect, useState } from 'react'
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '@/components/Portal/PortalBase'
import { useRouter } from 'next/router'
import axios from 'axios'
import profilephoto from '../../../../public/images/idosos/CarmemIacovino.jpg'
import Image from 'next/image'
import { FaEdit, FaHeart } from 'react-icons/fa'

interface Residente {
  _id: string;
  apelido: string;
  cpf: string;
  data_entrada: string;
  data_nascimento: string;
  genero: string;
  informacoes: string;
  nome: string;
  is_ativo: string;
}

const ResidenteDetalhes = () => {
  const [residenteData, setResidenteData] = useState<Residente>();
  const [foto, setFoto] = useState("");
  const router = useRouter()

  async function getResidenteDetalhes() {
    if (router.query.id) {
      const response = await axios.get(`/api/Controller/ResidentesController?type=getID&id=${router.query.id[0]}`)
      const result = await response.data.result
      setResidenteData(result)
    }
  }

  useEffect(() => {
    getResidenteDetalhes()
  }, [router.query])

  return (
    <PermissionWrapper href='/portal/residentes'>
      <PortalBase>

        {residenteData?.is_ativo != "S" && (
          <div>
            Usuário Inativo
          </div>
        )}

        {residenteData?.is_ativo == "S" && (
          <div className='col-span-12 w-full'>
            <div className=" grid grid-cols-1 sm:grid-cols-3">
              <div className='col-span-3 sm:col-span-1'>
                <div className='border py-4'>
                  <div className='relative flex justify-center mt-3 w-40 h-40 mx-auto'>
                    <FaEdit size={35} className='absolute right-2 bottom-2 text-blue-500 bg-white rounded-full p-2' />
                    <Image src={foto ? foto : profilephoto} width={64} height={64} alt='/' id='foto_idoso' className='block w-full h-full object-cover rounded-full' />
                  </div>
                  <div className='text-center my-4 font-bold text-slate-500 text-xl'>
                    {residenteData.nome}
                  </div>
                  <div className='flex flex-col px-4'>
                    
                    {/* Item */}
                    <div className='flex flex-row items-center border border-collapse'>
                      <span className='p-2 text-red-600 w-2/12 '><FaHeart /></span>
                      <p className='w-10/12 ml-4'>semiologia</p>
                    </div>
                    
                    {/* Item */}
                    <div className='flex flex-row items-center border border-collapse'>
                      <span className='p-2 text-red-600 w-2/12 '><FaHeart /></span>
                      <p className='w-10/12 ml-4'>semiologia</p>
                    </div>

                  </div>
                </div>
              </div>
              <div className='col-span-3 sm:col-span-2'>

              </div>
            </div>
          </div>
        )}

      </PortalBase>
    </PermissionWrapper>
  )
}

export default ResidenteDetalhes
