import { I_Arquivo } from '@/types/Arquivos';
import { formatDateBRHora } from '@/utils/Functions';
import { useIsAdmin } from '@/hooks/useGroupsPermission';
import React from 'react'
import { FaDownload, FaTrash } from 'react-icons/fa';

interface Props {
    listaArquivos: I_Arquivo[];
    onDelete?: (id: string) => void;
}

const Tbl_ArquivosResidente = ({ listaArquivos, onDelete }: Props) => {
    const isAdmin = useIsAdmin({ groups: ['administrativo'] });

    return (
        <table className='min-w-full rounded-xl whitespace-nowrap'>
            <thead>
                <tr className='bg-gray-50 text-left text-sm leading-6 font-semibold text-gray-900 capitalize'>
                    <th scope='col' className='p-5 rounded-t-xl'>Data do Upload</th>
                    <th scope='col' className='p-5'>Descrição do Arquivo</th>
                    <th scope='col' className='p-5'>Usuário</th>
                    <th scope='col' className='p-5 rounded-t-xl'>Ações</th>
                </tr>
            </thead>
            <tbody className='divide-y divide-gray-300'>
                {listaArquivos.length > 0 && listaArquivos.map((arquivo: I_Arquivo, index: number) => (
                    <tr key={index} className='bg-white transition-all duration-500 hover:bg-gray-50 text-sm leading-6 font-medium text-gray-900'>
                        <td className='p-5'>{formatDateBRHora(arquivo.createdAt)}</td>
                        <td className='p-5'>{arquivo.descricao}</td>
                        <td className='p-5'>{arquivo.fullName}</td>
                        <td className='p-5'>
                            <div className='flex flex-row items-center gap-2'>
                                <FaDownload color='blue' className='cursor-pointer' onClick={() => window.open(arquivo.cloudURL, '_blank')} />
                                {isAdmin && arquivo._id && (
                                    <FaTrash color='red' className='cursor-pointer' onClick={() => onDelete?.(arquivo._id!)} />
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

export default Tbl_ArquivosResidente