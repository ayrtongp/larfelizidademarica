import BotaoPadrao from '@/components/BotaoPadrao'
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '@/components/Portal/PortalBase'
import ResidenteCard from '@/components/ResidenteCard'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import axios from 'axios'
import React, { useEffect, useState } from 'react'

const Index = () => {
  const [residentes, setResidentes] = useState([]);
  const isAdmin = useIsAdmin();

  const getResidentesAtivos = async () => {
    const url = "/api/Controller/ResidentesController?type=getAll"
    const response = await axios.get(url)
    if (response.statusText == "OK") {
      setResidentes(response.data)
    }
  }

  console.log(residentes)

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

        {residentes.map((residente, index) => {
          return <ResidenteCard key={index} residenteData={residente} />
        })}

      </PortalBase>
    </PermissionWrapper>
  )
}

export default Index
