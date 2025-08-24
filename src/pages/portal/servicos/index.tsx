import GruposUsuario_getGruposUsuario from '@/actions/GruposUsuario_getGruposUsuario'
import { Card_M1 } from '@/components/Formularios/Card'
import AbrirPortao from '@/components/Paginas/Servicos/AbrirPortao'
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '@/components/Portal/PortalBase'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { getUserID } from '@/utils/Login'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
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

    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        const fetchGrupos = async () => {
            const grupos = await GruposUsuario_getGruposUsuario(getUserID());
            setHasPermission(grupos?.some((g: any) => g.cod_grupo === 'portao_lar'));
        };
        fetchGrupos();
    }, []);


    return (
        <PermissionWrapper href='/portal'>
            <PortalBase>
                <div className='col-span-full w-full'>

                    <div className="text-center grid grid-cols-12 gap-4 w-full text-gray-700">

                        {hasPermission && (
                            <div className='col-span-full'>
                                <AbrirPortao userId={getUserID()} />
                            </div>
                        )}

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