import React, { useEffect, useRef, useState } from 'react'
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '@/components/Portal/PortalBase'
import { useRouter } from 'next/router'
import axios from 'axios'
import Image from 'next/image'
import { FaBook, FaEdit, FaHeart, FaInfo } from 'react-icons/fa'
import { notifyError, notifySuccess } from '@/utils/Functions'
import ResidenteAccordion from '@/components/Residentes/ResidenteAccordion'
import Semiologia from '@/components/Residentes/Semiologia'
import Evolucao from '@/components/Residentes/Evolucao'
import AnotacoesEnfermagem from '@/components/Residentes/AnotacoesEnfermagem'
import { HiAnnotation, HiBriefcase } from 'react-icons/hi'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import RelatoriosResidente from '@/components/Residentes/RelatoriosResidente'
import { MdLocalGroceryStore } from 'react-icons/md'
import Suprimentos from '@/components/Residentes/Suprimentos'
import { Residente } from '@/types/Residente'
import Accordion_Modelo1 from '@/components/Accordion_Modelo1'
import FormDadosIdoso from '@/components/Forms/FormDadosIdoso'
import { getUserID } from '@/utils/Login'
import GruposUsuario_getGruposUsuario from '@/actions/GruposUsuario_getGruposUsuario'
import Residente_Files from '@/components/Residentes/Residente_Files'

interface objProps {
  className: string;
  label: string;
  icon: any;
  component: any;
  color: string;
}

const ResidenteDetalhes = () => {
  const [residenteData, setResidenteData] = useState<Residente>();
  const [base64, setBase64] = useState('');
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isAdmin = useIsAdmin();
  const [funcao, setFuncao] = useState('');
  const [gruposUsuario, setGruposUsuario] = useState<any>([]);

  const [classeAtiva, setClasseAtiva] = useState('menuInfo');
  const [nomeClasse, setNomeClasse] = useState("Informações do Residente");
  const efeitoClasseAtiva = `bg-slate-100 border-l-2 border-purple-500`;

  const object: objProps[] = [
    { className: "menuInfo", label: "Informações do Residente", icon: <FaInfo />, component: <ResidenteAccordion />, color: 'text-blue-600' },
    { className: "menuSemio", label: "Sinais Vitais", icon: <FaHeart />, component: <ResidenteAccordion />, color: 'text-red-600' },
    { className: "menuAnotacoes", label: "Anotações Enfermagem", icon: <HiAnnotation />, component: <ResidenteAccordion />, color: 'text-green-600' },
    { className: "menuEvolucao", label: "Evolução Multidisciplinar", icon: <HiBriefcase />, component: <ResidenteAccordion />, color: 'text-orange-600' },
    { className: "menuRelatorios", label: "Relatórios", icon: <MdLocalGroceryStore />, component: <ResidenteAccordion />, color: 'text-purple-600' },
    { className: "menuSuprimentos", label: "Suprimentos", icon: <HiAnnotation />, component: <ResidenteAccordion />, color: 'text-green-600' },
    { className: "menuArquivos", label: "Arquivos", icon: <FaBook />, component: <ResidenteAccordion />, color: 'text-fuchsia-600' },
  ];

  const handleMenuClick = (e: React.MouseEvent<HTMLLIElement>) => {
    const id = e.currentTarget.id;
    setClasseAtiva(id);

    const clickedItem = object.find(item => item.className === id);
    if (clickedItem) {
      setNomeClasse(clickedItem.label);
    }
  };



  // ########################################
  // ########################################
  // FUNCTIONS 
  // ########################################
  // ########################################

  async function getGruposUsuario() {
    const userId = getUserID()
    const grupos = await GruposUsuario_getGruposUsuario(userId)
    if (grupos.length > 0) {
      setGruposUsuario(grupos)
    }
  }

  async function getResidenteDetalhes() {
    if (router.query.id) {
      const response = await axios.get(`/api/Controller/ResidentesController?type=getID&id=${router.query.id[0]}`)
      const result = await response.data.result
      setResidenteData(result)

      const userInfo = JSON.parse(localStorage.getItem('userInfo') as any | null)
      const funcaoUsuario = userInfo.funcao
      setFuncao(funcaoUsuario)
    }
  }

  // ########################################
  // ########################################
  // USEEFFECT 
  // ########################################
  // ########################################

  useEffect(() => {
    getResidenteDetalhes()
    getGruposUsuario()
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
                <div className='p-2 border shadow-md rounded-md'>

                  <div className='flex flex-row gap-2 items-center mb-4'>
                    <ProfileAvatar isAdmin={isAdmin} foto={residenteData?.foto_base64} onImageChange={handleImageChange} />
                    <div className='text-center my-4 font-bold text-slate-500 text-xl'>
                      {residenteData.nome}
                    </div>
                  </div>

                  {/* Funções Residente */}
                  <ul className='flex flex-col gap-1'>
                    {object.map((item: objProps, index: number) => {
                      {/* Item */ }
                      return (
                        <li key={index} id={item.className} onClick={handleMenuClick}
                          className={`cursor-pointer flex px-2 flex-row items-center ${classeAtiva == `${item.className}` ? efeitoClasseAtiva : null}`
                          }>
                          <span className={`p-2 ${item.color} w-2/12`}>{item.icon}</span>
                          <p className='w-10/12 ml-4'>{item.label}</p>
                        </li>
                      )
                    })}
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
                    <FormDadosIdoso residenteData={residenteData} isEGPP={gruposUsuario.some((grupo: any) => grupo?.cod_grupo === "pia")} />
                  </div>)}

                {/* SEMIOLOGIA */}
                {classeAtiva == "menuSemio" && (<div className='p-3'><Semiologia residenteData={residenteData} /></div>)}

                {/* ANOTAÇÕES DA ENFERMAGEM */}
                {classeAtiva == "menuAnotacoes" && (<div className='p-3'><AnotacoesEnfermagem /></div>)}

                {/* EVOLUÇÃO */}
                {classeAtiva == "menuEvolucao" && (<div className='p-3'><Evolucao /></div>)}

                {/* SUPRIMENTOS */}
                {classeAtiva == "menuSuprimentos" && router.query.id && (
                  <div className='p-3'><Suprimentos ResidenteId={router.query.id[0]} /></div>)}

                {/* RELATÓRIOS */}
                {classeAtiva == "menuRelatorios" && (<div className='p-3'><RelatoriosResidente residenteData={residenteData} /></div>)}

                {/* ARQUIVOS */}
                {classeAtiva == "menuArquivos" && (<div className='p-3'><Residente_Files residenteData={residenteData} /></div>)}

              </div>
            </div>
          </div>
        )}

      </PortalBase>
    </PermissionWrapper >
  )
}

export default ResidenteDetalhes


const ProfileAvatar = ({ isAdmin, foto, onImageChange, }: { isAdmin: boolean; foto?: string; onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }) => (
  <div className="relative flex w-20 h-20 sm:w-40 sm:h-40 ">
    {isAdmin && (
      <>
        <label
          htmlFor="profile-picture-input"
          className="absolute right-1 bottom-1 flex items-center justify-center w-7 h-7 sm:w-12 sm:h-12 bg-white text-blue-500 rounded-full p-1 sm:p-2 cursor-pointer focus:outline-none"
        >
          <FaEdit className="w-4 h-4 sm:w-6 sm:h-6" />
        </label>
        <input id="profile-picture-input" type="file" className="sr-only" accept="image/*" onChange={onImageChange} />
      </>
    )}
    {foto && (
      <Image src={foto} width={160} height={160} alt="Foto do residente" id="foto_idoso"
        className="block w-full h-full object-cover rounded-full"
      />
    )}
  </div>
);