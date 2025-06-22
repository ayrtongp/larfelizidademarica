import Button_M3 from '@/components/Formularios/Button_M3'
import { Card_M1 } from '@/components/Formularios/Card'
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '@/components/Portal/PortalBase'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { sendMessage } from '@/pages/api/WhatsApp'
import Link from 'next/link'
import React from 'react'
import { BsPeopleFill } from 'react-icons/bs'
import { FaBriefcase, FaFileContract, FaUserShield } from 'react-icons/fa'

const Index = () => {

    const isAdmin = useIsAdmin()

    return (
        <PermissionWrapper href='/portal' groups={['66955f79820cc8004aab9596']}>
            <PortalBase>
                <div className='col-span-full w-full'>

                    <div className="text-center grid grid-cols-12 gap-4 w-full text-gray-700">

                        {isAdmin && (
                            <div className='col-span-6 sm:col-span-2'>
                                <Link href={'/portal/admin'}>
                                    <Card_M1 title={'Admin Panel'} cursorPointer bgColor='bg-white' icon={<FaUserShield size={24} className="text-indigo-500 mb-3 inline-block" />} />
                                </Link>
                            </div>
                        )}

                        <div className='col-span-6 sm:col-span-2'>
                            <Link href={'/portal/administrativo/contratos'}>
                                <Card_M1 title={'Contratos'} cursorPointer bgColor='bg-white' icon={<FaFileContract size={24} className="text-indigo-500 mb-3 inline-block" />} />
                            </Link>
                        </div>

                        <div className='col-span-6 sm:col-span-2'>
                            <Link href={'/portal/administrativo/funcionarios'}>
                                <Card_M1 title={'Funcionários'} cursorPointer bgColor='bg-white' icon={<BsPeopleFill size={24} className="text-indigo-500 mb-3 inline-block" />} />
                            </Link>
                        </div>

                        <div className='col-span-6 sm:col-span-2'>
                            <Link href={'/portal/administrativo/prestadores'}>
                                <Card_M1 title={'Prestadores'} cursorPointer bgColor='bg-white' icon={<FaBriefcase size={24} className="text-indigo-500 mb-3 inline-block" />} />
                            </Link>
                        </div>

                    </div>
                </div>
            </PortalBase>
        </PermissionWrapper>
    )
}

export default Index