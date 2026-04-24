import { I_Arquivo } from '@/types/Arquivos';
import { formatDateBRHora } from '@/utils/Functions';
import { useIsAdmin } from '@/hooks/useGroupsPermission';
import { getUserID } from '@/utils/Login';
import React, { useState } from 'react';
import { FaDownload, FaTrash, FaCalendarAlt, FaUserCircle, FaPen, FaCheck, FaTimes } from 'react-icons/fa';

interface Props {
    listaArquivos: I_Arquivo[];
    onDelete?: (id: string) => void;
    onRefresh?: () => void;
}

const CATEGORIAS = ['Documentos', 'Exames', 'Contratos', 'Receitas', 'Laudos', 'Fotos', 'Outros'];

const CATEGORIA_COLORS: Record<string, string> = {
    'Documentos': 'bg-blue-100 text-blue-700',
    'Exames':     'bg-green-100 text-green-700',
    'Contratos':  'bg-purple-100 text-purple-700',
    'Receitas':   'bg-yellow-100 text-yellow-800',
    'Laudos':     'bg-orange-100 text-orange-700',
    'Fotos':      'bg-pink-100 text-pink-700',
    'Outros':     'bg-gray-100 text-gray-600',
};

const FORMAT_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
    PDF:  { label: 'PDF',  bg: 'bg-red-100',   text: 'text-red-700' },
    IMG:  { label: 'IMG',  bg: 'bg-pink-100',  text: 'text-pink-700' },
    DOC:  { label: 'DOC',  bg: 'bg-blue-100',  text: 'text-blue-700' },
    XLS:  { label: 'XLS',  bg: 'bg-green-100', text: 'text-green-700' },
    FILE: { label: 'FILE', bg: 'bg-gray-100',  text: 'text-gray-600' },
};

function getFormatKey(contentType: string): string {
    if (!contentType) return 'FILE';
    if (contentType.includes('pdf'))                                      return 'PDF';
    if (contentType.includes('image'))                                    return 'IMG';
    if (contentType.includes('word') || contentType.includes('document')) return 'DOC';
    if (contentType.includes('sheet') || contentType.includes('excel'))   return 'XLS';
    return 'FILE';
}

interface EditState {
    descricao: string;
    categoria: string;
    saving: boolean;
}

const Arquivos_TableView = ({ listaArquivos, onDelete, onRefresh }: Props) => {
    const isAdmin = useIsAdmin({ groups: ['administrativo'] });
    const [editing, setEditing] = useState<Record<string, EditState>>({});

    function startEdit(arquivo: I_Arquivo) {
        setEditing(prev => ({
            ...prev,
            [arquivo._id!]: {
                descricao: arquivo.descricao !== arquivo.filename ? (arquivo.descricao || '') : '',
                categoria: arquivo.categoria || '',
                saving: false,
            },
        }));
    }

    function cancelEdit(id: string) {
        setEditing(prev => { const n = { ...prev }; delete n[id]; return n; });
    }

    async function saveEdit(id: string) {
        const state = editing[id];
        if (!state) return;

        setEditing(prev => ({ ...prev, [id]: { ...prev[id], saving: true } }));

        try {
            const res = await fetch(`/api/Controller/ArquivosAdmin.ctrl?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    descricao: state.descricao,
                    categoria: state.categoria,
                    realizadoPor: getUserID(),
                }),
            });

            if (res.ok) {
                cancelEdit(id);
                onRefresh?.();
            }
        } finally {
            setEditing(prev => prev[id] ? { ...prev, [id]: { ...prev[id], saving: false } } : prev);
        }
    }

    if (listaArquivos.length === 0) {
        return (
            <div className="py-12 text-center">
                <p className="text-sm text-gray-400">Nenhum arquivo encontrado.</p>
            </div>
        );
    }

    return (
        <ul className="divide-y divide-gray-100">
            {listaArquivos.map((arquivo, index) => {
                const id       = arquivo._id!;
                const isEdit   = !!editing[id];
                const state    = editing[id];
                const cat      = arquivo.categoria || '';
                const catColor = CATEGORIA_COLORS[cat] || 'bg-gray-100 text-gray-600';
                const fmtKey   = getFormatKey(arquivo.format);
                const fmt      = FORMAT_CONFIG[fmtKey];

                return (
                    <li key={id ?? index} className="flex items-start gap-4 px-1 py-3 hover:bg-gray-50 rounded-lg transition-colors group">

                        {/* Ícone de formato */}
                        <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold mt-0.5 ${fmt.bg} ${fmt.text}`}>
                            {fmt.label}
                        </div>

                        {/* Info / formulário de edição */}
                        <div className="min-w-0 flex-1">
                            {isEdit ? (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={state.descricao}
                                        onChange={e => setEditing(prev => ({ ...prev, [id]: { ...prev[id], descricao: e.target.value } }))}
                                        placeholder="Descrição do arquivo"
                                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                        autoFocus
                                    />
                                    <div className="flex flex-wrap gap-1.5">
                                        {CATEGORIAS.map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setEditing(prev => ({ ...prev, [id]: { ...prev[id], categoria: c === state.categoria ? '' : c } }))}
                                                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                                                    state.categoria === c
                                                        ? 'bg-indigo-500 text-white border-indigo-500'
                                                        : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300'
                                                }`}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {arquivo.descricao && arquivo.descricao !== arquivo.filename && (
                                        <p className="text-sm font-medium text-gray-800 truncate" title={arquivo.descricao}>
                                            {arquivo.descricao}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500 truncate" title={arquivo.filename}>
                                        {arquivo.filename || '—'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                        {cat && (
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${catColor}`}>
                                                {cat}
                                            </span>
                                        )}
                                        <span title="Data do upload" className="flex items-center gap-1 text-[11px] text-gray-400 cursor-default">
                                            <FaCalendarAlt size={9} />
                                            {formatDateBRHora(arquivo.createdAt)}
                                        </span>
                                        {arquivo.fullName && (
                                            <span title="Enviado por" className="flex items-center gap-1 text-[11px] text-gray-400 cursor-default">
                                                <FaUserCircle size={10} />
                                                {arquivo.fullName}
                                            </span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Ações */}
                        <div className="shrink-0 flex items-center gap-1.5 mt-0.5">
                            {isEdit ? (
                                <>
                                    <button
                                        onClick={() => saveEdit(id)}
                                        disabled={state.saving}
                                        title="Salvar"
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-40"
                                    >
                                        <FaCheck size={11} />
                                    </button>
                                    <button
                                        onClick={() => cancelEdit(id)}
                                        title="Cancelar"
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                                    >
                                        <FaTimes size={11} />
                                    </button>
                                </>
                            ) : (
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => startEdit(arquivo)}
                                        title="Editar"
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
                                    >
                                        <FaPen size={11} />
                                    </button>
                                    <button
                                        onClick={() => window.open(arquivo.cloudURL, '_blank')}
                                        title="Baixar"
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                    >
                                        <FaDownload size={11} />
                                    </button>
                                    {isAdmin && arquivo._id && (
                                        <button
                                            onClick={() => onDelete?.(arquivo._id!)}
                                            title="Excluir"
                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                        >
                                            <FaTrash size={11} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};

export default Arquivos_TableView;
