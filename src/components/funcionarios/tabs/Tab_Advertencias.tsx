import React, { useRef, useState } from 'react';
import Button_M3 from '@/components/Formularios/Button_M3';
import { T_Advertencia } from '@/types/T_funcionariosCLT';
import S_funcionariosCLT from '@/services/S_funcionariosCLT';
import { notifyError, notifySuccess } from '@/utils/Functions';
import { uploadArquivoPasta, deleteArquivoPastaSubPasta } from '@/actions/DO_UploadFile';

const TIPOS_ADVERTENCIA = [
  { value: 'verbal', label: 'Advertência Verbal', className: 'bg-yellow-100 text-yellow-800' },
  { value: 'escrita', label: 'Advertência Escrita', className: 'bg-orange-100 text-orange-800' },
  { value: 'suspensao', label: 'Suspensão', className: 'bg-red-100 text-red-800' },
];

function formatDateBR(dateStr?: string) {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
}

const emptyAdvertencia: T_Advertencia = {
  data: '',
  tipo: 'verbal',
  motivo: '',
  observacoes: '',
};

interface Props {
  funcionarioId: string;
  advertencias: T_Advertencia[];
  onUpdate: (advertencias: T_Advertencia[]) => void;
}

const Tab_Advertencias: React.FC<Props> = ({ funcionarioId, advertencias: initial, onUpdate }) => {
  const [advertencias, setAdvertencias] = useState<T_Advertencia[]>(initial ?? []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<T_Advertencia>({ ...emptyAdvertencia });
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof T_Advertencia, value: any) => {
    setForm((p) => ({ ...p, [field]: value }));
  };

  const handleNovo = () => {
    setForm({ ...emptyAdvertencia, data: new Date().toISOString().split('T')[0] });
    setArquivo(null);
    if (fileRef.current) fileRef.current.value = '';
    setShowForm(true);
  };

  const handleSalvar = async () => {
    if (!form.data) { notifyError('Data é obrigatória.'); return; }
    if (!form.motivo.trim()) { notifyError('Motivo é obrigatório.'); return; }
    try {
      setSaving(true);
      let adv: T_Advertencia = { ...form, createdAt: new Date().toISOString() };

      if (arquivo) {
        const uploaded = await uploadArquivoPasta(
          arquivo,
          `funcionarios_clt/${funcionarioId}/advertencias`,
          arquivo.name
        );
        if (!uploaded) { notifyError('Falha ao enviar o arquivo. Tente novamente.'); setSaving(false); return; }
        adv = {
          ...adv,
          arquivoUrl: uploaded.cloudURL,
          arquivoNome: uploaded.filename,
          arquivoCloudNome: uploaded.cloudFilename,
        };
      }

      await S_funcionariosCLT.addAdvertencia(funcionarioId, adv);
      const updated = [...advertencias, adv];
      setAdvertencias(updated);
      onUpdate(updated);
      setShowForm(false);
      notifySuccess('Advertência registrada!');
    } catch {
      notifyError('Erro ao registrar advertência.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (index: number) => {
    if (!confirm('Remover esta advertência? A ação não pode ser desfeita.')) return;
    try {
      const adv = advertencias[index];
      if (adv.arquivoCloudNome) {
        await deleteArquivoPastaSubPasta(
          `funcionarios_clt/${funcionarioId}/advertencias`,
          adv.arquivoCloudNome
        );
      }
      await S_funcionariosCLT.deleteAdvertencia(funcionarioId, index);
      const updated = advertencias.filter((_, i) => i !== index);
      setAdvertencias(updated);
      onUpdate(updated);
      notifySuccess('Advertência removida.');
    } catch {
      notifyError('Erro ao remover advertência.');
    }
  };

  const contadores = {
    verbal: advertencias.filter((a) => a.tipo === 'verbal').length,
    escrita: advertencias.filter((a) => a.tipo === 'escrita').length,
    suspensao: advertencias.filter((a) => a.tipo === 'suspensao').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Advertências e Ocorrências</h3>
          {advertencias.length > 0 && (
            <p className="text-xs text-gray-500 mt-0.5">
              {contadores.verbal > 0 && `${contadores.verbal} verbal${contadores.verbal > 1 ? 'is' : ''}`}
              {contadores.verbal > 0 && (contadores.escrita > 0 || contadores.suspensao > 0) && ' · '}
              {contadores.escrita > 0 && `${contadores.escrita} escrita${contadores.escrita > 1 ? 's' : ''}`}
              {contadores.escrita > 0 && contadores.suspensao > 0 && ' · '}
              {contadores.suspensao > 0 && `${contadores.suspensao} suspensão${contadores.suspensao > 1 ? 'ões' : ''}`}
            </p>
          )}
        </div>
        {!showForm && (
          <Button_M3 label="+ Registrar" onClick={handleNovo} type="button" />
        )}
      </div>

      {showForm && (
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <h4 className="text-sm font-semibold text-red-800 mb-3">Nova Advertência / Ocorrência</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Tipo *</label>
              <select value={form.tipo} onChange={(e) => handleChange('tipo', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                {TIPOS_ADVERTENCIA.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Data *</label>
              <input type="date" value={form.data} onChange={(e) => handleChange('data', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            {form.tipo === 'suspensao' && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">Dias de Suspensão</label>
                <input
                  type="number" min={1} value={form.diasSuspensao ?? ''}
                  onChange={(e) => handleChange('diasSuspensao', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
            <div className={form.tipo === 'suspensao' ? '' : 'sm:col-span-2'}>
              <label className="block text-xs text-gray-600 mb-1">Documento Assinado (opcional)</label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-red-100 file:text-red-700 hover:file:bg-red-200 cursor-pointer"
              />
              {arquivo && <p className="text-xs text-green-600 mt-1">Selecionado: {arquivo.name}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Motivo *</label>
              <textarea value={form.motivo} onChange={(e) => handleChange('motivo', e.target.value)}
                rows={2} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Descreva o motivo detalhadamente..." />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Observações</label>
              <textarea value={form.observacoes ?? ''} onChange={(e) => handleChange('observacoes', e.target.value)}
                rows={2} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div className="flex gap-2 mt-3 justify-end">
            <Button_M3 label="Cancelar" onClick={() => setShowForm(false)} bgColor="gray" type="button" />
            <Button_M3 label={saving ? 'Salvando...' : 'Registrar'} onClick={handleSalvar} type="button" disabled={saving} />
          </div>
        </div>
      )}

      {advertencias.length === 0 && !showForm ? (
        <div className="text-center py-10 text-gray-400 text-sm">Nenhuma advertência ou ocorrência registrada.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Motivo</th>
                <th className="px-3 py-2">Observações</th>
                <th className="px-3 py-2">Documento</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...advertencias].reverse().map((a, rIdx) => {
                const idx = advertencias.length - 1 - rIdx;
                const tipo = TIPOS_ADVERTENCIA.find((t) => t.value === a.tipo);
                return (
                  <tr key={rIdx} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{formatDateBR(a.data)}</td>
                    <td className="px-3 py-2">
                      {tipo && (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${tipo.className}`}>
                          {tipo.label}
                          {a.diasSuspensao ? ` (${a.diasSuspensao}d)` : ''}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-700 max-w-[200px]">
                      <span className="block truncate" title={a.motivo}>{a.motivo}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-500 text-xs max-w-[140px]">
                      <span className="block truncate" title={a.observacoes}>{a.observacoes || '—'}</span>
                    </td>
                    <td className="px-3 py-2">
                      {a.arquivoUrl ? (
                        <a href={a.arquivoUrl} target="_blank" rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 text-xs underline">
                          Ver arquivo
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => handleDelete(idx)} className="text-red-500 hover:text-red-700 text-xs">Remover</button>
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

export default Tab_Advertencias;
