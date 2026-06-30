import { Residentes_GET_getAllActive } from '@/actions/Residentes'
import Button_M3 from '@/components/Formularios/Button_M3'
import Date_M3 from '@/components/Formularios/Date_M3'
import Number_M3 from '@/components/Formularios/Number_M3'
import RichReadOnly_M3 from '@/components/Formularios/RichReadOnly_M3'
import RichText_M3 from '@/components/Formularios/RichTextArea_M3'
import Select_M3 from '@/components/Formularios/Select_M3'
import Textarea_M3 from '@/components/Formularios/TextArea_M3'
import TextInputM2 from '@/components/Formularios/TextInputM2'
import HumanBodyImage from '@/components/HumanBodyImage'
import Modalpadrao from '@/components/ModalPadrao'
import PermissionWrapper from '@/components/PermissionWrapper'
import PortalBase from '@/components/Portal/PortalBase'
import { useLoadingOverlay } from '@/context/LoadingOverlayContext'
import {
    Lesao, FERIDA_TYPE_OPTIONS, validarLesao, VISTA_TYPE_OPTIONS,
    LESAO_STATUS_OPTIONS, validarUpdateStatus, Comentario
} from '@/models/lesoes.model'
import { sendMessage } from '@/pages/api/WhatsApp'
import { createLesao, getLesoes, updateLesao } from '@/services/lesoes.svc'
import {
    formatDateBR, formatDateBRHora, getCurrentDateTime, getUserDetails,
    isComentarioVazio, notifyError, notifySuccess
} from '@/utils/Functions'
import { getUserID } from '@/utils/Login'
import React, { ChangeEvent, useEffect, useState } from 'react'
import { FaPlus, FaList, FaMapMarkerAlt, FaExclamationCircle, FaCommentAlt } from 'react-icons/fa'

// ─── helpers ────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
    iniciada: 'bg-slate-100 text-slate-700 border-slate-200',
    em_investigacao: 'bg-amber-50 text-amber-700 border-amber-200',
    em_tratamento: 'bg-blue-50 text-blue-700 border-blue-200',
    curada: 'bg-green-50 text-green-700 border-green-200',
    infectada: 'bg-red-50 text-red-700 border-red-200',
    encerrada: 'bg-gray-100 text-gray-500 border-gray-200',
    cancelada: 'bg-rose-50 text-rose-600 border-rose-200',
};

const statusBadge = (status: string) =>
    `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_BADGE[status] ?? STATUS_BADGE.encerrada}`;

const getTipoLabel = (value: string) =>
    FERIDA_TYPE_OPTIONS.find(o => o.value === value)?.label ?? value;

const getVistaLabel = (value: string) =>
    VISTA_TYPE_OPTIONS.find(v => v.value === value)?.label ?? value;

const getStatusLabel = (value: string) =>
    LESAO_STATUS_OPTIONS.find(o => o.value === value)?.label ?? value;

// ─── component ──────────────────────────────────────────────────────────────

const buildInitialState = (): Lesao => ({
    _id: '',
    vista: 'frente',
    regiaoCorpo: '',
    dataLesao: '',
    descricao: '',
    userId: '',
    userName: '',
    createdBy: typeof window !== 'undefined' ? getUserID() : '',
    createdByName: typeof window !== 'undefined' ? (getUserDetails()?.nome ?? '') : '',
    tipoLesao: '',
    xPos: 0,
    yPos: 0,
    riscoInfeccao: 0,
    nivelDor: 0,
    status: 'iniciada',
    comentarios: [],
    createdAt: getCurrentDateTime(),
    updatedAt: getCurrentDateTime(),
});

type PageView = '' | 'nova-lesao' | 'tabela-lesoes';

const Index = () => {
    const [type, setType] = useState<PageView>('');
    const [formData, setFormData] = useState<Lesao>(buildInitialState);
    const [formErrors, setFormErrors] = useState<string[]>([]);
    const [listaResidentes, setListaResidentes] = useState<any[]>([]);
    const [listaLesoes, setListaLesoes] = useState<Lesao[]>([]);
    const [selectedLesao, setSelectedLesao] = useState<Lesao | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [novoComentario, setNovoComentario] = useState('');
    const [updateStatusLesao, setUpdateStatusLesao] = useState<any>({ status: '', lesaoId: '', updatedAt: '' });
    const { showLoading, hideLoading } = useLoadingOverlay();

    // ── handlers ──────────────────────────────────────────────────────────

    const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'userId') {
            const residente = listaResidentes.find(r => r._id === value);
            setFormData(prev => ({ ...prev, userId: value, userName: residente?.nome ?? '' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleBodyClick = (data: any) => {
        setFormData(prev => ({
            ...prev,
            regiaoCorpo: data.bodyPart,
            xPos: data.x,
            yPos: data.y,
            vista: data.viewOption,
        }));
    };

    const handleSave = async (e: any) => {
        e.preventDefault();
        showLoading();
        const { valido, erros } = validarLesao(formData);
        if (!valido) {
            setFormErrors(erros);
            notifyError('Erros de validação encontrados.');
            hideLoading();
            return;
        }
        const response = await createLesao(formData);
        if (!response.success) {
            notifyError('Erro ao salvar lesão.');
            hideLoading();
            return;
        }
        notifySuccess('Lesão salva com sucesso!');
        const nomeIdoso = listaResidentes.find(r => r._id === formData.userId);
        const mensagem = `*Nova Lesão Cadastrada* \n\nIdoso: ${nomeIdoso?.apelido} \nTipo de Lesão: ${getTipoLabel(formData.tipoLesao)} \nData da Lesão: ${formatDateBR(formData.dataLesao)} \n\nlarfelizidade.com.br/portal/servicos/lesoes`;
        const wppTo = process.env.NEXT_PUBLIC_WPP_GRUPO_PRINCIPAL as string;
        await sendMessage(wppTo, mensagem);
        setFormData(buildInitialState());
        setFormErrors([]);
        hideLoading();
    };

    const handleClear = () => {
        setFormData(buildInitialState());
        setFormErrors([]);
    };

    const handleRowClick = (lesao: Lesao) => {
        setSelectedLesao(lesao);
        setIsModalOpen(true);
        setUpdateStatusLesao({ status: lesao.status, lesaoId: lesao._id, updatedAt: '' });
    };

    const handleChangeStatus = (e: any) => {
        if (!selectedLesao) return;
        setUpdateStatusLesao({ status: e.target.value, lesaoId: selectedLesao._id, updatedAt: getCurrentDateTime() });
    };

    const handleUpdateStatus = async () => {
        if (!selectedLesao || !updateStatusLesao.status || !updateStatusLesao.lesaoId) return;
        showLoading();
        try {
            const { valido } = validarUpdateStatus(updateStatusLesao.status);
            if (!valido) { notifyError('Status inválido.'); return; }
            const response = await updateLesao(updateStatusLesao.lesaoId, { status: updateStatusLesao.status });
            if (response?.success) {
                notifySuccess(`Status atualizado para "${getStatusLabel(updateStatusLesao.status)}".`);
                setSelectedLesao(prev => prev ? { ...prev, status: updateStatusLesao.status } : prev);
                setListaLesoes(prev => prev.map(l => l._id === selectedLesao._id ? { ...l, status: updateStatusLesao.status } : l));
            } else {
                notifyError(response?.message ?? 'Erro ao atualizar status.');
            }
        } catch {
            notifyError('Erro ao atualizar status da lesão.');
        } finally {
            hideLoading();
        }
    };

    const handleAddComentario = async () => {
        if (!selectedLesao || isComentarioVazio(novoComentario) || !novoComentario.trim()) return;
        showLoading();
        try {
            const comentario: Comentario = {
                userName: getUserDetails().nome,
                userId: getUserID(),
                content: novoComentario,
                createdAt: getCurrentDateTime(),
            };
            const response = await updateLesao(selectedLesao._id!, {
                comentarios: [...selectedLesao.comentarios, comentario],
            });
            if (response?.success) {
                notifySuccess('Comentário adicionado.');
                setSelectedLesao(prev => prev ? { ...prev, comentarios: [...prev.comentarios, comentario] } : prev);
                setListaLesoes(prev => prev.map(l => l._id === selectedLesao._id ? { ...l, comentarios: [...l.comentarios, comentario] } : l));
                setNovoComentario('');
            } else {
                notifyError(response?.message ?? 'Erro ao adicionar comentário.');
            }
        } catch {
            notifyError('Erro ao adicionar comentário.');
        } finally {
            hideLoading();
        }
    };

    // ── effects ───────────────────────────────────────────────────────────

    useEffect(() => {
        const fetchData = async () => {
            showLoading();
            try {
                if (type === 'nova-lesao') {
                    const res = await Residentes_GET_getAllActive();
                    setListaResidentes(res);
                } else if (type === 'tabela-lesoes') {
                    const res: any = await getLesoes();
                    setListaLesoes(res.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                hideLoading();
            }
        };
        if (type) fetchData();
    }, [type]);

    // ── active lesoes ─────────────────────────────────────────────────────

    const lesoesAtivas = listaLesoes.filter(
        l => l.status !== 'cancelada' && l.status !== 'encerrada'
    );

    // ── render ────────────────────────────────────────────────────────────

    return (
        <PermissionWrapper href='/portal'>
            <PortalBase>
                <div className="col-span-full w-full max-w-6xl mx-auto px-1 pb-8">

                    {/* Page header */}
                    <div className="mb-5">
                        <h1 className="text-xl font-bold text-gray-800">Gestão de Lesões</h1>
                        <p className="text-gray-400 text-sm">Registro e acompanhamento de feridas e lesões dos residentes</p>
                    </div>

                    {/* Navigation */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setType('nova-lesao')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${type === 'nova-lesao'
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                                }`}
                        >
                            <FaPlus className="text-xs" />
                            Nova Lesão
                        </button>
                        <button
                            onClick={() => setType('tabela-lesoes')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${type === 'tabela-lesoes'
                                ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-600'
                                }`}
                        >
                            <FaList className="text-xs" />
                            Ver Lesões
                        </button>
                    </div>

                    {/* ── Nova Lesão ───────────────────────────────────────────────── */}
                    {type === 'nova-lesao' && (
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                            {/* Corpo humano */}
                            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                <div className="flex items-center gap-2 mb-5">
                                    <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">1</span>
                                    <h3 className="font-semibold text-gray-700">Localização da Ferida</h3>
                                </div>

                                <HumanBodyImage
                                    imageSide={formData.vista}
                                    onClickData={handleBodyClick}
                                />

                                {formData.regiaoCorpo && (
                                    <div className="mt-4 flex justify-center">
                                        <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-medium border border-indigo-100">
                                            <FaMapMarkerAlt className="text-xs" />
                                            {formData.regiaoCorpo}
                                            <span className="text-indigo-300">·</span>
                                            {getVistaLabel(formData.vista)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Dados clínicos */}
                            <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                <div className="flex items-center gap-2 mb-5">
                                    <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">2</span>
                                    <h3 className="font-semibold text-gray-700">Dados Clínicos</h3>
                                </div>

                                <form className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <TextInputM2
                                        name='regiaoCorpo'
                                        label='Região do Corpo'
                                        value={formData.regiaoCorpo || ''}
                                        onChange={() => null}
                                        disabled
                                    />
                                    <Select_M3
                                        name='tipoLesao'
                                        label='Tipo de Lesão'
                                        value={formData.tipoLesao || ''}
                                        onChange={handleSelect}
                                        options={FERIDA_TYPE_OPTIONS}
                                    />
                                    <Date_M3
                                        disabled={false}
                                        name='dataLesao'
                                        label='Data da Lesão'
                                        value={formData.dataLesao || ''}
                                        onChange={handleChange}
                                    />
                                    <Select_M3
                                        name='userId'
                                        label='Residente'
                                        value={formData.userId || ''}
                                        onChange={handleSelect}
                                        options={listaResidentes.map(r => ({ value: r._id, label: r.nome }))}
                                    />
                                    <Number_M3
                                        disabled={false}
                                        name='riscoInfeccao'
                                        label='Risco de Infecção (1–10)'
                                        value={formData.riscoInfeccao || 0}
                                        onChange={handleChange}
                                        maxValue={10}
                                    />
                                    <Number_M3
                                        disabled={false}
                                        name='nivelDor'
                                        label='Nível de Dor (1–10)'
                                        value={formData.nivelDor || 0}
                                        onChange={handleChange}
                                        maxValue={10}
                                    />
                                    <Textarea_M3
                                        name='descricao'
                                        label='Descrição'
                                        value={formData.descricao || ''}
                                        onChange={handleChange}
                                        className='sm:col-span-2'
                                    />

                                    {formErrors.length > 0 && (
                                        <div className="sm:col-span-2 bg-red-50 border border-red-100 rounded-lg p-3">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <FaExclamationCircle className="text-red-500 text-sm" />
                                                <p className="text-red-700 font-semibold text-sm">Corrija os erros abaixo:</p>
                                            </div>
                                            <ul className="list-disc list-inside text-red-600 text-sm space-y-0.5 pl-1">
                                                {formErrors.map((e, i) => <li key={i}>{e}</li>)}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="sm:col-span-2 flex justify-end gap-3 pt-2 border-t border-gray-50">
                                        <Button_M3 type='button' label='Limpar' bgColor='gray' onClick={handleClear} />
                                        <Button_M3 type='button' label='Salvar Lesão' onClick={handleSave} />
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* ── Tabela de Lesões ─────────────────────────────────────────── */}
                    {type === 'tabela-lesoes' && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="font-semibold text-gray-700">Lesões Ativas</h3>
                                <span className="text-sm text-gray-400 font-medium">{lesoesAtivas.length} registro{lesoesAtivas.length !== 1 ? 's' : ''}</span>
                            </div>

                            {lesoesAtivas.length === 0 ? (
                                <div className="py-16 text-center text-gray-400">
                                    <p className="font-medium">Nenhuma lesão ativa encontrada</p>
                                    <p className="text-sm mt-1">Clique em &quot;Nova Lesão&quot; para registrar.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider">
                                            <tr>
                                                <th className="px-5 py-3 text-left font-semibold">Residente</th>
                                                <th className="px-5 py-3 text-left font-semibold">Tipo de Lesão</th>
                                                <th className="px-5 py-3 text-left font-semibold">Região</th>
                                                <th className="px-5 py-3 text-left font-semibold">Status</th>
                                                <th className="px-5 py-3 text-left font-semibold">Data</th>
                                                <th className="px-5 py-3 text-center font-semibold">
                                                    <FaCommentAlt className="inline" />
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {lesoesAtivas.map((lesao, i) => (
                                                <tr
                                                    key={lesao._id || i}
                                                    onClick={() => handleRowClick(lesao)}
                                                    className="hover:bg-indigo-50 cursor-pointer transition-colors duration-100"
                                                >
                                                    <td className="px-5 py-3.5 font-medium text-gray-800">{lesao.userName}</td>
                                                    <td className="px-5 py-3.5 text-gray-600">{getTipoLabel(lesao.tipoLesao)}</td>
                                                    <td className="px-5 py-3.5 text-gray-500 text-xs">{lesao.regiaoCorpo} · {getVistaLabel(lesao.vista)}</td>
                                                    <td className="px-5 py-3.5">
                                                        <span className={statusBadge(lesao.status)}>
                                                            {getStatusLabel(lesao.status)}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-gray-400 text-xs">{formatDateBR(lesao.dataLesao)}</td>
                                                    <td className="px-5 py-3.5 text-center">
                                                        <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-500 rounded-full text-xs font-bold">
                                                            {lesao.comentarios.length}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Modal de Detalhes ─────────────────────────────────────────── */}
                <Modalpadrao isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    {selectedLesao && (
                        <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">

                            {/* Header */}
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">{selectedLesao.userName}</h3>
                                    <p className="text-gray-400 text-sm mt-0.5">
                                        {getTipoLabel(selectedLesao.tipoLesao)} · {formatDateBR(selectedLesao.dataLesao)}
                                    </p>
                                </div>
                                <span className={statusBadge(selectedLesao.status)}>
                                    {getStatusLabel(selectedLesao.status)}
                                </span>
                            </div>

                            {/* Body image + info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-center">
                                    <HumanBodyImage
                                        imageSide={selectedLesao.vista}
                                        xPos={selectedLesao.xPos}
                                        yPos={selectedLesao.yPos}
                                        viewOnly={true}
                                    />
                                </div>

                                <div className="flex flex-col gap-2 justify-center">
                                    {[
                                        { label: 'Região', value: selectedLesao.regiaoCorpo },
                                        { label: 'Vista', value: getVistaLabel(selectedLesao.vista) },
                                        { label: 'Risco de Infecção', value: `${selectedLesao.riscoInfeccao} / 10` },
                                        { label: 'Nível de Dor', value: `${selectedLesao.nivelDor} / 10` },
                                        { label: 'Registrado por', value: selectedLesao.createdByName || '—' },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="bg-gray-50 rounded-lg px-3 py-2">
                                            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{label}</p>
                                            <p className="text-sm font-medium text-gray-700 mt-0.5">{value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            {selectedLesao.descricao && (
                                <div className="bg-gray-50 rounded-xl px-4 py-3">
                                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1.5">Descrição</p>
                                    <p className="text-sm text-gray-700 leading-relaxed">{selectedLesao.descricao}</p>
                                </div>
                            )}

                            {/* Status update */}
                            <div className="border border-gray-100 rounded-xl px-4 py-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">Atualizar Andamento</p>
                                <div className="flex items-end gap-3">
                                    <div className="flex-1">
                                        <Select_M3
                                            name='status'
                                            label='Novo status'
                                            value={updateStatusLesao.status}
                                            onChange={handleChangeStatus}
                                            options={LESAO_STATUS_OPTIONS}
                                        />
                                    </div>
                                    {updateStatusLesao.status !== selectedLesao.status && updateStatusLesao.status !== '' && (
                                        <Button_M3 label='Salvar' bgColor='green' onClick={handleUpdateStatus} />
                                    )}
                                </div>
                            </div>

                            {/* Comments */}
                            <div className="border border-gray-100 rounded-xl px-4 py-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">
                                    Comentários
                                    {selectedLesao.comentarios.length > 0 && (
                                        <span className="ml-2 bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full text-xs">
                                            {selectedLesao.comentarios.length}
                                        </span>
                                    )}
                                </p>

                                {selectedLesao.comentarios.length > 0 ? (
                                    <div className="space-y-3 mb-4">
                                        {selectedLesao.comentarios.map((comentario, i) => (
                                            <div key={i} className="bg-gray-50 rounded-lg px-3 py-2.5">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-indigo-800 text-sm">{comentario.userName}</span>
                                                    <span className="text-xs text-gray-400">{formatDateBRHora(comentario.createdAt)}</span>
                                                </div>
                                                <RichReadOnly_M3 value={comentario.content} label='' name='comentario' />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-sm italic mb-3">Nenhum comentário registrado.</p>
                                )}

                                <RichText_M3
                                    name='comentarios'
                                    onChange={(_e: any, a: any) => setNovoComentario(a)}
                                    value={novoComentario}
                                    label='Novo Comentário'
                                />

                                {!isComentarioVazio(novoComentario) && novoComentario.trim() && (
                                    <div className="flex justify-end mt-2">
                                        <Button_M3 label='Adicionar Comentário' bgColor='blue' onClick={handleAddComentario} />
                                    </div>
                                )}
                            </div>

                        </div>
                    )}
                </Modalpadrao>

            </PortalBase>
        </PermissionWrapper>
    );
};

export default Index;
