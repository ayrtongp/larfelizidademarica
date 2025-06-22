import React, { useEffect, useState } from 'react'
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '@/components/Portal/PortalBase'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useRouter } from 'next/router'
import { Comunicados_GET_getID, Comunicados_PUT_confirmarLeitura } from '@/actions/Comunicados'
import { Comunicado } from '@/types/Comunicado'
import Text_M3 from '@/components/Formularios/Text_M3'
import { formatDateBR } from '@/utils/Functions'
import Textarea_M3 from '@/components/Formularios/TextArea_M3'
import Button_M3 from '@/components/Formularios/Button_M3'
import { getUserID } from '@/utils/Login'

const Id = () => {
    const [loading, setLoading] = useState<boolean>(false)
    const [comunicado, setComunicado] = useState<Comunicado | null>(null);
    const [zeroLeitura, setZeroLeitura] = useState<boolean>(false);
    const [isRead, setIsRead] = useState<boolean>(false);
    const router = useRouter();
    const { id } = router.query

    const handleConfirmaLeitura = async () => {
        setLoading(true);

        const data = { comunicadoId: id, userId: getUserID() }
        const result = await Comunicados_PUT_confirmarLeitura(data)
        setIsRead(true)
        setLoading(false);
    }

    async function getDetalhes() {
        if (id) {
            const getComunicado = await Comunicados_GET_getID(id as string)
            const data = getComunicado.result
            const comunicadoLido = data.readers && data.readers.some((item: any) => item.userId === getUserID())
            setIsRead(comunicadoLido)
            setComunicado(data)
            setZeroLeitura(data?.readers == undefined || data?.readers?.length < 1)
        }
    }

    useEffect(() => {
        async function fetchData() {
            await getDetalhes()
        }
        fetchData();
    }, [router])

    if (loading) {
        return <LoadingSpinner />
    }

    else {

        return (
            <PermissionWrapper href='' >
                <PortalBase>
                    <div className='col-span-full flex flex-col gap-5'>
                        {comunicado != null && (
                            <div>
                                <Text_M3 name='title' disabled label='Título' value={comunicado.title} onChange={() => null} />
                                <Textarea_M3 name='description' disabled label='Descrição' value={comunicado.description} onChange={() => null} />
                                <Text_M3 name='createdAt' disabled label='Criado em' value={formatDateBR(comunicado.createdAt)} onChange={() => null} />
                                <Text_M3 name='creatorName' disabled label='Criado por' value={comunicado.creatorName || ''} onChange={() => null} />
                            </div>
                        )}

                        {(zeroLeitura || !isRead) && (
                            <div>
                                <Button_M3 label='Confirmar Leitura' onClick={handleConfirmaLeitura} bgColor='green' />
                            </div>
                        )}
                    </div>
                </PortalBase>
            </PermissionWrapper>
        )
    }

}

export default Id