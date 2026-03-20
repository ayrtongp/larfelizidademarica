import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { I_Arquivo } from '@/types/Arquivos';
import { notifyError, notifySuccess } from '@/utils/Functions';
import Button_M3 from '@/components/Formularios/Button_M3';
import TextInputM2 from '@/components/Formularios/TextInputM2';

import File_M4 from '@/components/Formularios/File_M4';
import Modalpadrao from '@/components/ModalPadrao';
import Arquivos_TableView from './Arquivos_TableView';
import Arquivos_GridView from './Arquivos_GridView';
import { FaList, FaTh } from 'react-icons/fa';

const EXPRESS_URL = process.env.NEXT_PUBLIC_URLDO ?? "https://lobster-app-gbru2.ondigitalocean.app";

const CATEGORIAS = [
    { value: 'Documentos', label: 'Documentos' },
    { value: 'Exames', label: 'Exames' },
    { value: 'Contratos', label: 'Contratos' },
    { value: 'Receitas', label: 'Receitas' },
    { value: 'Laudos', label: 'Laudos' },
    { value: 'Fotos', label: 'Fotos' },
    { value: 'Outros', label: 'Outros' },
];

interface Props {
    /** ID do usuário/residente — usado como folder no R2 e como userId no MongoDB */
    entityId: string;
    entityName: string;
}

const GestaoArquivos = ({ entityId, entityName }: Props) => {
    const residenteId = entityId; // alias interno enquanto migração não ocorre
    const [listaArquivos, setListaArquivos] = useState<I_Arquivo[]>([]);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [categoriaFilter, setCategoriaFilter] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [uploadCategoria, setUploadCategoria] = useState('');
    const [descricao, setDescricao] = useState('');
    const [triggerRefresh, setTriggerRefresh] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    async function fetchArquivos(searchTerm: string) {
        const params = new URLSearchParams({ folder: residenteId });
        if (searchTerm.trim()) params.set('search', searchTerm.trim());
        const res = await fetch(`/api/Controller/ArquivosAdmin.ctrl?${params}`);
        const data = await res.json();
        setListaArquivos(data?.arquivos ?? []);
    }

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchArquivos(search);
        }, 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [search, triggerRefresh, residenteId]);

    async function handleDelete(id: string) {
        if (!confirm('Deseja excluir este arquivo? Esta ação não pode ser desfeita.')) return;
        try {
            const res = await fetch(`${EXPRESS_URL}/r2_files/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                notifyError(data.error || 'Erro ao excluir arquivo.');
                return;
            }
            notifySuccess('Arquivo excluído com sucesso.');
            setTriggerRefresh(prev => !prev);
        } catch {
            notifyError('Falha ao excluir arquivo.');
        }
    }

    function handleUploadSuccess() {
        setDescricao('');
        setUploadCategoria('');
        setModalOpen(false);
        setTriggerRefresh(prev => !prev);
    }

    const categorias: string[] = useMemo(
        () => [...new Set(listaArquivos.map(a => a.categoria || 'Sem Categoria'))],
        [listaArquivos]
    );

    const arquivosFiltrados: I_Arquivo[] = useMemo(
        () => categoriaFilter
            ? listaArquivos.filter(a => (a.categoria || 'Sem Categoria') === categoriaFilter)
            : listaArquivos,
        [listaArquivos, categoriaFilter]
    );

    const extraFields: Record<string, string> = {
        collection: "arquivos",
        resource: "arquivos",
        userId: residenteId,
        folder: residenteId,
        isPublic: "true",
        ...(uploadCategoria ? { tags: uploadCategoria } : {}),
        ...(descricao ? { descricao } : {}),
    };

    return (
        <div className='flex flex-col gap-4 bg-white rounded-xl shadow p-4'>

            {/* Toolbar */}
            <div className='flex flex-wrap items-start gap-3'>
                {/* Busca */}
                <div className='relative'>
                    <input
                        type='text'
                        value={search}
                        onChange={e => { setSearch(e.target.value); setCategoriaFilter(null); }}
                        placeholder='Buscar arquivos...'
                        className='border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 w-56'
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className='absolute right-2 top-2 text-gray-400 hover:text-gray-600 text-xs'
                        >✕</button>
                    )}
                </div>

                {/* Chips de categoria */}
                <div className='flex flex-wrap gap-2'>
                    <button
                        onClick={() => setCategoriaFilter(null)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${!categoriaFilter ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300'}`}
                    >
                        Todos ({listaArquivos.length})
                    </button>
                    {categorias.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoriaFilter(cat === categoriaFilter ? null : cat)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${categoriaFilter === cat ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Lado direito */}
                <div className='flex items-center gap-2 ml-auto'>
                    <button
                        onClick={() => setViewMode(v => v === 'table' ? 'grid' : 'table')}
                        title={viewMode === 'table' ? 'Vista em grade' : 'Vista em tabela'}
                        className='p-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 transition-all'
                    >
                        {viewMode === 'table' ? <FaTh size={16} /> : <FaList size={16} />}
                    </button>
                    <Button_M3 label='Novo Arquivo' onClick={() => setModalOpen(true)} />
                </div>
            </div>

            {/* Lista */}
            {viewMode === 'table'
                ? <Arquivos_TableView listaArquivos={arquivosFiltrados} onDelete={handleDelete} />
                : <Arquivos_GridView listaArquivos={arquivosFiltrados} onDelete={handleDelete} />
            }

            {/* Modal de upload */}
            <Modalpadrao isOpen={modalOpen} onClose={() => setModalOpen(false)}>
                <div className='p-5 flex flex-col gap-4'>
                    <h1 className='text-2xl font-semibold italic text-center'>
                        Adicionar arquivo para {entityName}
                    </h1>
                    <TextInputM2
                        disabled={false}
                        label='Descrição do Arquivo'
                        name='descricao'
                        onChange={e => setDescricao(e.target.value)}
                        value={descricao}
                    />
                    <div className='flex flex-col gap-1'>
                        <span className='text-xs font-bold pl-1'>Categoria</span>
                        <div className='flex flex-wrap gap-2'>
                            {CATEGORIAS.map(cat => (
                                <button
                                    key={cat.value}
                                    type='button'
                                    onClick={() => setUploadCategoria(v => v === cat.value ? '' : cat.value)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                        uploadCategoria === cat.value
                                            ? 'bg-indigo-500 text-white border-indigo-500'
                                            : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {residenteId && (
                        <File_M4
                            folders={`public/usuario/${residenteId}/arquivos`}
                            infoProps={{ dbName: 'usuarios', residenteId, descricao }}
                            triggerEffect={handleUploadSuccess}
                            uploadUrl={process.env.NEXT_PUBLIC_UPLOAD_URL ?? "https://lobster-app-gbru2.ondigitalocean.app/r2_upload"}
                            extraFields={extraFields}
                        />
                    )}
                </div>
            </Modalpadrao>

        </div>
    );
};

export default GestaoArquivos;
