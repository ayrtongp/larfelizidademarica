import React, { useState } from 'react';
import Button_M3 from '@/components/Formularios/Button_M3';
import { T_ASO, T_SaudeOcupacional } from '@/types/T_funcionariosCLT';
import S_funcionariosCLT from '@/services/S_funcionariosCLT';
import { notifyError, notifySuccess } from '@/utils/Functions';

interface Props {
  funcionarioId: string;
  saudeOcupacional: T_SaudeOcupacional;
  onUpdate: (saude: T_SaudeOcupacional) => void;
}

const TIPOS_ASO = [
  { value: 'admissional', label: 'Admissional' },
  { value: 'periodico', label: 'Periódico' },
  { value: 'retorno_trabalho', label: 'Retorno ao Trabalho' },
  { value: 'mudanca_funcao', label: 'Mudança de Função' },
  { value: 'demissional', label: 'Demissional' },
];

const RESULTADOS = [
  { value: 'apto', label: 'Apto', className: 'bg-green-100 text-green-800' },
  { value: 'apto_restricoes', label: 'Apto c/ Restrições', className: 'bg-yellow-100 text-yellow-800' },
  { value: 'inapto', label: 'Inapto', className: 'bg-red-100 text-red-800' },
];

const emptyASO: T_ASO = {
  tipo: 'admissional',
  data: '',
  dataVencimento: '',
  resultado: 'apto',
  observacoes: '',
};

function formatDateBR(dateStr?: string) {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
}

function isVencimentoProximo(dateStr?: string): boolean {
  if (!dateStr) return false;
  const vencimento = new Date(dateStr);
  const hoje = new Date();
  const diff = (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 30;
}

function isVencido(dateStr?: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

const Tab_SaudeOcupacional: React.FC<Props> = ({ funcionarioId, saudeOcupacional, onUpdate }) => {
  const [asos, setAsos] = useState<T_ASO[]>(saudeOcupacional?.asos ?? []);
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formASO, setFormASO] = useState<T_ASO>({ ...emptyASO });
  const [saving, setSaving] = useState(false);

  const handleASOChange = (field: keyof T_ASO, value: string) => {
    setFormASO((prev) => ({ ...prev, [field]: value }));
  };

  const handleNovoASO = () => {
    setFormASO({ ...emptyASO });
    setEditingIndex(null);
    setShowForm(true);
  };

  const handleEditASO = (index: number) => {
    setFormASO({ ...asos[index] });
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleSalvarASO = async () => {
    if (!formASO.data) { notifyError('Data do ASO é obrigatória.'); return; }
    try {
      setSaving(true);
      let updatedAsos: T_ASO[];
      if (editingIndex !== null) {
        await S_funcionariosCLT.updateASO(funcionarioId, editingIndex, formASO);
        updatedAsos = asos.map((a, i) => i === editingIndex ? formASO : a);
      } else {
        await S_funcionariosCLT.addASO(funcionarioId, formASO);
        updatedAsos = [...asos, formASO];
      }
      setAsos(updatedAsos);
      onUpdate({ asos: updatedAsos });
      setShowForm(false);
      notifySuccess('ASO salvo com sucesso!');
    } catch {
      notifyError('Erro ao salvar ASO.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteASO = async (index: number) => {
    if (!confirm('Remover este ASO?')) return;
    try {
      await S_funcionariosCLT.deleteASO(funcionarioId, index);
      const updatedAsos = asos.filter((_, i) => i !== index);
      setAsos(updatedAsos);
      onUpdate({ asos: updatedAsos });
      notifySuccess('ASO removido.');
    } catch {
      notifyError('Erro ao remover ASO.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700">ASOs — Atestados de Saúde Ocupacional</h3>
        {!showForm && (
          <Button_M3 label="+ Novo ASO" onClick={handleNovoASO} type="button" />
        )}
      </div>

      {/* Formulário inline */}
      {showForm && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-800 mb-3">{editingIndex !== null ? 'Editar ASO' : 'Novo ASO'}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Tipo *</label>
              <select value={formASO.tipo} onChange={(e) => handleASOChange('tipo', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                {TIPOS_ASO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Resultado *</label>
              <select value={formASO.resultado} onChange={(e) => handleASOChange('resultado', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                {RESULTADOS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Data do ASO *</label>
              <input type="date" value={formASO.data} onChange={(e) => handleASOChange('data', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Validade (vencimento)</label>
              <input type="date" value={formASO.dataVencimento ?? ''} onChange={(e) => handleASOChange('dataVencimento', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Observações</label>
              <textarea value={formASO.observacoes ?? ''} onChange={(e) => handleASOChange('observacoes', e.target.value)}
                rows={2} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div className="flex gap-2 mt-3 justify-end">
            <Button_M3 label="Cancelar" onClick={() => setShowForm(false)} bgColor="gray" type="button" />
            <Button_M3 label={saving ? 'Salvando...' : 'Salvar ASO'} onClick={handleSalvarASO} type="button" disabled={saving} />
          </div>
        </div>
      )}

      {/* Tabela de ASOs */}
      {asos.length === 0 && !showForm ? (
        <div className="text-center py-10 text-gray-400 text-sm">Nenhum ASO cadastrado.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2">Vencimento</th>
                <th className="px-3 py-2">Resultado</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {asos.map((aso, index) => {
                const resultado = RESULTADOS.find((r) => r.value === aso.resultado);
                const vencimentoAlerta = isVencimentoProximo(aso.dataVencimento);
                const vencido = isVencido(aso.dataVencimento);
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-700">
                      {TIPOS_ASO.find((t) => t.value === aso.tipo)?.label ?? aso.tipo}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{formatDateBR(aso.data)}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs font-medium ${vencido ? 'text-red-600' : vencimentoAlerta ? 'text-yellow-600' : 'text-gray-600'}`}>
                        {formatDateBR(aso.dataVencimento)}
                        {vencido && ' ⚠ Vencido'}
                        {!vencido && vencimentoAlerta && ' ⚠ Vence em breve'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {resultado && (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${resultado.className}`}>
                          {resultado.label}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button onClick={() => handleEditASO(index)} className="text-indigo-600 hover:text-indigo-800 text-xs">Editar</button>
                        <button onClick={() => handleDeleteASO(index)} className="text-red-500 hover:text-red-700 text-xs">Remover</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Tab_SaudeOcupacional;
