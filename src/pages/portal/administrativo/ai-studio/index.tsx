import { Card_M1 } from '@/components/Formularios/Card'
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '@/components/Portal/PortalBase'
import Link from 'next/link'
import React from 'react'
import { FaCamera, FaFileInvoice, FaRobot } from 'react-icons/fa'

const Index = () => {
    return (
        <PermissionWrapper href='/portal'>
            <PortalBase>
                <div className='col-span-full w-full'>

                    <div className="flex items-center gap-3 mb-6">
                        <FaRobot className="text-purple-500 text-2xl" />
                        <div>
                            <h1 className="text-lg font-bold text-gray-800">AI Studio</h1>
                            <p className="text-xs text-gray-400">Automações com inteligência artificial</p>
                        </div>
                    </div>

                    <div className="text-center grid grid-cols-12 gap-4 w-full text-gray-700">

                        <div className='col-span-6 sm:col-span-2'>
                            <Link href={'/portal/administrativo/ai-studio/estoque-foto'}>
                                <Card_M1 title={'Estoque por Foto'} cursorPointer bgColor='bg-white' icon={<FaCamera size={24} className="text-indigo-500 mb-3 inline-block" />} />
                            </Link>
                        </div>

                        <div className='col-span-6 sm:col-span-2'>
                            <Link href={'/portal/administrativo/ai-studio/cupom-fiscal'}>
                                <Card_M1 title={'Leitor de Cupom Fiscal'} cursorPointer bgColor='bg-white' icon={<FaFileInvoice size={24} className="text-emerald-500 mb-3 inline-block" />} />
                            </Link>
                        </div>

                    </div>
                </div>
            </PortalBase>
        </PermissionWrapper>
    )
}

export default Index
