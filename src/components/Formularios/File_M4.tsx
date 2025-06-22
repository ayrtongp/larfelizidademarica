import React, { useState } from 'react';
import { BsPlus } from 'react-icons/bs';
import LoadingSpinner from '../LoadingSpinner';
import { getUserDetails, notifyError, notifySuccess } from '@/utils/Functions';
import { Arquivos_POST_novoArquivo } from '@/actions/Arquivos';
import { uploadArquivoPasta } from '@/actions/DO_UploadFile';
import { InfoProps } from '@/types/Arquivos_InfoProps';
import Button_M3 from './Button_M3';
import { FaUpload } from 'react-icons/fa';

interface Props {
    infoProps: InfoProps;
    folders: string;
    triggerEffect: () => void
}

const File_M4 = ({ infoProps, folders, triggerEffect }: Props) => {
    const [file, setFile] = useState<any>(null);
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    const [loading, setLoading] = useState<boolean>(false);

    const handleFileChange = (e: any) => {
        document.getElementById('fileInput')?.click()
    };

    const handleUpload = async (e: any) => {
        setFile(e.target.files[0]);
        setLoading(true)
        if (fileInput.value != '') {
            const formData = new FormData();
            formData.append('file', file);
        }
        else {
            notifyError('Anexe um arquivo antes de clicar em enviar!')
        }
        setLoading(false)
    };

    const handleSalve = async () => {
        setLoading(true)
        const dadosUsuario = getUserDetails();
        try {
            if (file) {
                const response = await uploadArquivoPasta(file, folders, dadosUsuario.nome) as any;
                if (response.status === 'OK') {
                    const [successArquivo, resArquivo] = await Arquivos_POST_novoArquivo(infoProps, response);
                    if (successArquivo) {
                        notifySuccess("Upload realizado com sucesso.")
                        setFile(null)
                    }
                    else {
                        notifyError('Erro ao salvar no banco de dados')
                    }
                    // Clear the input field after successful upload
                    if (fileInput) { fileInput.value = ''; }
                    triggerEffect();
                }
                else {
                    notifyError('Erro ao realizar Upload')
                }
            }
        } catch {
            setLoading(false)

        }
        setLoading(false)
    }

    if (loading) {
        return (<LoadingSpinner />);
    }
    else {
        return (
            <div className=' flex flex-col gap-3 items-center'>
                <input id="fileInput" type="file" onChange={(e: any) => handleUpload(e)} className='hidden' />
                <div className='flex flex-row text-left w-full gap-4 items-center text-sm whitespace-nowrap'>
                    <FaUpload onClick={handleFileChange} size={24} color='blue' />
                    {file && (<span>{file.name}</span>)}
                    {!file && (<span>{'Nenhum arquivo selecionado'}</span>)}
                </div>
                <Button_M3 label='Salvar Arquivo' onClick={handleSalve} />
            </div>
        );
    }
};

export default File_M4;

const ProgressBar = ({ value }: any) => {
    return (
        <div className="bg-white rounded-lg w-72 border shadow block p-4">
            <div className="w-full h-4 bg-gray-400 rounded-full">
                <div className={`w-[${value}%] transition-all duration-150 h-full text-center text-xs text-white bg-violet-500 rounded-full`}>
                    {value + '%'}
                </div>
            </div>
        </div>
    )
}
