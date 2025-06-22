import BotaoPadrao from '@/components/BotaoPadrao'
import UserListMobilePhoto from '@/components/Lists/UserListMobilePhoto'
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '@/components/Portal/PortalBase'
import ResidenteCard from '@/components/ResidenteCard'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useIsMobile } from '@/hooks/useIsMobile'
import { calcularIdade } from '@/utils/Functions'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { FaChevronRight } from 'react-icons/fa'

const Index = () => {
  const [residentes, setResidentes] = useState([]);
  const isAdmin = useIsAdmin();
  const isMobile = useIsMobile()

  const getResidentesAtivos = async () => {
    const url = "/api/Controller/ResidentesController?type=getAllActive"
    const response = await axios.get(url)
    if (response.status == 200) {
      setResidentes(response.data)
    }
  }

  useEffect(() => {
    getResidentesAtivos()
  }, [])

  return (
    <PermissionWrapper href='/portal/residentes'>
      <PortalBase>

        {isAdmin && (
          <div className='col-span-12'>
            <BotaoPadrao href='/portal/residentes/novoresidente' text='+ Novo Residente' />
          </div>
        )}

        {residentes.map((residente: any, index: number) => {

          if (isMobile) {
            const idadeAnos = calcularIdade(residente.data_nascimento)
            return <UserListMobilePhoto key={index} id={residente._id} idade={idadeAnos} nome={residente.nome} avatarUrl={residente.foto_base64} apelido={residente.apelido} />
          }
          else {
            return <ResidenteCard key={index} residenteData={residente} />
          }
        })}

      </PortalBase>
    </PermissionWrapper>
  )
}

export default Index

type Props = {
  id: string
  nome: string
  idade: number
  apelido?: string
  avatarUrl: string
}