import React, { useEffect, useState } from 'react';
import Button_M3 from '@/components/Formularios/Button_M3';
import { T_MembroFamiliar } from '@/types/T_idosoDetalhes';
import S_idosoDetalhes from '@/services/S_idosoDetalhes';
import { notifyError, notifySuccess } from '@/utils/Functions';
import { FaTrash, FaPlus } from 'react-icons/fa';

interface Props {
  idosoId: string;
  composicaoFamiliar: T_MembroFamiliar[];
  onUpdate: (composicaoFamiliar: T_MembroFamiliar[]) => void;
}

const emptyMembro: T_MembroFamiliar = {
  nomeCompleto: '',
  parentesco: '',
  sexo: '',
  dataNascimento: '',
  contato: '',
};

const Tab_Familia: React.FC<Props> = ({ idosoId, composicaoFamiliar, onUpdate }) => {
  const [familia, setFamilia] = useState<T_MembroFamiliar[]>([...composicaoFamiliar]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFamilia([...composicaoFamiliar]);
  }, [composicaoFamiliar]);

  const handleAddMembro = () => {
    setFamilia((prev) => [...prev, { ...emptyMembro }]);
  };

  const handleRemoveMembro = (index: number) => {
    setFamilia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof T_MembroFamiliar, value: string) => {
    setFamilia((prev) => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const handleSalvar = async () => {
    const comNome = familia.filter((m) => m.nomeCompleto.trim());
    try {
      setSaving(true);
      await S_idosoDetalhes.updateFamilia(idosoId, comNome);
      onUpdate(comNome);
      notifySuccess('Composição familiar atualizada!');
    } catch {
      notifyError('Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500';
  const labelClass = 'block text-xs text-gray-600 mb-1';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Membros da composição familiar do idoso.</p>
        <button onClick={handleAddMembro}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium border border-indigo-300 px-2 py-1 rounded">
          <FaPlus size={10} /> Adicionar
        </button>
      </div>

      {familia.length === 0 && (
        <p className="text-sm text-gray-400 italic text-center py-4">Nenhum familiar cadastrado.</p>
      )}

      {familia.map((membro, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-600">Familiar #{index + 1}</p>
            <button onClick={() => handleRemoveMembro(index)}
              className="text-red-400 hover:text-red-600">
              <FaTrash size={12} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={labelClass}>Nome Completo *</label>
              <input type="text" value={membro.nomeCompleto} onChange={(e) => handleChange(index, 'nomeCompleto', e.target.value)}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Parentesco</label>
              <input type="text" value={membro.parentesco} onChange={(e) => handleChange(index, 'parentesco', e.target.value)}
                className={inputClass} placeholder="Ex: Filho(a)" />
            </div>
            <div>
              <label className={labelClass}>Sexo</label>
              <select value={membro.sexo ?? ''} onChange={(e) => handleChange(index, 'sexo', e.target.value)}
                className={inputClass}>
                <option value="">— selecione —</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Data de Nascimento</label>
              <input type="date" value={membro.dataNascimento ?? ''} onChange={(e) => handleChange(index, 'dataNascimento', e.target.value)}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Contato</label>
              <input type="text" value={membro.contato ?? ''} onChange={(e) => handleChange(index, 'contato', e.target.value)}
                className={inputClass} placeholder="(00) 00000-0000" />
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Button_M3 label={saving ? 'Salvando...' : 'Salvar Família'} onClick={handleSalvar} type="button" disabled={saving} />
      </div>
    </div>
  );
};

export default Tab_Familia;
