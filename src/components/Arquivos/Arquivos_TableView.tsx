import { I_Arquivo } from '@/types/Arquivos';
import { formatDateBRHora } from '@/utils/Functions';
import { useIsAdmin } from '@/hooks/useGroupsPermission';
import React from 'react';
import { FaDownload, FaTrash } from 'react-icons/fa';

interface Props {
    listaArquivos: I_Arquivo[];
    onDelete?: (id: string) => void;
}

const CATEGORIA_COLORS: Record<string, string> = {
    'Documentos': 'bg-blue-100 text-blue-700',
    'Exames': 'bg-green-100 text-green-700',
    'Contratos': 'bg-purple-100 text-purple-700',
    'Receitas': 'bg-yellow-100 text-yellow-700',
    'Laudos': 'bg-orange-100 text-orange-700',
    'Fotos': 'bg-pink-100 text-pink-700',
};

function getFormatLabel(contentType: string): string {
    if (!contentType) return 'FILE';
    if (contentType.includes('pdf')) return 'PDF';
    if (contentType.includes('image')) return 'IMG';
    if (contentType.includes('word') || contentType.includes('document')) return 'DOC';
    if (contentType.includes('sheet') || contentType.includes('excel')) return 'XLS';
    return 'FILE';
}

const Arquivos_TableView = ({ listaArquivos, onDelete }: Props) => {
    const isAdmin = useIsAdmin({ groups: ['administrativo'] });

    return (
        <div className='overflow-x-auto'>
            <table className='min-w-full rounded-xl whitespace-nowrap'>
                <thead>
                    <tr className='bg-gray-50 text-left text-sm leading-6 font-semibold text-gray-900 capitalize'>
                        <th scope='col' className='p-5 rounded-tl-xl'>Data do Upload</th>
                        <th scope='col' className='p-5'>Descrição</th>
                        <th scope='col' className='p-5'>Categoria</th>
                        <th scope='col' className='p-5'>Tipo</th>
                        <th scope='col' className='p-5'>Usuário</th>
                        <th scope='col' className='p-5 rounded-tr-xl'>Ações</th>
                    </tr>
                </thead>
                <tbody className='divide-y divide-gray-300'>
                    {listaArquivos.length === 0 && (
                        <tr>
                            <td colSpan={6} className='p-5 text-center text-sm text-gray-400'>Nenhum arquivo encontrado.</td>
                        </tr>
                    )}
                    {listaArquivos.map((arquivo: I_Arquivo, index: number) => {
                        const cat = arquivo.categoria || '';
                        const catColor = CATEGORIA_COLORS[cat] || 'bg-gray-100 text-gray-600';
                        const fmtLabel = getFormatLabel(arquivo.format);
                        return (
                            <tr key={index} className='bg-white transition-all duration-500 hover:bg-gray-50 text-sm leading-6 font-medium text-gray-900'>
                                <td className='p-5'>{formatDateBRHora(arquivo.createdAt)}</td>
                                <td className='p-5 max-w-[200px] truncate' title={arquivo.descricao}>{arquivo.descricao}</td>
                                <td className='p-5'>
                                    {cat ? (
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${catColor}`}>{cat}</span>
                                    ) : (
                                        <span className='text-gray-300 text-xs'>—</span>
                                    )}
                                </td>
                                <td className='p-5'>
                                    <span className='px-2 py-1 rounded text-xs font-mono bg-gray-100 text-gray-600'>{fmtLabel}</span>
                                </td>
                                <td className='p-5'>{arquivo.fullName}</td>
                                <td className='p-5'>
                                    <div className='flex flex-row items-center gap-3'>
                                        <FaDownload color='blue' className='cursor-pointer' onClick={() => window.open(arquivo.cloudURL, '_blank')} />
                                        {isAdmin && arquivo._id && (
                                            <FaTrash color='red' className='cursor-pointer' onClick={() => onDelete?.(arquivo._id!)} />
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default Arquivos_TableView;
