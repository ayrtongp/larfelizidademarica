import FormNovoUsuario from '@/components/FormNovoUsuario'
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '@/components/Portal/PortalBase'
import React from 'react'

const index = () => {
  return (
    <PermissionWrapper href='/portal/admin'>
      <PortalBase>
        <div className='col-span-12'>
          <FormNovoUsuario />
        </div>
      </PortalBase>
    </PermissionWrapper>
  )
}

export default index
