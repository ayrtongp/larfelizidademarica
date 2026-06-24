import { Card_M1 } from '@/components/Formularios/Card'
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '@/components/Portal/PortalBase'
import Link from 'next/link'
import React from 'react'
import { FaUserFriends, FaPills } from 'react-icons/fa'

const Index = () => {
    return (
        <PermissionWrapper href='/portal' groups={['coordenacao']}>
            <PortalBase>
                <div className='col-span-full w-full'>
                    <div className="text-center grid grid-cols-12 gap-4 w-full text-gray-700">

                        <div className='col-span-6 sm:col-span-2'>
                            <Link href={'/portal/coordenacao/idosos'}>
                                <Card_M1 title={'Idosos'} cursorPointer bgColor='bg-white' icon={<FaUserFriends size={24} className="text-indigo-500 mb-3 inline-block" />} />
                            </Link>
                        </div>

                        <div className='col-span-6 sm:col-span-2'>
                            <Link href={'/portal/servicos/medicamentos'}>
                                <Card_M1 title={'Medicamentos'} cursorPointer bgColor='bg-white' icon={<FaPills size={24} className="text-rose-500 mb-3 inline-block" />} />
                            </Link>
                        </div>

                    </div>
                </div>
            </PortalBase>
        </PermissionWrapper>
    )
}

export default Index
