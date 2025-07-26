import React from 'react';
import { usePrescricaoForm } from '@/hooks/usePrescricaoForm';
import Text_M3 from '@/components/Formularios/Text_M3';
import Select_M3 from '@/components/Formularios/Select_M3';
import Button_M3 from '@/components/Formularios/Button_M3';
import RichText_M3 from '@/components/Formularios/RichTextArea_M3';
import { VIA_ADMINISTRACAO_OPTIONS, STATUS_PRESCRICAO_OPTIONS, Prescricao } from '@/models/prescricao.model';
import CheckboxM2 from '../Formularios/CheckboxM2';
import Date_M3 from '../Formularios/Date_M3';

interface PrescricaoFormProps {
    residenteId: string;
    prescricao?: Prescricao;
    onSuccess: () => void;
}

export default function PrescricaoForm({
    residenteId,
    prescricao,
    onSuccess,
}: PrescricaoFormProps) {
    // Pre-popula residenteId se for novo, ou usa prescricao existente
    const initialData = (prescricao ? prescricao : ({ residenteId } as Prescricao));
    const {
        formValues,
        errors,
        submitting,
        handleChange,
        handleSubmit,
        resetForm,
    } = usePrescricaoForm({ initialData, onSuccess });

    return (
        <form
            onSubmit={e => { e.preventDefault(); handleSubmit(); }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-white rounded-lg shadow"
        >
            {/* Mensagem de erro global */}
            {errors._global && (
                <div className="col-span-full bg-red-100 text-red-700 p-3 rounded">
                    {errors._global}
                </div>
            )}

            <Text_M3 name="medicamento" label="Medicamento" value={formValues.medicamento || ''} onChange={e => handleChange('medicamento', e.target.value)} placeholder="Ex: Paracetamol" disabled={false}
                className={'col-span-full'} />

            <Select_M3 name="via" label="Via de Administração" value={formValues.via || ''} options={VIA_ADMINISTRACAO_OPTIONS} onChange={e => handleChange('via', e.target.value)} />

            <Select_M3 name="status" label="Status" value={formValues.status || ''} options={STATUS_PRESCRICAO_OPTIONS} onChange={e => handleChange('status', e.target.value)} />

            <CheckboxM2 id='usoSOS' label='Uso SOS (sob demanda)' isChecked={formValues.usoSOS || false} onChange={(e: any) => handleChange('usoSOS', e.target.checked)}
                className='col-span-full' />



            {/* Horários (se não SOS) */}
            {!formValues.usoSOS && (
                <div className="col-span-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Horários</label>
                    <div className="flex flex-wrap gap-3">
                        {(formValues.horarios || []).map((h, i) => (
                            <input
                                key={i}
                                type="time"
                                value={h}
                                onChange={e => {
                                    const arr = [...(formValues.horarios || [])];
                                    arr[i] = e.target.value;
                                    handleChange('horarios', arr);
                                }}
                                className="w-full sm:w-40 border border-gray-300 rounded p-2"
                            />
                        ))}
                        <button type="button" onClick={() => handleChange('horarios', [...(formValues.horarios || []), ''])} className="mt-1 text-blue-600 text-sm hover:underline">
                            + Adicionar horário
                        </button>
                    </div>
                </div>
            )}

            {/* Datas */}
            <div className="col-span-full sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Date_M3 label='Data Início' name='dataInicio' disabled={false} onChange={e => handleChange('dataInicio', e.target.value)} value={formValues.dataInicio || ''} />
                <Date_M3 label='Data Fim' name='dataFim' disabled={false} onChange={e => handleChange('dataFim', e.target.value)} value={formValues.dataFim || ''} />
            </div>

            {/* Observações */}
            <div className="col-span-full">
                <RichText_M3 name="observacoes" label="Observações" value={formValues.observacoes || ''} onChange={(name, val) => handleChange('observacoes', val)} />
            </div>

            {/* Ações */}
            <div className="col-span-full flex justify-end gap-4 mt-4">
                <Button_M3 label="Limpar" onClick={resetForm} bgColor="gray" type='button' />
                <Button_M3 label={submitting ? 'Enviando...' : 'Criar Prescrição'} onClick={handleSubmit} bgColor="green" disabled={submitting} />
            </div>

        </form>
    );
}
