import React, { useEffect, useState } from 'react';
import Button_M3 from '@/components/Formularios/Button_M3';
import { T_Beneficios } from '@/types/T_funcionariosCLT';
import S_funcionariosCLT from '@/services/S_funcionariosCLT';
import { notifyError, notifySuccess } from '@/utils/Functions';

interface Props {
  funcionarioId: string;
  beneficios: T_Beneficios;
  onUpdate: (beneficios: T_Beneficios) => void;
}

const defaultBeneficios: T_Beneficios = {
  valeTransporte: false,
  valeAlimentacao: false,
  planoSaude: false,
  planoOdontologico: false,
  seguroVida: false,
};

const Tab_Beneficios: React.FC<Props> = ({ funcionarioId, beneficios, onUpdate }) => {
  const [form, setForm] = useState<T_Beneficios>({ ...defaultBeneficios, ...beneficios });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...defaultBeneficios, ...beneficios });
  }, [beneficios]);

  const handleToggle = (field: keyof T_Beneficios) => {
    setForm((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChange = (field: keyof T_Beneficios, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSalvar = async () => {
    try {
      setSaving(true);
      await S_funcionariosCLT.updateBeneficios(funcionarioId, form);
      onUpdate(form);
      notifySuccess('Benefícios atualizados!');
    } catch {
      notifyError('Erro ao salvar benefícios.');
    } finally {
      setSaving(false);
    }
  };

  const Toggle: React.FC<{ label: string; field: keyof T_Beneficios }> = ({ label, field }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => handleToggle(field)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form[field] ? 'bg-indigo-600' : 'bg-gray-200'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form[field] ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="bg-gray-50 rounded-lg p-4">
        <Toggle label="Vale Transporte" field="valeTransporte" />
        {form.valeTransporte && (
          <div className="mt-2 ml-2">
            <label className="block text-xs text-gray-600 mb-1">Valor diário (R$)</label>
            <input type="number" step="0.01" value={form.valeTransporteValorDiario ?? ''}
              onChange={(e) => handleChange('valeTransporteValorDiario', parseFloat(e.target.value))}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 w-40" />
          </div>
        )}

        <Toggle label="Vale Alimentação" field="valeAlimentacao" />
        {form.valeAlimentacao && (
          <div className="mt-2 ml-2">
            <label className="block text-xs text-gray-600 mb-1">Valor mensal (R$)</label>
            <input type="number" step="0.01" value={form.valeAlimentacaoValorMensal ?? ''}
              onChange={(e) => handleChange('valeAlimentacaoValorMensal', parseFloat(e.target.value))}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 w-40" />
          </div>
        )}

        <Toggle label="Plano de Saúde" field="planoSaude" />
        {form.planoSaude && (
          <div className="mt-2 ml-2">
            <label className="block text-xs text-gray-600 mb-1">Operadora</label>
            <input type="text" value={form.planoSaudeOperadora ?? ''}
              onChange={(e) => handleChange('planoSaudeOperadora', e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 w-full max-w-xs" />
          </div>
        )}

        <Toggle label="Plano Odontológico" field="planoOdontologico" />
        <Toggle label="Seguro de Vida" field="seguroVida" />
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Outros Benefícios (texto livre)</label>
        <textarea value={form.outrosBeneficios ?? ''} onChange={(e) => handleChange('outrosBeneficios', e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          placeholder="Descreva outros benefícios se houver..." />
      </div>

      <div className="flex justify-end">
        <Button_M3 label={saving ? 'Salvando...' : 'Salvar Benefícios'} onClick={handleSalvar} type="button" disabled={saving} />
      </div>
    </div>
  );
};

export default Tab_Beneficios;
