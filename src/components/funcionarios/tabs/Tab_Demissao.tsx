import React, { useState } from 'react';
import Button_M3 from '@/components/Formularios/Button_M3';
import { T_FuncionarioCLT } from '@/types/T_funcionariosCLT';
import S_funcionariosCLT from '@/services/S_funcionariosCLT';
import { notifyError, notifySuccess } from '@/utils/Functions';

interface Props {
  funcionarioId: string;
  status: T_FuncionarioCLT['status'];
  dataDemissao?: string;
  tipoDemissao?: T_FuncionarioCLT['tipoDemissao'];
  motivoDemissao?: string;
  onUpdate: (data: { status: T_FuncionarioCLT['status']; dataDemissao?: string; tipoDemissao?: T_FuncionarioCLT['tipoDemissao']; motivoDemissao?: string }) => void;
}

const TIPOS_DEMISSAO = [
  { value: 'sem_justa_causa', label: 'Demissão Sem Justa Causa' },
  { value: 'com_justa_causa', label: 'Demissão Com Justa Causa' },
  { value: 'pedido_demissao', label: 'Pedido de Demissão' },
  { value: 'aposentadoria', label: 'Aposentadoria' },
  { value: 'falecimento', label: 'Falecimento' },
  { value: 'acordo', label: 'Acordo (art. 484-A CLT)' },
  { value: 'outro', label: 'Outro' },
];

const STATUS_OPTIONS = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'afastado', label: 'Afastado' },
  { value: 'ferias', label: 'Férias' },
];

const Tab_Demissao: React.FC<Props> = ({ funcionarioId, status, dataDemissao, tipoDemissao, motivoDemissao, onUpdate }) => {
  const [formStatus, setFormStatus] = useState(status !== 'demitido' ? status : 'ativo');
  const [formData, setFormData] = useState(dataDemissao ?? '');
  const [formTipo, setFormTipo] = useState<T_FuncionarioCLT['tipoDemissao']>(tipoDemissao ?? 'sem_justa_causa');
  const [formMotivo, setFormMotivo] = useState(motivoDemissao ?? '');
  const [saving, setSaving] = useState(false);

  const handleAlterarStatus = async () => {
    if (!confirm(`Confirmar alteração de status para "${STATUS_OPTIONS.find(s => s.value === formStatus)?.label}"?`)) return;
    try {
      setSaving(true);
      await S_funcionariosCLT.updateStatus(funcionarioId, formStatus as 'ativo' | 'afastado' | 'ferias');
      onUpdate({ status: formStatus as T_FuncionarioCLT['status'] });
      notifySuccess('Status atualizado!');
    } catch {
      notifyError('Erro ao atualizar status.');
    } finally {
      setSaving(false);
    }
  };

  const handleDemitir = async () => {
    if (!formData) { notifyError('Data de demissão é obrigatória.'); return; }
    if (!formTipo) { notifyError('Tipo de demissão é obrigatório.'); return; }
    if (!confirm('Confirmar demissão do funcionário? Esta ação é reversível pelo RH.')) return;
    try {
      setSaving(true);
      await S_funcionariosCLT.demitir(funcionarioId, {
        dataDemissao: formData,
        tipoDemissao: formTipo,
        motivoDemissao: formMotivo,
      });
      onUpdate({ status: 'demitido', dataDemissao: formData, tipoDemissao: formTipo, motivoDemissao: formMotivo });
      notifySuccess('Funcionário demitido.');
    } catch {
      notifyError('Erro ao registrar demissão.');
    } finally {
      setSaving(false);
    }
  };

  const handleReativar = async () => {
    if (!confirm('Reativar este funcionário?')) return;
    try {
      setSaving(true);
      await S_funcionariosCLT.reativar(funcionarioId);
      onUpdate({ status: 'ativo', dataDemissao: undefined, tipoDemissao: undefined, motivoDemissao: undefined });
      notifySuccess('Funcionário reativado!');
    } catch {
      notifyError('Erro ao reativar.');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'demitido') {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-red-700 mb-2">Funcionário Demitido</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
            <div><span className="text-xs text-gray-500">Data:</span> <strong>{dataDemissao ? `${dataDemissao.split('-')[2]}/${dataDemissao.split('-')[1]}/${dataDemissao.split('-')[0]}` : '—'}</strong></div>
            <div><span className="text-xs text-gray-500">Tipo:</span> <strong>{TIPOS_DEMISSAO.find(t => t.value === tipoDemissao)?.label ?? tipoDemissao ?? '—'}</strong></div>
            {motivoDemissao && <div className="sm:col-span-2"><span className="text-xs text-gray-500">Motivo:</span> <strong>{motivoDemissao}</strong></div>}
          </div>
        </div>
        <div className="flex justify-end">
          <Button_M3 label={saving ? 'Aguarde...' : 'Reativar Funcionário'} onClick={handleReativar} bgColor="green" type="button" disabled={saving} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alterar status (não demissão) */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-1">Alterar Status</h3>
        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Status</label>
            <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as 'ativo' | 'afastado' | 'ferias')}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <Button_M3 label={saving ? 'Salvando...' : 'Atualizar Status'} onClick={handleAlterarStatus} type="button" disabled={saving} />
        </div>
      </div>

      {/* Registrar demissão */}
      <div>
        <h3 className="text-sm font-semibold text-red-600 mb-3 border-b pb-1">Registrar Demissão</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Data de Demissão *</label>
            <input type="date" value={formData} onChange={(e) => setFormData(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Tipo de Demissão *</label>
            <select value={formTipo} onChange={(e) => setFormTipo(e.target.value as T_FuncionarioCLT['tipoDemissao'])}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
              {TIPOS_DEMISSAO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Motivo / Observação</label>
            <textarea value={formMotivo} onChange={(e) => setFormMotivo(e.target.value)}
              rows={2} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button_M3 label={saving ? 'Registrando...' : 'Registrar Demissão'} onClick={handleDemitir} bgColor="red" type="button" disabled={saving} />
        </div>
      </div>
    </div>
  );
};

export default Tab_Demissao;
