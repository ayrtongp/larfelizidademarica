import { Comunicados_GET_getAll, Comunicados_POST_create } from '@/actions/Comunicados';
import Button_M3 from '@/components/Formularios/Button_M3';
import Text_M3 from '@/components/Formularios/Text_M3';
import Textarea_M3 from '@/components/Formularios/TextArea_M3';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modalpadrao from '@/components/ModalPadrao';
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '@/components/Portal/PortalBase'
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { sendMessage } from '@/pages/api/WhatsApp';
import { Comunicado } from '@/types/Comunicado';
import { formatDateBR, getUserDetails, notifyError, notifySuccess, slice3Points } from '@/utils/Functions';
import { getUserFuncao, getUserID } from '@/utils/Login';
import React, { ReactNode, useEffect, useState } from 'react'

// #####################

interface TopicProps {
    _id: string;
    read: boolean;
    title: string;
    description: string;
    href: string;
    date: string;
}

const Index = () => {

    const emptyComunicado: Comunicado = { _id: '', title: '', description: '', readers: [], creatorName: '', createdBy: '' }

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [hasPermission, setHasPermission] = useState<boolean>(false);
    const [userInfo, setUserinfo] = useState<any>({});
    const [comunicados, setComunicados] = useState<Comunicado[]>([]);
    const [formData, setFormData] = useState<Comunicado>(emptyComunicado)
    const [loading, setLoading] = useState<boolean>(false)
    const isAdmin = useIsAdmin();

    // #####################
    // HANDLERS
    // #####################

    const handleChange = (e: any) => {
        setFormData((prevState) => ({ ...prevState, [e.target.name]: e.target.value }));
    };

    const handleClickNovoComunicado = () => {
        setIsModalOpen(true);
    }

    const handleSaveComunicado = async () => {
        setLoading(true);
        if (formData.title == '' || formData.description == '' || formData.creatorName == '' || formData.createdBy == '') {
            return notifyError('Existem campos em branco!')
        }
        else {
            const novoComunicado = await Comunicados_POST_create(formData)
            if (novoComunicado.message === 'OK') {
                notifySuccess("Comunicado criado com sucesso!")
                setFormData(emptyComunicado)
                setIsModalOpen(false)
                const mensagem = `*Novo Comunicado* \n\n larfelizidade.com.br/portal/comunicados/${novoComunicado.id}`
                await sendMessage('120363319721988791@g.us', mensagem)
            }
            else {
                notifyError('Falha ao criar novo comunicado.')
            }
        }
        setLoading(false);
    }

    // #####################
    // FUNCTIONS
    // #####################

    async function fetchPermission() {
        const uuserInfo = getUserDetails();
        setUserinfo(uuserInfo)
        setFormData((prevState) => ({ ...prevState, ['creatorName']: uuserInfo.nome, ['createdBy']: uuserInfo.id }));
    }

    async function fetchComunicados() {
        const getComunicados = await Comunicados_GET_getAll();
        const addRead = getComunicados.map((comunicado: Comunicado) => ({ ...comunicado, isRead: comunicado.readers && comunicado.readers?.some((item: any) => item.userId == getUserID()) }))
        setComunicados(addRead);
    }

    // #####################
    // EFFECTS
    // #####################

    useEffect(() => {
        async function fetchData() {
            await fetchPermission();
            await fetchComunicados();
        }

        fetchData();
    }, [])

    // #####################
    // RETURN 
    // #####################

    if (loading) {
        return (<LoadingSpinner />)
    }

    else {

        return (
            <PermissionWrapper href='' >
                <PortalBase>
                    <div className='col-span-full flex flex-col'>

                        {isAdmin && (
                            <div>
                                <Button_M3 label='Novo Comunicado' bgColor='blue' onClick={handleClickNovoComunicado} />
                            </div>
                        )}

                        <div className="grid grid-cols-12 gap-5 p-2 mt-4 justify-center text-lg font-serif">
                            {comunicados.length > 0 && comunicados.map((comunicado: any, index: number) => {
                                return (
                                    <Topic key={index} _id={comunicado._id} read={comunicado.isRead}
                                        title={slice3Points(comunicado.title, 15, 0)} description={slice3Points(comunicado.description, 25, 0)}
                                        href={`/portal/comunicados/${comunicado._id}`} date={formatDateBR(comunicado.createdAt)} />
                                )
                            })}
                        </div>

                        <Modalpadrao isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                            <div className='p-4 flex flex-col'>
                                <h1 className='text-xl font-bold'>Adicionar Novo Comunicado</h1>
                                <hr />
                                <form action="" className='mt-5 flex gap-4 flex-col'>
                                    <Text_M3 name='title' label='Título' value={formData.title} onChange={handleChange} disabled={false} />
                                    <Textarea_M3 name='description' label='Descrição' value={formData.description} onChange={handleChange} disabled={false} />
                                    <Button_M3 label='Salvar' bgColor='green' onClick={handleSaveComunicado} />
                                </form>
                            </div>
                        </Modalpadrao>

                    </div>
                </PortalBase>
            </PermissionWrapper>
        )
    }
}

export default Index

// #######################################
// #######################################
// #######################################
// #######################################
// #######################################

const Topic = ({ _id, read = false, title, description, href, date }: TopicProps) => {

    const isRead = read ? 'border-green-500' : 'border-red-500'
    return (
        <a id={_id} className={`bg-gray-100 flex-col text-black border-l-8 ${isRead} rounded-md px-3 py-2 col-span-full md:col-span-6 lg:col-span-4`} href={href} >
            <p className='text-right'>{date}</p>
            <p>{title}</p>
            <div className="text-gray-500 font-thin text-sm" >
                <span>{description}</span>
            </div >
        </a >
    )
}