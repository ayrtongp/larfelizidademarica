import React, { useEffect, useState } from 'react'
import Button_M3 from '../Formularios/Button_M3'
import Tbl_ArquivosResidente from '../Tabelas/Tbl_ArquivosResidente'
import Modalpadrao from '../ModalPadrao'
import TextInputM2 from '../Formularios/TextInputM2'
import File_M4 from '../Formularios/File_M4'
import { InfoProps } from '@/types/Arquivos_InfoProps'
import { notifyError } from '@/utils/Functions'
import { Arquivos_GET_getBydbNameAndId } from '@/actions/Arquivos'
import { I_Arquivo } from '@/types/Arquivos'

interface Props {
    residenteData: any;
}

const Residente_Files = ({ residenteData }: Props) => {
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [infoProps, setInfoProps] = useState<InfoProps>({ dbName: 'residentes', residenteId: residenteData._id, descricao: '' })
    const [listaArquivos, setListaArquivos] = useState<I_Arquivo[]>([]);
    const [triggerEffect, setTriggerEffect] = useState<boolean>(false);

    // ---------------------
    // FUNCTIONS
    // ---------------------

    // ---------------------
    // HANDLERS
    // ---------------------

    const handleChange = (e: any) => {
        setInfoProps((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value
        }));
    };

    const handleTriggerEffect = () => {
        setInfoProps((prevState) => ({
            ...prevState,
            ['descricao']: ''
        }));
        setModalOpen(false)
        setTriggerEffect(!triggerEffect)
    }


    // ---------------------
    // FUNCTIONS
    // ---------------------

    async function getArquivosResidente() {
        const result = await Arquivos_GET_getBydbNameAndId('residentes', residenteData._id)
        setListaArquivos(result)
    }

    // ---------------------
    // USEEFFECT
    // ---------------------

    useEffect(() => {
        setInfoProps((prevState) => ({ ...prevState, ['residenteId']: residenteData._id }));
        getArquivosResidente()
    }, [residenteData, triggerEffect])

    // ---------------------
    // RETURN
    // ---------------------

    return (
        <div className='flex flex-col gap-3'>

            <div>
                <Button_M3 label='Novo Arquivo' onClick={() => setModalOpen(true)} />
            </div>

            <div className='overflow-x-auto'>
                <Tbl_ArquivosResidente listaArquivos={listaArquivos} />
            </div>

            <Modalpadrao isOpen={modalOpen} onClose={() => setModalOpen(false)}>
                {residenteData && (
                    <div className='p-5 flex flex-col gap-4'>
                        <h1 className='text-2xl font-semibold italic text-center'>Adicionar arquivo para {residenteData.apelido} </h1>
                        <TextInputM2 disabled={false} label='Descrição do Arquivo' name='descricao' onChange={handleChange} value={infoProps.descricao} />
                        {residenteData._id && (
                            <File_M4 folders={`larfelizidade/residentes/${residenteData._id}`} infoProps={infoProps} triggerEffect={handleTriggerEffect} />
                        )}
                    </div>
                )}
            </Modalpadrao>

        </div>
    )
}

export default Residente_Files