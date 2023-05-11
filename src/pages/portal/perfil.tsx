import Navportal from '@/components/Navportal';
import PerfilFotoUpload from '@/components/PerfilFotoUpload';
import PermissionWrapper from '@/components/PermissionWrapper';
import React from 'react'

const index = () => {
  return (
    <div>
      <PermissionWrapper href='/portal'>
        <Navportal />
        <div className='flex flex-col justify-center items-center h-screen w-max mx-auto'>
          <PerfilFotoUpload />
        </div>
      </PermissionWrapper>
    </div>
  )
}

export default index
