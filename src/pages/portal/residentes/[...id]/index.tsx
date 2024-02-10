import React, { useEffect, useRef, useState } from 'react'
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '@/components/Portal/PortalBase'
import { useRouter } from 'next/router'
import axios from 'axios'
import Image from 'next/image'
import { FaEdit, FaHeart, FaInfo } from 'react-icons/fa'
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
                {classeAtiva == "menuInfo" && (<div className='p-3'><ResidenteAccordion /></div>)}

                {/* SEMIOLOGIA */}
                {classeAtiva == "menuSemio" && (<div className='p-3'><Semiologia /></div>)}

                {/* ANOTAÇÕES DA ENFERMAGEM */}
                {classeAtiva == "menuAnotacoes" && (<div className='p-3'><AnotacoesEnfermagem /></div>)}

                {/* EVOLUÇÃO */}
                {classeAtiva == "menuEvolucao" && (<div className='p-3'><Evolucao /></div>)}

                {/* SUPRIMENTOS */}
                {classeAtiva == "menuSuprimentos" && router.query.id && (
                  <div className='p-3'><Suprimentos ResidenteId={router.query.id[0]} /></div>)}

                {/* RELATÓRIOS */}
                {classeAtiva == "menuRelatorios" && (<div className='p-3'><RelatoriosResidente residenteData={residenteData} /></div>)}

              </div>
            </div>
          </div>
        )}

      </PortalBase>
    </PermissionWrapper >
  )
}

export default ResidenteDetalhes
