import FormNovoResidente from '@/components/FormNovoResidente'
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '@/components/Portal/PortalBase'
import React from 'react'

const novoresidente = () => {
  return (
    <PermissionWrapper href='/portal/residentes'>
      <PortalBase>
        <FormNovoResidente />
      </PortalBase>
    </PermissionWrapper>
  )
}

export default novoresidente
