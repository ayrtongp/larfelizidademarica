import React, { useRef, useState } from 'react';
import Button_M3 from '@/components/Formularios/Button_M3';
import { T_AtestadoMedico } from '@/types/T_funcionariosCLT';
import S_funcionariosCLT from '@/services/S_funcionariosCLT';
import { notifyError, notifySuccess } from '@/utils/Functions';
import { uploadArquivoPasta, deleteArquivoPastaSubPasta } from '@/actions/DO_UploadFile';

const TIPOS_ATESTADO = [
  { value: 'doenca_comum', label: 'Doença Comum' },
  { value: 'acidente_trabalho', label: 'Acidente de Trabalho' },
  { value: 'acidente_trajeto', label: 'Acidente de Trajeto' },
  { value: 'licenca_maternidade', label: 'Licença Maternidade' },
  { value: 'licenca_paternidade', label: 'Licença Paternidade' },
  { value: 'cirurgia', label: 'Cirurgia' },
  { value: 'outro', label: 'Outro' },
];

const emptyAtestado: T_AtestadoMedico = {
  data: '',
  dataInicio: '',
  dataFim: '',
  tipo: 'doenca_comum',
  cid: '',
  medico: '',
  crm: '',
  observacoes: '',
};

function formatDateBR(dateStr?: string) {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
}

function calcDias(ini?: string, fim?: string): number {
  if (!ini || !fim) return 0;
  const diff = Math.round((new Date(fim).getTime() - new Date(ini).getTime()) / 86400000) + 1;
  return diff > 0 ? diff : 0;
}

function isAtivo(a: T_AtestadoMedico): boolean {
  if (!a.dataInicio || !a.dataFim) return false;
  const hoje = new Date();
  return new Date(a.dataInicio) <= hoje && hoje <= new Date(a.dataFim);
}

interface Props {
  funcionarioId: string;
  atestados: T_AtestadoMedico[];
  onUpdate: (atestados: T_AtestadoMedico[]) => void;
}

const Tab_AtestadosMedicos: React.FC<Props> = ({ funcionarioId, atestados: initial, onUpdate }) => {
  const [atestados, setAtestados] = useState<T_AtestadoMedico[]>(initial ?? []);
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<T_AtestadoMedico>({ ...emptyAtestado });
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof T_AtestadoMedico, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNovo = () => {
    setForm({ ...emptyAtestado, data: new Date().toISOString().split('T')[0] });
    setArquivo(null);
    setEditingIndex(null);
    setShowForm(true);
  };

  const handleEdit = (index: number) => {
    setForm({ ...atestados[index] });
    setArquivo(null);
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleSalvar = async () => {
    if (!form.data) { notifyError('Data de emissão é obrigatória.'); return; }
    if (!form.dataInicio || !form.dataFim) { notifyError('Período de afastamento é obrigatório.'); return; }
    if (new Date(form.dataFim) < new Date(form.dataInicio)) { notifyError('Data fim deve ser após a data de início.'); return; }

    try {
      setSaving(true);
      let atestadoFinal: T_AtestadoMedico = {
        ...form,
        diasAfastamento: calcDias(form.dataInicio, form.dataFim),
        createdAt: form.createdAt || new Date().toISOString(),
      };

      if (arquivo) {
        if (editingIndex !== null && atestados[editingIndex]?.arquivoCloudNome) {
          await deleteArquivoPastaSubPasta(
            `funcionarios_clt/${funcionarioId}/atestados`,
            atestados[editingIndex].arquivoCloudNome!
          );
        }
        const uploaded = await uploadArquivoPasta(
          arquivo,
          `funcionarios_clt/${funcionarioId}/atestados`,
          arquivo.name
        );
        if (!uploaded) { notifyError('Falha ao enviar o arquivo. Tente novamente.'); setSaving(false); return; }
        atestadoFinal = {
          ...atestadoFinal,
          arquivoUrl: uploaded.cloudURL,
          arquivoNome: uploaded.filename,
          arquivoCloudNome: uploaded.cloudFilename,
        };
      }

      let updated: T_AtestadoMedico[];
      if (editingIndex !== null) {
        await S_funcionariosCLT.updateAtestado(funcionarioId, editingIndex, atestadoFinal);
        updated = atestados.map((a, i) => (i === editingIndex ? atestadoFinal : a));
      } else {
        await S_funcionariosCLT.addAtestado(funcionarioId, atestadoFinal);
        updated = [...atestados, atestadoFinal];
      }

      setAtestados(updated);
      onUpdate(updated);
      setShowForm(false);
      notifySuccess('Atestado salvo com sucesso!');
    } catch {
      notifyError('Erro ao salvar atestado.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (index: number) => {
    if (!confirm('Remover este atestado?')) return;
    try {
      const atestado = atestados[index];
      if (atestado.arquivoCloudNome) {
        await deleteArquivoPastaSubPasta(
          `funcionarios_clt/${funcionarioId}/atestados`,
          atestado.arquivoCloudNome
        );
      }
      await S_funcionariosCLT.deleteAtestado(funcionarioId, index);
      const updated = atestados.filter((_, i) => i !== index);
      setAtestados(updated);
      onUpdate(updated);
      notifySuccess('Atestado removido.');
    } catch {
      notifyError('Erro ao remover atestado.');
    }
  };

  const diasCalculados = calcDias(form.dataInicio, form.dataFim);
  const periodoValido = form.dataInicio && form.dataFim && new Date(form.dataFim) >= new Date(form.dataInicio);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700">Atestados Médicos</h3>
        {!showForm && (
          <Button_M3 label="+ Novo Atestado" onClick={handleNovo} type="button" />
        )}
      </div>

      {showForm && (
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <h4 className="text-sm font-semibold text-orange-800 mb-3">
            {editingIndex !== null ? 'Editar Atestado' : 'Novo Atestado Médico'}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Tipo *</label>
              <select value={form.tipo} onChange={(e) => handleChange('tipo', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                {TIPOS_ATESTADO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Data de Emissão *</label>
              <input type="date" value={form.data} onChange={(e) => handleChange('data', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Início do Afastamento *</label>
              <input type="date" value={form.dataInicio} onChange={(e) => handleChange('dataInicio', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Fim do Afastamento *</label>
              <input type="date" value={form.dataFim} onChange={(e) => handleChange('dataFim', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            {periodoValido && (
              <div className="sm:col-span-2">
                <span className="text-xs text-orange-700 font-semibold bg-orange-100 px-2 py-1 rounded">
                  {diasCalculados} dia{diasCalculados !== 1 ? 's' : ''} de afastamento
                </span>
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-600 mb-1">CID</label>
              <input type="text" value={form.cid ?? ''} onChange={(e) => handleChange('cid', e.target.value)}
                placeholder="ex: B34.9"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Médico</label>
              <input type="text" value={form.medico ?? ''} onChange={(e) => handleChange('medico', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">CRM</label>
              <input type="text" value={form.crm ?? ''} onChange={(e) => handleChange('crm', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Anexo do Atestado</label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 cursor-pointer"
              />
              {editingIndex !== null && atestados[editingIndex]?.arquivoNome && !arquivo && (
                <p className="text-xs text-gray-500 mt-1">
                  Atual: <span className="font-medium">{atestados[editingIndex].arquivoNome}</span>
                  <span className="ml-1 text-gray-400">(selecione um novo para substituir)</span>
                </p>
              )}
              {arquivo && <p className="text-xs text-green-600 mt-1">Selecionado: {arquivo.name}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Observações</label>
              <textarea value={form.observacoes ?? ''} onChange={(e) => handleChange('observacoes', e.target.value)}
                rows={2} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div className="flex gap-2 mt-3 justify-end">
            <Button_M3 label="Cancelar" onClick={() => setShowForm(false)} bgColor="gray" type="button" />
            <Button_M3 label={saving ? 'Salvando...' : 'Salvar Atestado'} onClick={handleSalvar} type="button" disabled={saving} />
          </div>
        </div>
      )}

      {atestados.length === 0 && !showForm ? (
        <div className="text-center py-10 text-gray-400 text-sm">Nenhum atestado médico cadastrado.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-3 py-2">Emissão</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Período de Afastamento</th>
                <th className="px-3 py-2">Dias</th>
                <th className="px-3 py-2">CID</th>
                <th className="px-3 py-2">Médico</th>
                <th className="px-3 py-2">Arquivo</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {atestados.map((a, index) => {
                const ativo = isAtivo(a);
                return (
                  <tr key={index} className={`hover:bg-gray-50 ${ativo ? 'bg-orange-50' : ''}`}>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{formatDateBR(a.data)}</td>
                    <td className="px-3 py-2 text-gray-700">
                      <span>{TIPOS_ATESTADO.find((t) => t.value === a.tipo)?.label ?? a.tipo}</span>
                      {ativo && (
                        <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-semibold">
                          Vigente
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                      {formatDateBR(a.dataInicio)} – {formatDateBR(a.dataFim)}
                    </td>
                    <td className="px-3 py-2 text-gray-600 text-center">
                      {a.diasAfastamento ?? calcDias(a.dataInicio, a.dataFim)}
                    </td>
                    <td className="px-3 py-2 text-gray-500">{a.cid || '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{a.medico || '—'}</td>
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
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(index)} className="text-indigo-600 hover:text-indigo-800 text-xs">Editar</button>
                        <button onClick={() => handleDelete(index)} className="text-red-500 hover:text-red-700 text-xs">Remover</button>
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

export default Tab_AtestadosMedicos;
