import React from 'react';
import { usePrescricaoForm } from '@/hooks/usePrescricaoForm';
import Text_M3 from '@/components/Formularios/Text_M3';
import Select_M3 from '@/components/Formularios/Select_M3';
import Button_M3 from '@/components/Formularios/Button_M3';
import RichText_M3 from '@/components/Formularios/RichTextArea_M3';
import { VIA_ADMINISTRACAO_OPTIONS, STATUS_PRESCRICAO_OPTIONS, DIAS_SEMANA_LABELS, Prescricao } from '@/models/prescricao.model';
import CheckboxM2 from '../Formularios/CheckboxM2';
import Date_M3 from '../Formularios/Date_M3';

interface PrescricaoFormProps {
    residenteId: string;
    prescricao?: Prescricao;
    onSuccess: () => void;
}

const isEditing = (p?: Prescricao) => !!p?._id;

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



            {/* Horários + Frequência (se não SOS) */}
            {!formValues.usoSOS && (
                <>
                    {/* Horários */}
                    <div className="col-span-full">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Horários</label>
                        <div className="flex flex-wrap gap-3">
                            {(formValues.horarios || []).map((h, i) => (
                                <div key={i} className="flex items-center gap-1">
                                    <input
                                        type="time"
                                        value={h}
                                        onChange={e => {
                                            const arr = [...(formValues.horarios || [])];
                                            arr[i] = e.target.value;
                                            handleChange('horarios', arr);
                                        }}
                                        className="w-36 border border-gray-300 rounded p-2 text-sm"
                                    />
                                    <button type="button"
                                        onClick={() => handleChange('horarios', (formValues.horarios || []).filter((_, j) => j !== i))}
                                        className="text-red-400 hover:text-red-600 text-lg leading-none px-1">
                                        ×
                                    </button>
                                </div>
                            ))}
                            <button type="button"
                                onClick={() => handleChange('horarios', [...(formValues.horarios || []), ''])}
                                className="mt-1 text-blue-600 text-sm hover:underline">
                                + Adicionar horário
                            </button>
                        </div>
                    </div>

                    {/* Frequência */}
                    <div className="col-span-full">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Frequência</label>
                        <div className="flex gap-2 mb-3">
                            {[
                                { value: 'diaria', label: 'Todo dia' },
                                { value: 'dias_especificos', label: 'Dias específicos' },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        handleChange('frequencia', opt.value);
                                        if (opt.value === 'diaria') handleChange('diasSemana', []);
                                    }}
                                    className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                                        (formValues.frequencia ?? 'diaria') === opt.value
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white text-gray-500 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {(formValues.frequencia ?? 'diaria') === 'dias_especificos' && (
                            <div>
                                <p className="text-xs text-gray-400 mb-2">Selecione os dias em que o medicamento deve ser administrado:</p>
                                <div className="flex gap-2 flex-wrap">
                                    {DIAS_SEMANA_LABELS.map((dia, i) => {
                                        const selecionado = (formValues.diasSemana || []).includes(i);
                                        return (
                                            <button
                                                key={dia}
                                                type="button"
                                                onClick={() => {
                                                    const atual = formValues.diasSemana || [];
                                                    const novo = selecionado
                                                        ? atual.filter(d => d !== i)
                                                        : [...atual, i].sort();
                                                    handleChange('diasSemana', novo);
                                                }}
                                                className={`w-11 h-11 rounded-full text-sm font-bold border-2 transition-all ${
                                                    selecionado
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                        : 'bg-white text-gray-400 border-gray-200 hover:border-indigo-300 hover:text-indigo-500'
                                                }`}
                                            >
                                                {dia}
                                            </button>
                                        );
                                    })}
                                </div>
                                {errors.diasSemana && (
                                    <p className="text-red-500 text-xs mt-1">{errors.diasSemana}</p>
                                )}
                            </div>
                        )}
                    </div>
                </>
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
                <Button_M3 label={submitting ? 'Enviando...' : (isEditing(prescricao) ? 'Salvar Alterações' : 'Criar Prescrição')} onClick={handleSubmit} bgColor="green" disabled={submitting} />
            </div>

        </form>
    );
}
