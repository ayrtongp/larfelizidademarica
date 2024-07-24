import React, { useEffect, useState } from 'react'
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '@/components/Portal/PortalBase'
import { Card_M1 } from '@/components/Formularios/Card'
import { BsListNested, BsPlus } from 'react-icons/bs'
import NovoContrato from '@/components/Subpages/NovoContrato'
import ListarContratos from '@/components/Subpages/ListarContratos'
import { Residentes_GET_getAllActive } from '@/actions/Residentes'
import { Residente } from '@/types/Residente'
import { notifyError } from '@/utils/Functions'
import { Contratos_GET_getAll } from '@/actions/Contratos'
import { Contrato } from '@/types/Contrato'

const Index = () => {

    const [activeComponent, setActiveComponent] = useState<string>('');
    const [residentesAtivos, setResidentesAtivos] = useState<Residente[]>([]);
    const [contratos, setContratos] = useState<Contrato[]>([]);

    // ############################################
    // HANDLERS
    // ############################################



    // ############################################
    // USEEFFECT
    // ############################################

    async function getContratos() {
        const result = await Contratos_GET_getAll()
        result.length > 0 && setContratos(result)
        result.length <= 0 && notifyError('Nenhum contrato encontrado!')
    }

    async function getResidentes() {
        const result = await Residentes_GET_getAllActive();
        result.length > 0 && setResidentesAtivos(result)
        result.length <= 0 && notifyError('Falha ao buscar lista de residentes')
    }

    useEffect(() => {
        async function fetchData() {
            await getContratos();
            await getResidentes();
            if (contratos.length > 0 && residentesAtivos.length > 0) {

            }
        }

        fetchData();
    }, [])

    // ############################################
    // RETURN
    // ############################################

    return (
        <PermissionWrapper href='/portal' groups={['66955f79820cc8004aab9596']}>
            <PortalBase>

                <div className='col-span-full'>
                    <h1 className='text-2xl font-bold'>Contratos Lar Felizidade</h1>
                </div>

                <div className='col-span-full grid grid-cols-12 gap-3'>
                    <div id='cts-novo' className='col-span-6 sm:col-span-2' onClick={(e: any) => setActiveComponent(e.currentTarget.id)}>
                        <Card_M1 title={'Novo Contrato'} icon={<BsPlus size={24} className='text-purple-500 inline-block' />} bgColor={'bg-white'} cursorPointer />
                    </div>
                    <div id='cts-listar' className='col-span-6 sm:col-span-2' onClick={(e: any) => setActiveComponent(e.currentTarget.id)}>
                        <Card_M1 title={'Listar Todos'} icon={<BsListNested size={24} className='text-purple-500 inline-block' />} bgColor={'bg-white'} cursorPointer />
                    </div>

                    {activeComponent === 'cts-novo' && (<NovoContrato residentes={residentesAtivos} />)}
                    {activeComponent === 'cts-listar' && (<ListarContratos contratos={contratos} />)}

                </div>
            </PortalBase>
        </PermissionWrapper>
    )
}

export default Index