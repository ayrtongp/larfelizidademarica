import React, { useEffect, useState } from 'react';
import Button_M3 from '@/components/Formularios/Button_M3';
import { T_ContratoPrestador } from '@/types/T_prestadoresServico';
import S_prestadoresServico from '@/services/S_prestadoresServico';
import { notifyError, notifySuccess } from '@/utils/Functions';

interface Props {
  prestadorId: string;
  contrato: T_ContratoPrestador;
  onUpdate: (contrato: T_ContratoPrestador) => void;
}

const TIPOS_COBRANCA = [
  { value: 'hora', label: 'Por hora' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'fixo', label: 'Valor fixo' },
  { value: 'diaria', label: 'Diária' },
];

const PERIODICIDADE = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'quinzenal', label: 'Quinzenal' },
  { value: 'mensal', label: 'Mensal' },
];

const Tab_Contrato: React.FC<Props> = ({ prestadorId, contrato, onUpdate }) => {
  const [form, setForm] = useState<Omit<T_ContratoPrestador, 'valor'> & { valor: string }>({
    ...contrato,
    valor: String(contrato.valor ?? ''),
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...contrato, valor: String(contrato.valor ?? '') });
  }, [contrato]);

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSalvar = async () => {
    if (!form.tipoServico.trim()) { notifyError('Tipo de serviço é obrigatório.'); return; }
    const valorNum = parseFloat(String(form.valor).replace(',', '.'));
    if (isNaN(valorNum)) { notifyError('Valor inválido.'); return; }

    try {
      setSaving(true);
      const contratoFinal: T_ContratoPrestador = {
        ...form,
        valor: valorNum,
      };
      await S_prestadoresServico.updateContrato(prestadorId, contratoFinal);
      onUpdate(contratoFinal);
      notifySuccess('Contrato atualizado!');
    } catch {
      notifyError('Erro ao salvar contrato.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500';
  const labelClass = 'block text-xs text-gray-600 mb-1';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelClass}>Tipo de Serviço *</label>
          <input type="text" value={form.tipoServico} onChange={(e) => handleChange('tipoServico', e.target.value)}
            className={inputClass} placeholder="Ex: Fisioterapia, TI, Limpeza" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Descrição do Serviço</label>
          <input type="text" value={form.descricaoServico ?? ''} onChange={(e) => handleChange('descricaoServico', e.target.value)}
            className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Tipo de Cobrança *</label>
          <select value={form.tipoCobranca} onChange={(e) => handleChange('tipoCobranca', e.target.value)}
            className={inputClass}>
            {TIPOS_COBRANCA.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Valor (R$) *</label>
          <input type="text" value={form.valor} onChange={(e) => handleChange('valor', e.target.value)}
            className={inputClass} placeholder="Ex: 2500.00" />
        </div>
        <div>
          <label className={labelClass}>Data de Início *</label>
          <input type="date" value={form.dataInicio} onChange={(e) => handleChange('dataInicio', e.target.value)}
            className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Data de Fim (opcional)</label>
          <input type="date" value={form.dataFim ?? ''} onChange={(e) => handleChange('dataFim', e.target.value)}
            className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Periodicidade de Pagamento</label>
          <select value={form.periodicidadePagamento} onChange={(e) => handleChange('periodicidadePagamento', e.target.value)}
            className={inputClass}>
            {PERIODICIDADE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Dia de Pagamento (1–31)</label>
          <input type="number" value={form.diaPagamento ?? ''} onChange={(e) => handleChange('diaPagamento', e.target.value ? parseInt(e.target.value) : undefined)}
            className={inputClass} min={1} max={31} placeholder="Ex: 5" />
        </div>
        <div>
          <label className={labelClass}>CNAE do Serviço</label>
          <input type="text" value={form.cnaeServico ?? ''} onChange={(e) => handleChange('cnaeServico', e.target.value)}
            className={inputClass} placeholder="Ex: 8650-0/01" />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input type="checkbox" id="emiteNF" checked={form.emiteNF} onChange={(e) => handleChange('emiteNF', e.target.checked)}
            className="rounded" />
          <label htmlFor="emiteNF" className="text-sm text-gray-700 cursor-pointer">Emite Nota Fiscal (NF)</label>
        </div>
      </div>

      <div className="flex justify-end">
        <Button_M3 label={saving ? 'Salvando...' : 'Salvar Contrato'} onClick={handleSalvar} type="button" disabled={saving} />
      </div>
    </div>
  );
};

export default Tab_Contrato;
