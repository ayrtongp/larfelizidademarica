import React, { useEffect, useState } from 'react';
import Button_M3 from '@/components/Formularios/Button_M3';
import { T_DadosBancarios } from '@/types/T_funcionariosCLT';
import S_funcionariosCLT from '@/services/S_funcionariosCLT';
import { notifyError, notifySuccess } from '@/utils/Functions';

interface Props {
  funcionarioId: string;
  dadosBancarios: T_DadosBancarios;
  onUpdate: (dadosBancarios: T_DadosBancarios) => void;
}

const BANCOS_COMUNS = [
  '001 - Banco do Brasil',
  '033 - Santander',
  '104 - Caixa Econômica Federal',
  '237 - Bradesco',
  '341 - Itaú',
  '077 - Banco Inter',
  '260 - Nubank',
  '336 - C6 Bank',
  '290 - PagBank',
  'Outro',
];

const Tab_DadosBancarios: React.FC<Props> = ({ funcionarioId, dadosBancarios, onUpdate }) => {
  const [form, setForm] = useState<T_DadosBancarios>({ ...dadosBancarios });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...dadosBancarios });
  }, [dadosBancarios]);

  const handleChange = (field: keyof T_DadosBancarios, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSalvar = async () => {
    try {
      setSaving(true);
      await S_funcionariosCLT.updateDadosBancarios(funcionarioId, form);
      onUpdate(form);
      notifySuccess('Dados bancários atualizados!');
    } catch {
      notifyError('Erro ao salvar dados bancários.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs text-gray-600 mb-1">Banco</label>
          <select value={form.banco ?? ''} onChange={(e) => handleChange('banco', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
            <option value="">— selecione —</option>
            {BANCOS_COMUNS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Agência</label>
          <input type="text" value={form.agencia ?? ''} onChange={(e) => handleChange('agencia', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            placeholder="Ex: 1234-5" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Conta</label>
          <input type="text" value={form.conta ?? ''} onChange={(e) => handleChange('conta', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            placeholder="Ex: 12345-6" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Tipo de Conta</label>
          <select value={form.tipoConta ?? ''} onChange={(e) => handleChange('tipoConta', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
            <option value="">— selecione —</option>
            <option value="corrente">Conta Corrente</option>
            <option value="poupanca">Conta Poupança</option>
          </select>
        </div>
      </div>

      <hr />

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">PIX (opcional)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Tipo de Chave PIX</label>
            <select value={form.pixTipo ?? ''} onChange={(e) => handleChange('pixTipo', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
              <option value="">— selecione —</option>
              <option value="cpf">CPF</option>
              <option value="email">E-mail</option>
              <option value="celular">Celular</option>
              <option value="aleatoria">Chave Aleatória</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Chave PIX</label>
            <input type="text" value={form.pixChave ?? ''} onChange={(e) => handleChange('pixChave', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button_M3 label={saving ? 'Salvando...' : 'Salvar Dados Bancários'} onClick={handleSalvar} type="button" disabled={saving} />
      </div>
    </div>
  );
};

export default Tab_DadosBancarios;
