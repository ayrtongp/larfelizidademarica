import React, { useEffect, useState } from 'react';
import Button_M3 from '@/components/Formularios/Button_M3';
import { T_Contrato } from '@/types/T_funcionariosCLT';
import S_funcionariosCLT from '@/services/S_funcionariosCLT';
import { notifyError, notifySuccess } from '@/utils/Functions';

interface Props {
  funcionarioId: string;
  contrato: T_Contrato;
  onUpdate: (contrato: T_Contrato) => void;
}

const TIPOS_CONTRATO = [
  { value: 'experiencia', label: 'Período de Experiência' },
  { value: 'prazo_indeterminado', label: 'Prazo Indeterminado' },
  { value: 'prazo_determinado', label: 'Prazo Determinado' },
];

const TURNOS = [
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
  { value: 'integral', label: 'Integral' },
  { value: 'escala_12x36', label: 'Escala 12x36' },
  { value: 'escala_24x48', label: 'Escala 24x48' },
];

const Tab_Contrato: React.FC<Props> = ({ funcionarioId, contrato, onUpdate }) => {
  const [form, setForm] = useState<T_Contrato>({ ...contrato });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...contrato });
  }, [contrato]);

  const handleChange = (field: keyof T_Contrato, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSalvar = async () => {
    if (!form.cargo.trim() || !form.setor.trim() || !form.dataAdmissao) {
      notifyError('Cargo, setor e data de admissão são obrigatórios.');
      return;
    }
    try {
      setSaving(true);
      await S_funcionariosCLT.updateContrato(funcionarioId, form);
      onUpdate(form);
      notifySuccess('Contrato atualizado com sucesso!');
    } catch {
      notifyError('Erro ao salvar contrato.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Cargo *</label>
          <input type="text" value={form.cargo} onChange={(e) => handleChange('cargo', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Setor *</label>
          <input type="text" value={form.setor} onChange={(e) => handleChange('setor', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">CBO (Classificação Brasileira de Ocupações)</label>
          <input type="text" value={form.cbo ?? ''} onChange={(e) => handleChange('cbo', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            placeholder="Ex: 5162-10" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Tipo de Contrato *</label>
          <select value={form.tipoContrato} onChange={(e) => handleChange('tipoContrato', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
            {TIPOS_CONTRATO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Turno</label>
          <select value={form.turno ?? ''} onChange={(e) => handleChange('turno', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
            <option value="">— selecione —</option>
            {TURNOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Carga Horária Semanal (h) *</label>
          <input type="number" value={form.cargaHorariaSemanal} onChange={(e) => handleChange('cargaHorariaSemanal', parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            min={1} max={80} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Salário Base (R$) *</label>
          <input type="number" step="0.01" value={form.salarioBase} onChange={(e) => handleChange('salarioBase', parseFloat(e.target.value))}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Data de Admissão *</label>
          <input type="date" value={form.dataAdmissao} onChange={(e) => handleChange('dataAdmissao', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        {form.tipoContrato === 'experiencia' && (
          <div>
            <label className="block text-xs text-gray-600 mb-1">Fim do Período de Experiência</label>
            <input type="date" value={form.dataFimExperiencia ?? ''} onChange={(e) => handleChange('dataFimExperiencia', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
        )}
        {form.tipoContrato === 'prazo_determinado' && (
          <div>
            <label className="block text-xs text-gray-600 mb-1">Fim do Contrato</label>
            <input type="date" value={form.dataFimContrato ?? ''} onChange={(e) => handleChange('dataFimContrato', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
        )}
        <div className="sm:col-span-2">
          <label className="block text-xs text-gray-600 mb-1">Sindicato</label>
          <input type="text" value={form.sindicato ?? ''} onChange={(e) => handleChange('sindicato', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button_M3 label={saving ? 'Salvando...' : 'Salvar Contrato'} onClick={handleSalvar} type="button" disabled={saving} />
      </div>
    </div>
  );
};

export default Tab_Contrato;
