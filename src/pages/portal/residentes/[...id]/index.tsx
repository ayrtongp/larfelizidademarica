import React, { useEffect, useState } from 'react'
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '@/components/Portal/PortalBase'
import { useRouter } from 'next/router'
import axios from 'axios'
import profilephoto from '../../../../../public/images/idosos/CarmemIacovino.jpg'
import Image from 'next/image'
import { FaEdit, FaHeart, FaInfo } from 'react-icons/fa'
import { notifyError, notifySuccess } from '@/utils/Functions'

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
  const [selectedImage, setSelectedImage] = useState<File | undefined>();
  const [previewImage, setPreviewImage] = useState<string | undefined>();
  const [base64, setBase64] = useState('');
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

  const handleUpload = async () => {
    try {
      const formData = { foto_base64: base64 }
      const res = await fetch(`/api/Controller/ResidentesController?type=changePhoto&id=${residenteData?._id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        const newPic = document.getElementById('foto_perfil') as HTMLImageElement
        newPic ? newPic.src = base64 : ''
        notifySuccess('Foto de Perfil Alterada!')
      } else {
        notifyError('Erro ao alterar a foto!')
      }
    } catch (error) {
      console.error(error);
      notifyError("Houve um erro na requisição")
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    setPreviewImage(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
      if (reader.result) {
        const base64Image = reader.result.toString();
        setBase64(base64Image)
        let userInfo = localStorage.getItem('userInfo');
        if (userInfo && userInfo !== null) {
          let teste = JSON.parse(userInfo)
          if (teste) {
            teste.fotoPerfil = base64Image;
            localStorage.setItem('userInfo', JSON.stringify(teste));
          }
        }

      }
    }
  };

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

            <div className=" grid grid-cols-1 gap-3 sm:grid-cols-3">

              {/* MENU DA ESQUERDA */}
              <div className='col-span-3 sm:col-span-1 bg-white'>
                <div className='border py-4'>
                  <div className='relative flex justify-center mt-3 w-40 h-40 mx-auto'>
                    <button className='w-9 h-9 absolute right-2 bottom-2 text-blue-500 bg-white rounded-full p-2'>
                      <FaEdit size={20} />
                    </button>
                    <input id="profile-picture-input" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />

                    <Image src={foto ? foto : profilephoto} width={64} height={64} alt='/' id='foto_idoso' className='block w-full h-full object-cover rounded-full' />
                  </div>
                  <div className='text-center my-4 font-bold text-slate-500 text-xl'>
                    {residenteData.nome}
                  </div>

                  {/* Funções Residente */}
                  <div className='flex flex-col px-4 gap-1'>
                    {/* Item */}
                    <div className='flex flex-row items-center'>
                      <span className='p-2 text-blue-600 w-2/12 '><FaInfo /></span>
                      <p className='w-10/12 ml-4'>Informações do Residente</p>
                    </div>

                    {/* Item */}
                    <div className='flex flex-row items-center'>
                      <span className='p-2 text-red-600 w-2/12 '><FaHeart /></span>
                      <p className='w-10/12 ml-4'>Semiologia</p>
                    </div>

                  </div>
                </div>
              </div>

              {/* MENU DA DIREITA */}
              <div className='col-span-3 sm:col-span-2 bg-white'>

                {/* HEADER */}
                <div className='p-5'>
                  <h2 className='text-red-500 font-bold'>Informações do Residente</h2>
                  <hr className='my-2' />
                </div>

                {/* CONTEÚDO */}
                <div>

                </div>


              </div>
            </div>
          </div>
        )}

      </PortalBase>
    </PermissionWrapper>
  )
}

export default ResidenteDetalhes
