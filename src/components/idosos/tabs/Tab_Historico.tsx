import React, { useEffect, useState } from 'react';
import Button_M3 from '@/components/Formularios/Button_M3';
import { T_DocumentosIdoso, T_HistoricoIdoso } from '@/types/T_idosoDetalhes';
import S_idosoDetalhes from '@/services/S_idosoDetalhes';
import { notifyError, notifySuccess } from '@/utils/Functions';

interface Props {
  idosoId: string;
  historico: T_HistoricoIdoso;
  documentos: T_DocumentosIdoso;
  onUpdate: (data: { historico: T_HistoricoIdoso; documentos: T_DocumentosIdoso }) => void;
}

const ESCOLARIDADE = [
  { value: 'fundamental_incompleto', label: 'Fundamental Incompleto' },
  { value: 'fundamental_completo',   label: 'Fundamental Completo' },
  { value: 'medio_incompleto',       label: 'Médio Incompleto' },
  { value: 'medio_completo',         label: 'Médio Completo' },
  { value: 'superior_incompleto',    label: 'Superior Incompleto' },
  { value: 'superior_completo',      label: 'Superior Completo' },
  { value: 'pos_graduacao',          label: 'Pós-Graduação' },
];

const ESTADO_CIVIL = [
  { value: 'solteiro',       label: 'Solteiro(a)' },
  { value: 'casado',         label: 'Casado(a)' },
  { value: 'divorciado',     label: 'Divorciado(a)' },
  { value: 'viuvo',          label: 'Viúvo(a)' },
  { value: 'uniao_estavel',  label: 'União Estável' },
  { value: 'outro',          label: 'Outro' },
];

const Tab_Historico: React.FC<Props> = ({ idosoId, historico, documentos, onUpdate }) => {
  const [hist, setHist] = useState<T_HistoricoIdoso>({ ...historico });
  const [docs, setDocs] = useState<T_DocumentosIdoso>({ ...documentos });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setHist({ ...historico });
    setDocs({ ...documentos });
  }, [historico, documentos]);

  const handleHistChange = (field: keyof T_HistoricoIdoso, value: string) => {
    setHist((prev) => ({ ...prev, [field]: value }));
  };

  const handleDocsChange = (field: keyof T_DocumentosIdoso, value: string) => {
    setDocs((prev) => ({ ...prev, [field]: value }));
  };

  const handleSalvar = async () => {
    try {
      setSaving(true);
      await S_idosoDetalhes.updateHistorico(idosoId, hist, docs);
      onUpdate({ historico: hist, documentos: docs });
      notifySuccess('Histórico atualizado!');
    } catch {
      notifyError('Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500';
  const labelClass = 'block text-xs text-gray-600 mb-1';

  return (
    <div className="space-y-6">
      {/* Histórico Social */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Histórico Social</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Profissão</label>
            <input type="text" value={hist.profissao ?? ''} onChange={(e) => handleHistChange('profissao', e.target.value)}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Religião</label>
            <input type="text" value={hist.religiao ?? ''} onChange={(e) => handleHistChange('religiao', e.target.value)}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Estado Civil</label>
            <select value={hist.estadoCivil ?? ''} onChange={(e) => handleHistChange('estadoCivil', e.target.value)}
              className={inputClass}>
              <option value="">— selecione —</option>
              {ESTADO_CIVIL.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Escolaridade</label>
            <select value={hist.escolaridade ?? ''} onChange={(e) => handleHistChange('escolaridade', e.target.value)}
              className={inputClass}>
              <option value="">— selecione —</option>
              {ESCOLARIDADE.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Naturalidade</label>
            <input type="text" value={hist.naturalidade ?? ''} onChange={(e) => handleHistChange('naturalidade', e.target.value)}
              className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Endereço de Origem</label>
            <input type="text" value={hist.enderecoOrigem ?? ''} onChange={(e) => handleHistChange('enderecoOrigem', e.target.value)}
              className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Decisão sobre a Moradia</label>
            <input type="text" value={hist.decisaoMoradia ?? ''} onChange={(e) => handleHistChange('decisaoMoradia', e.target.value)}
              className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Motivo da Moradia</label>
            <input type="text" value={hist.motivoMoradia ?? ''} onChange={(e) => handleHistChange('motivoMoradia', e.target.value)}
              className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Rotina Anterior à Institucionalização</label>
            <input type="text" value={hist.rotinaAnterior ?? ''} onChange={(e) => handleHistChange('rotinaAnterior', e.target.value)}
              className={inputClass} />
          </div>
        </div>
      </div>

      <hr />

      {/* Documentos físicos */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Referências de Documentos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {([
            ['carteiraVacinacao', 'Carteira de Vacinação'],
            ['certidaoNasCas',    'Certidão de Nasc./Casamento'],
            ['identidade',        'RG / Identidade'],
            ['tituloEleitor',     'Título de Eleitor'],
            ['reservista',        'Reservista'],
            ['carteiraTrabalho',  'Carteira de Trabalho'],
          ] as [keyof T_DocumentosIdoso, string][]).map(([field, label]) => (
            <div key={field}>
              <label className={labelClass}>{label}</label>
              <input type="text" value={docs[field] ?? ''} onChange={(e) => handleDocsChange(field, e.target.value)}
                className={inputClass} placeholder="Localização ou número" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button_M3 label={saving ? 'Salvando...' : 'Salvar Histórico'} onClick={handleSalvar} type="button" disabled={saving} />
      </div>
    </div>
  );
};

export default Tab_Historico;
