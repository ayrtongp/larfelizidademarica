import FormNovoUsuario from '@/components/FormNovoUsuario'
import Navportal from '@/components/Navportal'
import PerfilFotoUpload from '@/components/PerfilFotoUpload'
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '@/components/Portal/PortalBase'
import React from 'react'

const index = () => {
  return (
    <PermissionWrapper href='/portal'>
      <PortalBase>
        <div className='col-span-12'>
          <PerfilFotoUpload />
        </div>
      </PortalBase>
    </PermissionWrapper>
  )
}

export default index
