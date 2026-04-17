import React, { useState, useEffect } from 'react';
import ModalPadrao from '@/components/ModalPadrao';
import { usePrescricoesByResidente } from '@/hooks/usePrescricoesByResidente';
import { Prescricao as PrescricaoType, STATUS_PRESCRICAO_OPTIONS } from '@/models/prescricao.model';
import Button_M3 from '@/components/Formularios/Button_M3';
import Select_M3 from '@/components/Formularios/Select_M3';
import RichReadOnly_M3 from '@/components/Formularios/RichReadOnly_M3';
import { getUserID } from '@/utils/Login';
import GruposUsuario_getGruposUsuario from '@/actions/GruposUsuario_getGruposUsuario';
import PrescricaoForm from '../Forms/prescricao.form';
import { formatDateBR, formatDateBRHora, notifyError, notifySuccess } from '@/utils/Functions';
import Badge from '../UI/Badge';
import { updateStatusPrescricao } from '@/services/prescricao.service';

interface Props {
    idosoData: { _id: string; nome?: string };
}

export default function Prescricao({ idosoData }: Props) {
    const [gruposUsuario, setGruposUsuario] = useState<string[]>([]);
    const medicoId = getUserID();

    useEffect(() => {
        (async () => {
            const grupos = await GruposUsuario_getGruposUsuario(medicoId);
            setGruposUsuario(grupos || []);
        })();
    }, [medicoId]);

    const allowed = ['medicina', 'admin'];
    const canEdit = gruposUsuario.some((g: any) => allowed.includes(g.nome_grupo?.toLowerCase()));

    const { data: prescricoes, loading, error, refetch } = usePrescricoesByResidente(idosoData._id);

    const [viewSelected, setViewSelected] = useState<PrescricaoType | null>(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [formSelected, setFormSelected] = useState<PrescricaoType | null>(null);
    const [showFormModal, setShowFormModal] = useState(false);

    const openView = (p: PrescricaoType) => { setViewSelected(p); setShowViewModal(true); };
    const closeView = () => { setShowViewModal(false); setViewSelected(null); };

    const openNewForm = () => {
        setFormSelected({ residenteId: idosoData._id, medicoId } as PrescricaoType);
        setShowFormModal(true);
    };

    const openEditForm = (p: PrescricaoType) => { setFormSelected(p); setShowFormModal(true); };

    const handleFormSuccess = () => { setShowFormModal(false); refetch(); };

    const handleStatusUpdate = async (newStatus: string) => {
        if (!viewSelected?._id) return;
        const res = await updateStatusPrescricao(viewSelected._id, newStatus);
        if (res.success) {
            notifySuccess('Status atualizado!');
            await refetch();
            closeView();
        } else {
            notifyError(res.message || 'Erro ao atualizar status.');
        }
    };

    const badgeVariantForStatus = (status: string) => {
        if (status === 'ativa') return 'success' as const;
        if (status === 'cancelada') return 'danger' as const;
        if (status === 'finalizada') return 'warning' as const;
        return 'info' as const;
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-700">Prescrições</h2>
                {canEdit && <Button_M3 label="+ Nova Prescrição" onClick={openNewForm} bgColor="green" />}
            </div>

            {loading ? (
                <p className="text-gray-500 text-sm">Carregando...</p>
            ) : error ? (
                <p className="text-red-600 text-sm">Erro: {error}</p>
            ) : prescricoes && prescricoes.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium text-gray-600">Medicamento</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-600">Via</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-600">Horários</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-600">Início</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {prescricoes.map((p, i) => (
                                <tr key={p._id} onClick={() => openView(p)}
                                    className={`cursor-pointer hover:bg-indigo-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                    <td className="px-4 py-2 font-medium text-gray-800">{p.medicamento}</td>
                                    <td className="px-4 py-2 text-gray-600 capitalize">{p.via}</td>
                                    <td className="px-4 py-2">
                                        {p.usoSOS ? (
                                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">SOS</span>
                                        ) : (
                                            <span className="text-xs text-gray-600">{(p.horarios || []).join(', ') || '—'}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2">
                                        <Badge label={p.status} variant={badgeVariantForStatus(p.status)} />
                                    </td>
                                    <td className="px-4 py-2 text-gray-600">{formatDateBR(p.dataInicio)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="py-10 text-center text-gray-400 text-sm">
                    Nenhuma prescrição cadastrada.
                    {canEdit && <span> Clique em &quot;+ Nova Prescrição&quot; para adicionar.</span>}
                </div>
            )}

            {/* Modal de detalhes */}
            <ModalPadrao isOpen={showViewModal} onClose={closeView}>
                {viewSelected && (
                    <div className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-2">
                            <h2 className="text-lg font-semibold text-slate-800">{viewSelected.medicamento}</h2>
                            <Badge label={viewSelected.status} variant={badgeVariantForStatus(viewSelected.status)} />
                        </div>

                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            <div><span className="text-gray-500">Via:</span> <span className="capitalize font-medium">{viewSelected.via}</span></div>
                            <div><span className="text-gray-500">Uso:</span> <span className="font-medium">{viewSelected.usoSOS ? 'SOS (sob demanda)' : 'Regular'}</span></div>
                            <div><span className="text-gray-500">Início:</span> <span className="font-medium">{formatDateBR(viewSelected.dataInicio)}</span></div>
                            <div><span className="text-gray-500">Fim:</span> <span className="font-medium">{formatDateBR(viewSelected.dataFim) || '—'}</span></div>
                            <div><span className="text-gray-500">Cadastrado:</span> <span className="font-medium">{formatDateBRHora(viewSelected.createdAt)}</span></div>
                        </div>

                        {!viewSelected.usoSOS && viewSelected.horarios && viewSelected.horarios.length > 0 && (
                            <div className="flex items-center flex-wrap gap-2 text-sm">
                                <span className="text-gray-500">Horários:</span>
                                {viewSelected.horarios.map(h => <Badge key={h} label={h} variant="info" />)}
                            </div>
                        )}

                        {viewSelected.observacoes && (
                            <div className="text-sm">
                                <span className="text-gray-500 block mb-1">Observações:</span>
                                <RichReadOnly_M3 label='' name='' value={viewSelected.observacoes} />
                            </div>
                        )}

                        {canEdit && (
                            <div className="flex items-end gap-4 pt-2 border-t">
                                <Select_M3 name="status" label="Alterar Status"
                                    value={viewSelected.status}
                                    options={STATUS_PRESCRICAO_OPTIONS}
                                    onChange={e => handleStatusUpdate(e.target.value)} />
                                <Button_M3 label="Editar" bgColor="blue"
                                    onClick={() => { closeView(); openEditForm(viewSelected); }} />
                            </div>
                        )}
                    </div>
                )}
            </ModalPadrao>

            {/* Modal de formulário */}
            <ModalPadrao isOpen={showFormModal} onClose={() => setShowFormModal(false)}>
                <div className="p-4">
                    <h2 className="text-lg font-semibold mb-4">
                        {formSelected?._id ? 'Editar Prescrição' : 'Nova Prescrição'}
                    </h2>
                    <PrescricaoForm
                        residenteId={idosoData._id}
                        prescricao={formSelected || undefined}
                        onSuccess={handleFormSuccess}
                    />
                </div>
            </ModalPadrao>
        </div>
    );
}
