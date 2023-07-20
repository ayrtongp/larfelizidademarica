import React, { useEffect, useRef, useState } from 'react'
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '@/components/Portal/PortalBase'
import { useRouter } from 'next/router'
import axios from 'axios'
import profilephoto from '../../../../../public/images/idosos/CarmemIacovino.jpg'
import Image from 'next/image'
import { FaEdit, FaHeart, FaInfo } from 'react-icons/fa'
import { notifyError, notifySuccess } from '@/utils/Functions'
import ResidenteAccordion from '@/components/Residentes/ResidenteAccordion'
import Semiologia from '@/components/Residentes/Semiologia'
import Evolucao from '@/components/Residentes/Evolucao'
import AnotacoesEnfermagem from '@/components/Residentes/AnotacoesEnfermagem'
import { HiAnnotation, HiBriefcase } from 'react-icons/hi'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import svgClipboardText from '@/svg/clipboardtext'
import RelatoriosResidente from '@/components/Residentes/RelatoriosResidente'

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
  foto_base64: string;
}

const ResidenteDetalhes = () => {
  const [residenteData, setResidenteData] = useState<Residente>();
  const [base64, setBase64] = useState('');
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isAdmin = useIsAdmin();

  const [classeAtiva, setClasseAtiva] = useState('menuInfo');
  const [nomeClasse, setNomeClasse] = useState("Informações do Residente");
  const efeitoClasseAtiva = `bg-slate-100 border-l-2 border-purple-500`;

  const handleMenuClick = (e: any) => {
    setClasseAtiva(e.currentTarget.id)

    if (e.currentTarget.id == 'menuInfo') setNomeClasse("Informações do Residente")
    if (e.currentTarget.id == 'menuSemio') setNomeClasse("Semiologia")
    if (e.currentTarget.id == 'menuAnotacoes') setNomeClasse("Semiologia")
    if (e.currentTarget.id == 'menuEvolucao') setNomeClasse("Evolução")
    if (e.currentTarget.id == 'menuRelatorios') setNomeClasse("Relatórios")
  }


  // ########################################
  // ########################################
  // FUNCTIONS 
  // ########################################
  // ########################################

  async function getResidenteDetalhes() {
    if (router.query.id) {
      const response = await axios.get(`/api/Controller/ResidentesController?type=getID&id=${router.query.id[0]}`)
      const result = await response.data.result
      setResidenteData(result)
    }
  }

  // ########################################
  // ########################################
  // USEEFFECT 
  // ########################################
  // ########################################

  useEffect(() => {
    getResidenteDetalhes()
  }, [router.query])

  // ########################################
  // ########################################
  // HANDLERS 
  // ########################################
  // ########################################

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      if (reader.result) {
        const base64Image = reader.result.toString();
        setBase64(base64Image)

        const formData = { foto_base64: base64Image }
        const res = await fetch(`/api/Controller/ResidentesController?type=changePhoto&id=${residenteData?._id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          const data = await res.json();
          notifySuccess('Foto de Perfil Alterada!')
        }
      }
    }
  };

  // ########################################
  // ########################################
  // RETURN 
  // ########################################
  // ########################################

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
                    {isAdmin && (
                      <>
                        <label htmlFor="profile-picture-input" className="cursor-pointer w-9 h-9 absolute right-2 bottom-2 text-blue-500 bg-white rounded-full p-2">
                          <FaEdit size={20} />
                        </label>
                        <input id="profile-picture-input" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                      </>
                    )}

                    {residenteData.foto_base64 && (
                      <Image src={residenteData?.foto_base64} width={64} height={64} alt='/' id='foto_idoso' className='block w-full h-full object-cover rounded-full' />
                    )}
                  </div>
                  <div className='text-center my-4 font-bold text-slate-500 text-xl'>
                    {residenteData.nome}
                  </div>

                  {/* Funções Residente */}
                  <ul className='flex flex-col gap-1'>
                    {/* Item */}
                    <li id='menuInfo' onClick={handleMenuClick}
                      className={`cursor-pointer flex px-2 flex-row items-center ${classeAtiva == "menuInfo" ? efeitoClasseAtiva : null}`}>
                      <span className='p-2 text-blue-600 w-2/12 '><FaInfo /></span>
                      <p className='w-10/12 ml-4'>Informações do Residente</p>
                    </li>

                    {/* Item */}
                    <li id='menuSemio' onClick={handleMenuClick}
                      className={`cursor-pointer flex px-2 flex-row items-center ${classeAtiva == "menuSemio" ? efeitoClasseAtiva : null}`}>
                      <span className='p-2 text-red-600 w-2/12 '><FaHeart /></span>
                      <p className='w-10/12 ml-4'>Semiologia</p>
                    </li>

                    {/* Item */}
                    <li id='menuAnotacoes' onClick={handleMenuClick}
                      className={`cursor-pointer flex px-2 flex-row items-center ${classeAtiva == "menuAnotacoes" ? efeitoClasseAtiva : null}`}>
                      <span className='p-2 text-green-600 w-2/12 '><HiAnnotation /></span>
                      <p className='w-10/12 ml-4'>Anotações da Enfermagem</p>
                    </li>

                    {/* Item */}
                    <li id='menuEvolucao' onClick={handleMenuClick}
                      className={`cursor-pointer flex px-2 flex-row items-center ${classeAtiva == "menuEvolucao" ? efeitoClasseAtiva : null}`}>
                      <span className='p-2 text-orange-600 w-2/12 '><HiBriefcase /></span>
                      <p className='w-10/12 ml-4'>Evolução</p>
                    </li>

                    {/* Item */}
                    <li id='menuRelatorios' onClick={handleMenuClick}
                      className={`cursor-pointer flex px-2 flex-row items-center ${classeAtiva == "menuRelatorios" ? efeitoClasseAtiva : null}`}>
                      <span className='p-2 text-green-600 w-2/12 '>{svgClipboardText()}</span>
                      <p className='w-10/12 ml-4'>Relatórios</p>
                    </li>

                  </ul>
                </div>
              </div>

              {/* MENU DA DIREITA */}
              <div className='col-span-3 sm:col-span-2 bg-white'>

                {/* HEADER */}
                <div className='px-5 pt-5'>
                  <h2 className='text-red-500 font-bold'>
                    {nomeClasse}
                  </h2>
                  <hr className='my-2' />
                </div>

                {/* CONTEÚDO */}

                {/* INFORMAÇÕES DO RESIDENTE */}
                {classeAtiva == "menuInfo" && (
                  <div className='p-3'>
                    <ResidenteAccordion />
                  </div>
                )}

                {/* SEMIOLOGIA */}
                {classeAtiva == "menuSemio" && (
                  <div className='p-3'>
                    <Semiologia />
                  </div>
                )}

                {/* ANOTAÇÕES DA ENFERMAGEM */}
                {classeAtiva == "menuAnotacoes" && (
                  <div className='p-3'>
                    <AnotacoesEnfermagem />
                  </div>
                )}

                {/* EVOLUÇÃO */}
                {classeAtiva == "menuEvolucao" && (
                  <div className='p-3'>
                    <Evolucao />
                  </div>
                )}

                {/* RELATÓRIOS */}
                {classeAtiva == "menuRelatorios" && (
                  <div className='p-3'>
                    <RelatoriosResidente residenteData={residenteData} />
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

      </PortalBase>
    </PermissionWrapper>
  )
}

export default ResidenteDetalhes
