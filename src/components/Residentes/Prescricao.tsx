import React, { useState, useContext, useEffect } from 'react';
import ModalPadrao from '@/components/ModalPadrao';
import { usePrescricoesByResidente } from '@/hooks/usePrescricoesByResidente';
import { Prescricao as PrescricaoType, STATUS_PRESCRICAO_OPTIONS } from '@/models/prescricao.model';
import Button_M3 from '@/components/Formularios/Button_M3';
import Select_M3 from '@/components/Formularios/Select_M3';
import RichReadOnly_M3 from '@/components/Formularios/RichReadOnly_M3';
// import { AuthContext } from '@/context/AuthContext';
import { getUserID } from '@/utils/Login';
import GruposUsuario_getGruposUsuario from '@/actions/GruposUsuario_getGruposUsuario';
import PrescricaoForm from '../Forms/prescricao.form';
import { formatDateBR, formatDateBRHora } from '@/utils/Functions';
import Badge from '../UI/Badge';

interface Props {
    idosoData: { _id: string; nome?: string };
}

export default function Prescricao({ idosoData }: Props) {
    //   const { user } = useContext(AuthContext);
    const [gruposUsuario, setGruposUsuario] = useState<string[]>([]);

    // Usuario atual (medico) ID
    const medicoId = getUserID();

    // fetch grupos once
    useEffect(() => {
        (async () => {
            const grupos = await GruposUsuario_getGruposUsuario(medicoId);
            setGruposUsuario(grupos || []);
        })();
    }, [medicoId]);

    const allowed = ['medicina', 'admin'];
    const canEditStatus = gruposUsuario.some((g: any) => allowed.includes(g.nome_grupo.toLocaleLowerCase()));

    const { data: prescricoes, loading, error, refetch } =
        usePrescricoesByResidente(idosoData._id);

    // State for view modal
    const [viewSelected, setViewSelected] = useState<PrescricaoType | null>(null);
    const [showViewModal, setShowViewModal] = useState(false);

    // State for form modal (create/edit)
    const [formSelected, setFormSelected] = useState<PrescricaoType | null>(null);
    const [showFormModal, setShowFormModal] = useState(false);

    // Open view modal
    const openView = (p: PrescricaoType) => {
        setViewSelected(p);
        setShowViewModal(true);
    };

    // Close view modal
    const closeView = () => {
        setShowViewModal(false);
        setViewSelected(null);
    };

    // Open form modal for new
    const openNewForm = () => {
        // pré-popula residenteId e medicoId
        setFormSelected({ residenteId: idosoData._id, medicoId } as PrescricaoType);
        setShowFormModal(true);
    };

    // Open form modal for edit
    const openEditForm = (p: PrescricaoType) => {
        setFormSelected(p);
        setShowFormModal(true);
    };

    // Handle success in form
    const handleFormSuccess = () => {
        setShowFormModal(false);
        refetch();
    };

    // Update status backend logic
    const handleStatusUpdate = async (newStatus: string) => {
        if (!viewSelected) return;
        // TODO: call updateStatusPrescricao(viewSelected._id, newStatus)
        await refetch();
        closeView();
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Prescrições</h1>
                <Button_M3 label="+ Nova Prescrição" onClick={openNewForm} bgColor="green" />
            </div>

            {loading ? (
                <p className="text-gray-600">Carregando prescrições...</p>
            ) : error ? (
                <p className="text-red-600">Erro: {error}</p>
            ) : prescricoes && prescricoes.length > 0 ? (
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Medicamento</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Início</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Fim</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {prescricoes.map((p, i) => (
                                <tr key={p._id} onClick={() => openView(p)} className={`cursor-pointer ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
                                    <td className="px-4 py-2 text-sm text-gray-800">{p.medicamento}</td>
                                    <td className="px-4 py-2 text-sm text-gray-800">{p.status}</td>
                                    <td className="px-4 py-2 text-sm text-gray-800">{formatDateBR(p.dataInicio)}</td>
                                    <td className="px-4 py-2 text-sm text-gray-800">{formatDateBR(p.dataFim) || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-6 text-center text-gray-600">
                    Nenhuma prescrição encontrada. Clique em “+ Nova Prescrição” para adicionar.
                </div>
            )}

            {/* View Modal */}
            <ModalPadrao isOpen={showViewModal} onClose={closeView}>
                {viewSelected && (
                    <div className="space-y-4 p-4">
                        <div className='flex justify-end'>
                            <Badge label={viewSelected.status} variant='info' />
                        </div>
                        <h2 className="text-xl font-semibold">Detalhes da Prescrição</h2>
                        <div><strong>Cadastrado em:</strong> {formatDateBRHora(viewSelected.createdAt)}</div>
                        <div><strong>Medicamento:</strong> {viewSelected.medicamento}</div>
                        <div><strong>Via:</strong> {viewSelected.via}</div>
                        {viewSelected.horarios && viewSelected.horarios.length > 0 ? (
                            <div className="mt-2 flex items-center flex-wrap gap-2">
                                <strong>Horários: </strong>
                                {viewSelected.horarios.map(h => (
                                    <Badge key={h} label={h} variant="info" />
                                ))}
                            </div>
                        ) : (
                            <span className="ml-1">-</span>
                        )}
                        <div><strong>Data Início:</strong> {viewSelected.dataInicio}</div>
                        <div><strong>Data Fim:</strong> {viewSelected.dataFim || '-'}</div>
                        <div><strong>Observações:</strong><RichReadOnly_M3 label='' name='' value={viewSelected.observacoes || ''} /></div>

                        <div className="flex space-x-4 mt-4">
                            {canEditStatus && (
                                <Select_M3 name="status" label="Alterar Status" value={viewSelected.status} options={STATUS_PRESCRICAO_OPTIONS} onChange={e => handleStatusUpdate(e.target.value)} />
                            )}
                            {canEditStatus && (
                                <Button_M3 label="Editar Prescrição" bgColor="blue" onClick={() => { closeView(); openEditForm(viewSelected); }} />
                            )}
                        </div>
                    </div>
                )}
            </ModalPadrao>

            {/* Form Modal */}
            <ModalPadrao isOpen={showFormModal} onClose={() => setShowFormModal(false)}>
                <div className="p-4">
                    <h2 className="text-xl font-semibold mb-4">
                        Nova Prescrição
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
