import { Card_M1 } from '@/components/Formularios/Card'
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '@/components/Portal/PortalBase'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { ADMINISTRATIVO_GROUP_ID } from '@/constants/accessGroups'
import Link from 'next/link'
import React from 'react'
import { FaChartBar, FaFileContract, FaFolderOpen, FaUserShield, FaCalendarAlt, FaUsers, FaRobot } from 'react-icons/fa'

const Index = () => {

    const isAdmin = useIsAdmin()

    return (
        <PermissionWrapper href='/portal' groups={[ADMINISTRATIVO_GROUP_ID]}>
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
                            <Link href={'/portal/administrativo/gestao'}>
                                <Card_M1 title={'Gestão'} cursorPointer bgColor='bg-white' icon={<FaChartBar size={24} className="text-emerald-500 mb-3 inline-block" />} />
                            </Link>
                        </div>

                        <div className='col-span-6 sm:col-span-2'>
                            <Link href={'/portal/administrativo/contratos'}>
                                <Card_M1 title={'Contratos'} cursorPointer bgColor='bg-white' icon={<FaFileContract size={24} className="text-indigo-500 mb-3 inline-block" />} />
                            </Link>
                        </div>

                        <div className='col-span-6 sm:col-span-2'>
                            <Link href={'/portal/administrativo/arquivos'}>
                                <Card_M1 title={'Arquivos'} cursorPointer bgColor='bg-white' icon={<FaFolderOpen size={24} className="text-indigo-500 mb-3 inline-block" />} />
                            </Link>
                        </div>

                        <div className='col-span-6 sm:col-span-2'>
                            <Link href={'/portal/administrativo/datas-importantes'}>
                                <Card_M1 title={'Datas Importantes'} cursorPointer bgColor='bg-white' icon={<FaCalendarAlt size={24} className="text-indigo-500 mb-3 inline-block" />} />
                            </Link>
                        </div>

                        <div className='col-span-6 sm:col-span-2'>
                            <Link href={'/portal/administrativo/familia'}>
                                <Card_M1 title={'Família'} cursorPointer bgColor='bg-white' icon={<FaUsers size={24} className="text-rose-500 mb-3 inline-block" />} />
                            </Link>
                        </div>

                        <div className='col-span-6 sm:col-span-2'>
                            <Link href={'/portal/administrativo/ai-studio'}>
                                <Card_M1 title={'AI Studio'} cursorPointer bgColor='bg-white' icon={<FaRobot size={24} className="text-purple-500 mb-3 inline-block" />} />
                            </Link>
                        </div>

                    </div>
                </div>
            </PortalBase>
        </PermissionWrapper>
    )
}

export default Index
