import { Card_M1 } from '@/components/Formularios/Card'
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '@/components/Portal/PortalBase'
import Link from 'next/link'
import React from 'react'
import { FaCalendarAlt, FaUsers, FaUmbrellaBeach, FaBriefcase, FaClock, FaFileInvoiceDollar, FaClipboardList, FaMoneyCheckAlt } from 'react-icons/fa'

const Index = () => {
    return (
        <PermissionWrapper href='/portal' groups={['rh']}>
            <PortalBase>
                <div className='col-span-full w-full'>
                    <div className="text-center grid grid-cols-12 gap-4 w-full text-gray-700">

                        <div className='col-span-6 sm:col-span-2'>
                            <Link href={'/portal/rh/agenda'}>
                                <Card_M1 title={'Agenda Geral'} cursorPointer bgColor='bg-white' icon={<FaCalendarAlt size={24} className="text-sky-500 mb-3 inline-block" />} />
                            </Link>
                        </div>

                        <div className='col-span-6 sm:col-span-2'>
                            <Link href={'/portal/rh/funcionarios'}>
                                <Card_M1 title={'Funcionários CLT'} cursorPointer bgColor='bg-white' icon={<FaUsers size={24} className="text-indigo-500 mb-3 inline-block" />} />
                            </Link>
                        </div>

                        <div className='col-span-6 sm:col-span-2'>
                            <Link href={'/portal/rh/ferias'}>
                                <Card_M1 title={'Férias'} cursorPointer bgColor='bg-white' icon={<FaUmbrellaBeach size={24} className="text-sky-500 mb-3 inline-block" />} />
                            </Link>
                        </div>

                        <div className='col-span-6 sm:col-span-2'>
                            <Link href={'/portal/rh/prestadores'}>
                                <Card_M1 title={'Prestadores'} cursorPointer bgColor='bg-white' icon={<FaBriefcase size={24} className="text-indigo-500 mb-3 inline-block" />} />
                            </Link>
                        </div>

                        <div className='col-span-6 sm:col-span-2'>
                            <Link href={'/portal/rh/escala'}>
                                <Card_M1 title={'Escala'} cursorPointer bgColor='bg-white' icon={<FaClock size={24} className="text-indigo-500 mb-3 inline-block" />} />
                            </Link>
                        </div>

                        <div className='col-span-6 sm:col-span-2'>
                            <Link href={'/portal/rh/folha-ponto'}>
                                <Card_M1 title={'Folha de Ponto'} cursorPointer bgColor='bg-white' icon={<FaClipboardList size={24} className="text-teal-500 mb-3 inline-block" />} />
                            </Link>
                        </div>

                        <div className='col-span-6 sm:col-span-2'>
                            <Link href={'/portal/rh/folha-pagamento'}>
                                <Card_M1 title={'Folha de Pagamento'} cursorPointer bgColor='bg-white' icon={<FaFileInvoiceDollar size={24} className="text-emerald-500 mb-3 inline-block" />} />
                            </Link>
                        </div>

                        <div className='col-span-6 sm:col-span-2'>
                            <Link href={'/portal/rh/contracheques'}>
                                <Card_M1 title={'Contracheques'} cursorPointer bgColor='bg-white' icon={<FaMoneyCheckAlt size={24} className="text-emerald-600 mb-3 inline-block" />} />
                            </Link>
                        </div>

                    </div>
                </div>
            </PortalBase>
        </PermissionWrapper>
    )
}

export default Index
