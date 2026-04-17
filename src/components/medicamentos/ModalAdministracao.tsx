import React, { useState, useEffect } from 'react';
import ModalPadrao from '@/components/ModalPadrao';
import Button_M3 from '@/components/Formularios/Button_M3';
import { SlotAdministracao, StatusAdministracao } from '@/models/administracao.model';

interface Props {
    slot: SlotAdministracao | null;
    onClose: () => void;
    onConfirm: (params: {
        status: StatusAdministracao;
        horarioAdministrado?: string;
        observacao?: string;
    }) => Promise<void>;
}

type Opcao = 'no_horario' | 'outro_horario' | 'nao_administrado' | 'recusado';

export default function ModalAdministracao({ slot, onClose, onConfirm }: Props) {
    const [opcao, setOpcao] = useState<Opcao>('no_horario');
    const [outroHorario, setOutroHorario] = useState('');
    const [observacao, setObservacao] = useState('');
    const [saving, setSaving] = useState(false);

    // Reset ao abrir novo slot
    useEffect(() => {
        if (slot) {
            const jaFeito = slot.registro?.status;
            if (jaFeito === 'administrado') {
                setOpcao(slot.registro?.horarioAdministrado && slot.registro.horarioAdministrado !== slot.horarioPrevisto
                    ? 'outro_horario' : 'no_horario');
                setOutroHorario(slot.registro?.horarioAdministrado || '');
            } else if (jaFeito === 'nao_administrado') {
                setOpcao('nao_administrado');
            } else if (jaFeito === 'recusado') {
                setOpcao('recusado');
            } else {
                setOpcao('no_horario');
            }
            setObservacao(slot.registro?.observacao || '');
        }
    }, [slot]);

    if (!slot) return null;

    const handleConfirm = async () => {
        setSaving(true);
        try {
            const status: StatusAdministracao =
                opcao === 'no_horario' || opcao === 'outro_horario' ? 'administrado'
                    : opcao === 'nao_administrado' ? 'nao_administrado'
                        : 'recusado';

            await onConfirm({
                status,
                horarioAdministrado: opcao === 'no_horario' ? slot.horarioPrevisto
                    : opcao === 'outro_horario' ? outroHorario
                        : undefined,
                observacao: observacao || undefined,
            });
        } finally {
            setSaving(false);
        }
    };

    const radioClass = (active: boolean) =>
        `flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${active ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`;

    return (
        <ModalPadrao isOpen={!!slot} onClose={onClose}>
            <div className="p-4 space-y-4">
                {/* Cabeçalho */}
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Registrar administração</p>
                    <h2 className="text-base font-semibold text-slate-800">{slot.medicamento}</h2>
                    <p className="text-sm text-gray-500">{slot.nomeResidente} · {slot.via} · previsto às <strong>{slot.horarioPrevisto}</strong></p>
                </div>

                {/* Opções */}
                <div className="space-y-2">
                    <label className={radioClass(opcao === 'no_horario')} onClick={() => setOpcao('no_horario')}>
                        <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 ${opcao === 'no_horario' ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}`} />
                        <div>
                            <p className="text-sm font-medium text-gray-800">Administrado no horário indicado</p>
                            <p className="text-xs text-gray-400">Às {slot.horarioPrevisto}, conforme prescrito</p>
                        </div>
                    </label>

                    <label className={radioClass(opcao === 'outro_horario')} onClick={() => setOpcao('outro_horario')}>
                        <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 ${opcao === 'outro_horario' ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}`} />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">Administrado em outro horário</p>
                            {opcao === 'outro_horario' && (
                                <input
                                    type="time"
                                    value={outroHorario}
                                    onChange={e => setOutroHorario(e.target.value)}
                                    className="mt-2 border border-gray-300 rounded px-2 py-1 text-sm w-36"
                                    onClick={e => e.stopPropagation()}
                                />
                            )}
                        </div>
                    </label>

                    <label className={radioClass(opcao === 'nao_administrado')} onClick={() => setOpcao('nao_administrado')}>
                        <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 ${opcao === 'nao_administrado' ? 'border-red-500 bg-red-500' : 'border-gray-300'}`} />
                        <div>
                            <p className="text-sm font-medium text-gray-800">Não administrado</p>
                            <p className="text-xs text-gray-400">Medicamento não foi dado</p>
                        </div>
                    </label>

                    <label className={radioClass(opcao === 'recusado')} onClick={() => setOpcao('recusado')}>
                        <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 ${opcao === 'recusado' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`} />
                        <div>
                            <p className="text-sm font-medium text-gray-800">Recusado pelo idoso</p>
                            <p className="text-xs text-gray-400">Idoso se recusou a tomar</p>
                        </div>
                    </label>
                </div>

                {/* Observação */}
                {(opcao === 'nao_administrado' || opcao === 'recusado' || opcao === 'outro_horario') && (
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Observação {(opcao === 'nao_administrado' || opcao === 'recusado') ? '(motivo)' : '(opcional)'}</label>
                        <textarea
                            value={observacao}
                            onChange={e => setObservacao(e.target.value)}
                            rows={2}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none"
                            placeholder="Descreva o motivo ou observação..."
                        />
                    </div>
                )}

                {/* Ações */}
                <div className="flex justify-end gap-3 pt-2 border-t">
                    <Button_M3 label="Cancelar" onClick={onClose} bgColor="gray" type="button" />
                    <Button_M3
                        label={saving ? 'Salvando...' : 'Confirmar'}
                        onClick={handleConfirm}
                        bgColor={opcao === 'nao_administrado' || opcao === 'recusado' ? 'red' : 'green'}
                        disabled={saving || (opcao === 'outro_horario' && !outroHorario)}
                        type="button"
                    />
                </div>
            </div>
        </ModalPadrao>
    );
}
