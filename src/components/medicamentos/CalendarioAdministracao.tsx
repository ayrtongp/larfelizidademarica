import React, { useState, useEffect, useCallback } from 'react';
import { getSlotsDodia, registrarAdministracao } from '@/services/S_administracao';
import { SlotAdministracao, StatusAdministracao } from '@/models/administracao.model';
import ModalAdministracao from './ModalAdministracao';
import { getUserID } from '@/utils/Login';
import { notifyError, notifySuccess } from '@/utils/Functions';

// -----------------------------------------------
// Helpers de data
// -----------------------------------------------
function toYMD(d: Date) {
    return d.toISOString().slice(0, 10);
}

function formatDiaSemana(d: Date) {
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function addDias(d: Date, n: number) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}

// -----------------------------------------------
// Ícone de status para a linha
// -----------------------------------------------
function StatusBadge({ status }: { status?: StatusAdministracao }) {
    if (!status || status === 'pendente') {
        return <span className="text-xs text-gray-400">Pendente</span>;
    }
    const map: Record<StatusAdministracao, { label: string; cls: string }> = {
        administrado:     { label: 'Administrado', cls: 'bg-green-100 text-green-700' },
        nao_administrado: { label: 'Não administrado', cls: 'bg-red-100 text-red-700' },
        recusado:         { label: 'Recusado', cls: 'bg-orange-100 text-orange-700' },
        pendente:         { label: 'Pendente', cls: 'bg-gray-100 text-gray-500' },
    };
    const s = map[status];
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>;
}

// -----------------------------------------------
// Componente principal
// -----------------------------------------------
export default function CalendarioAdministracao() {
    const [dataAtual, setDataAtual] = useState<Date>(() => new Date());
    const [slots, setSlots] = useState<SlotAdministracao[]>([]);
    const [loading, setLoading] = useState(false);
    const [slotSelecionado, setSlotSelecionado] = useState<SlotAdministracao | null>(null);

    const funcionarioId = getUserID();

    const carregar = useCallback(async (data: Date) => {
        setLoading(true);
        try {
            const resultado = await getSlotsDodia(toYMD(data));
            setSlots(resultado);
        } catch (err: any) {
            notifyError(err.message || 'Erro ao carregar medicamentos do dia.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        carregar(dataAtual);
    }, [dataAtual, carregar]);

    const handleConfirmar = async (params: {
        status: StatusAdministracao;
        horarioAdministrado?: string;
        observacao?: string;
    }) => {
        if (!slotSelecionado) return;
        try {
            await registrarAdministracao({
                prescricaoId: slotSelecionado.prescricaoId,
                residenteId: slotSelecionado.residenteId,
                funcionarioId,
                data: toYMD(dataAtual),
                horarioPrevisto: slotSelecionado.horarioPrevisto,
                ...params,
            });
            notifySuccess('Registro salvo!');
            setSlotSelecionado(null);
            carregar(dataAtual);
        } catch (err: any) {
            notifyError(err.message || 'Erro ao salvar.');
        }
    };

    // Agrupa slots por horário para exibição
    const horarios = Array.from(new Set(slots.map(s => s.horarioPrevisto))).sort();

    const isHoje = toYMD(dataAtual) === toYMD(new Date());

    return (
        <div className="space-y-4">
            {/* Navegação de data */}
            <div className="flex items-center justify-between bg-white border rounded-lg px-4 py-3">
                <button
                    onClick={() => setDataAtual(d => addDias(d, -1))}
                    className="p-2 rounded hover:bg-gray-100 text-gray-600 transition-colors"
                    aria-label="Dia anterior"
                >
                    ‹
                </button>
                <div className="text-center">
                    <p className="font-semibold text-slate-700 capitalize">{formatDiaSemana(dataAtual)}</p>
                    {isHoje && <span className="text-xs text-indigo-600 font-medium">Hoje</span>}
                </div>
                <button
                    onClick={() => setDataAtual(d => addDias(d, 1))}
                    className="p-2 rounded hover:bg-gray-100 text-gray-600 transition-colors"
                    aria-label="Próximo dia"
                >
                    ›
                </button>
            </div>

            {/* Tabela */}
            {loading ? (
                <p className="text-sm text-gray-400 text-center py-10">Carregando...</p>
            ) : slots.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <p className="text-sm">Nenhuma medicação programada para este dia.</p>
                    <p className="text-xs mt-1">Verifique se há prescrições ativas cadastradas.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {horarios.map(horario => {
                        const slotsDoHorario = slots.filter(s => s.horarioPrevisto === horario);
                        return (
                            <div key={horario}>
                                {/* Cabeçalho do horário */}
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                                        {horario}
                                    </span>
                                    <span className="text-xs text-gray-400">{slotsDoHorario.length} medicamento{slotsDoHorario.length !== 1 ? 's' : ''}</span>
                                </div>

                                <div className="rounded-lg border border-gray-200 overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-8"></th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Idoso</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Medicamento</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Via</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-50">
                                            {slotsDoHorario.map((slot, i) => {
                                                const feito = slot.registro?.status === 'administrado';
                                                const naoDado = slot.registro?.status === 'nao_administrado' || slot.registro?.status === 'recusado';
                                                return (
                                                    <tr key={`${slot.prescricaoId}-${i}`}
                                                        className={`hover:bg-gray-50 transition-colors ${feito ? 'bg-green-50' : naoDado ? 'bg-red-50' : ''}`}>
                                                        {/* Checkbox */}
                                                        <td className="px-4 py-3">
                                                            <button
                                                                onClick={() => setSlotSelecionado(slot)}
                                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                                                                    feito
                                                                        ? 'bg-green-500 border-green-500 text-white'
                                                                        : naoDado
                                                                            ? 'bg-red-400 border-red-400 text-white'
                                                                            : 'border-gray-300 hover:border-indigo-400'
                                                                }`}
                                                                title="Clique para registrar"
                                                            >
                                                                {feito && <span className="text-xs leading-none">✓</span>}
                                                                {naoDado && <span className="text-xs leading-none">✕</span>}
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-3 font-medium text-gray-800">{slot.nomeResidente}</td>
                                                        <td className="px-4 py-3 text-gray-700">{slot.medicamento}</td>
                                                        <td className="px-4 py-3 text-gray-500 capitalize">{slot.via}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-col gap-0.5">
                                                                <StatusBadge status={slot.registro?.status} />
                                                                {slot.registro?.horarioAdministrado && slot.registro.horarioAdministrado !== slot.horarioPrevisto && (
                                                                    <span className="text-xs text-gray-400">às {slot.registro.horarioAdministrado}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <ModalAdministracao
                slot={slotSelecionado}
                onClose={() => setSlotSelecionado(null)}
                onConfirm={handleConfirmar}
            />
        </div>
    );
}
