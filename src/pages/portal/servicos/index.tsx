import { Card_M1 } from '@/components/Formularios/Card'
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '@/components/Portal/PortalBase'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import Link from 'next/link'
import React from 'react'
import { FaFirstAid, FaNotesMedical, FaUserShield } from 'react-icons/fa'

const Index = () => {

    const objServicos = [
        {
            name: 'lesoes',
            title: 'Lesões',
            icon: <FaFirstAid size={24} className="text-indigo-500 mb-3 inline-block" />,
            href: '/portal/servicos/lesoes'
        },
        {
            name: 'medicaoAvulsa',
            title: 'Medição Avulsa',
            icon: <FaNotesMedical size={24} className="text-indigo-500 mb-3 inline-block" />,
            href: '/portal/servicos/medicaoAvulsa'
        },
    ]


    return (
        <PermissionWrapper href='/portal' groups={['66955f79820cc8004aab9596']}>
            <PortalBase>
                <div className='col-span-full w-full'>

                    <div className="text-center grid grid-cols-12 gap-4 w-full text-gray-700">

                        {objServicos.map((servico) => (
                            <div className='col-span-6 sm:col-span-2' key={servico.name}>
                                <Link href={servico.href}>
                                    <Card_M1 title={servico.title} cursorPointer bgColor='bg-white' icon={servico.icon} />
                                </Link>
                            </div>
                        ))}

                    </div>
                </div>
            </PortalBase>
        </PermissionWrapper>
    )
}

export default Index