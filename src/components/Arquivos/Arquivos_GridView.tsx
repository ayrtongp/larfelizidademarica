import { I_Arquivo } from '@/types/Arquivos';
import { formatDateBRHora } from '@/utils/Functions';
import { useIsAdmin } from '@/hooks/useGroupsPermission';
import React, { useMemo, useState } from 'react';
import {
    FaArrowLeft, FaDownload, FaFile, FaFileExcel,
    FaFileImage, FaFilePdf, FaFileWord, FaFolder, FaTrash,
} from 'react-icons/fa';

interface Props {
    listaArquivos: I_Arquivo[];
    onDelete?: (id: string) => void;
}

function FileTypeIcon({ format }: { format: string }) {
    if (format.includes('pdf')) return <FaFilePdf size={40} className='text-red-500' />;
    if (format.includes('image')) return <FaFileImage size={40} className='text-green-500' />;
    if (format.includes('word') || format.includes('document')) return <FaFileWord size={40} className='text-blue-500' />;
    if (format.includes('sheet') || format.includes('excel')) return <FaFileExcel size={40} className='text-emerald-600' />;
    return <FaFile size={40} className='text-gray-400' />;
}

interface FileCardProps {
    arquivo: I_Arquivo;
    onDelete?: (id: string) => void;
    isAdmin: boolean;
}

function FileCard({ arquivo, onDelete, isAdmin }: FileCardProps) {
    return (
        <div className='flex flex-col items-center p-3 bg-white rounded-xl shadow border hover:shadow-md transition-all gap-1'>
            <FileTypeIcon format={arquivo.format} />
            <span className='text-xs text-center font-medium truncate w-full text-center mt-1' title={arquivo.descricao || arquivo.filename}>
                {arquivo.descricao || arquivo.filename}
            </span>
            <span className='text-xs text-gray-400'>
                {arquivo.createdAt ? formatDateBRHora(arquivo.createdAt) : ''}
            </span>
            <div className='flex gap-3 mt-1'>
                <FaDownload size={13} className='cursor-pointer text-blue-500 hover:text-blue-700'
                    onClick={() => window.open(arquivo.cloudURL, '_blank')} />
                {isAdmin && arquivo._id && (
                    <FaTrash size={13} className='cursor-pointer text-red-500 hover:text-red-700'
                        onClick={() => onDelete?.(arquivo._id!)} />
                )}
            </div>
        </div>
    );
}

const FOLDER_COLORS: Record<string, string> = {
    'Documentos': 'text-blue-400',
    'Exames': 'text-green-400',
    'Contratos': 'text-purple-400',
    'Receitas': 'text-yellow-400',
    'Laudos': 'text-orange-400',
    'Fotos': 'text-pink-400',
};

const Arquivos_GridView = ({ listaArquivos, onDelete }: Props) => {
    const isAdmin = useIsAdmin({ groups: ['administrativo'] });
    const [activeCat, setActiveCat] = useState<string | null>(null);

    const grouped = useMemo(() => {
        return listaArquivos.reduce((acc, arq) => {
            const cat = arq.categoria || 'Sem Categoria';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(arq);
            return acc;
        }, {} as Record<string, I_Arquivo[]>);
    }, [listaArquivos]);

    if (listaArquivos.length === 0) {
        return <p className='text-sm text-gray-400 text-center py-8'>Nenhum arquivo encontrado.</p>;
    }

    if (activeCat !== null) {
        const files = grouped[activeCat] ?? [];
        return (
            <div>
                <button
                    onClick={() => setActiveCat(null)}
                    className='flex items-center gap-2 text-indigo-500 hover:text-indigo-700 text-sm font-medium mb-4'
                >
                    <FaArrowLeft size={12} /> Voltar para pastas
                </button>
                <h2 className='font-semibold text-gray-700 mb-3'>{activeCat} <span className='text-gray-400 font-normal text-sm'>({files.length} arquivo{files.length !== 1 ? 's' : ''})</span></h2>
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'>
                    {files.map((arq) => (
                        <FileCard key={arq._id} arquivo={arq} onDelete={onDelete} isAdmin={isAdmin} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'>
            {Object.entries(grouped).map(([cat, files]) => {
                const folderColor = FOLDER_COLORS[cat] || 'text-yellow-400';
                return (
                    <div
                        key={cat}
                        onClick={() => setActiveCat(cat)}
                        className='flex flex-col items-center p-4 bg-white rounded-xl shadow cursor-pointer hover:bg-indigo-50 border-2 border-transparent hover:border-indigo-300 transition-all'
                    >
                        <FaFolder size={48} className={folderColor} />
                        <span className='text-sm font-semibold text-center truncate w-full text-center mt-2' title={cat}>{cat}</span>
                        <span className='text-xs text-gray-400 mt-1'>{files.length} arquivo{files.length !== 1 ? 's' : ''}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default Arquivos_GridView;
