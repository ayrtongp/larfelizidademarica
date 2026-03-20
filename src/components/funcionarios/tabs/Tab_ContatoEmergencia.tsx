import React, { useEffect, useState } from 'react';
import Button_M3 from '@/components/Formularios/Button_M3';
import { T_ContatoEmergencia } from '@/types/T_funcionariosCLT';
import S_funcionariosCLT from '@/services/S_funcionariosCLT';
import { notifyError, notifySuccess } from '@/utils/Functions';

interface Props {
  funcionarioId: string;
  contatoEmergencia: T_ContatoEmergencia;
  onUpdate: (contato: T_ContatoEmergencia) => void;
}

const Tab_ContatoEmergencia: React.FC<Props> = ({ funcionarioId, contatoEmergencia, onUpdate }) => {
  const [form, setForm] = useState<T_ContatoEmergencia>({ ...contatoEmergencia });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...contatoEmergencia });
  }, [contatoEmergencia]);

  const handleChange = (field: keyof T_ContatoEmergencia, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSalvar = async () => {
    try {
      setSaving(true);
      await S_funcionariosCLT.updateEmergencia(funcionarioId, form);
      onUpdate(form);
      notifySuccess('Contato de emergência atualizado!');
    } catch {
      notifyError('Erro ao salvar contato de emergência.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs text-gray-600 mb-1">Nome</label>
          <input type="text" value={form.nome ?? ''} onChange={(e) => handleChange('nome', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Parentesco</label>
          <input type="text" value={form.parentesco ?? ''} onChange={(e) => handleChange('parentesco', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            placeholder="Ex: Cônjuge, Pai, Filho(a)" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Telefone Principal</label>
          <input type="tel" value={form.telefone ?? ''} onChange={(e) => handleChange('telefone', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            placeholder="(21) 99999-9999" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Telefone Alternativo</label>
          <input type="tel" value={form.telefone2 ?? ''} onChange={(e) => handleChange('telefone2', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            placeholder="(21) 99999-9999" />
        </div>
      </div>

      <div className="flex justify-end">
        <Button_M3 label={saving ? 'Salvando...' : 'Salvar Contato'} onClick={handleSalvar} type="button" disabled={saving} />
      </div>
    </div>
  );
};

export default Tab_ContatoEmergencia;
