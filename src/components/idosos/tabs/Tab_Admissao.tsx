import React, { useEffect, useState } from 'react';
import Button_M3 from '@/components/Formularios/Button_M3';
import { T_Admissao, T_ResponsavelIdoso } from '@/types/T_idosoDetalhes';
import S_idosoDetalhes from '@/services/S_idosoDetalhes';
import { notifyError, notifySuccess } from '@/utils/Functions';

interface Props {
  idosoId: string;
  admissao: T_Admissao;
  responsavel: T_ResponsavelIdoso;
  onUpdate: (data: { admissao: T_Admissao; responsavel: T_ResponsavelIdoso }) => void;
}

const MODALIDADES = [
  { value: 'residencia_fixa',       label: 'Residência Fixa' },
  { value: 'residencia_temporaria', label: 'Residência Temporária' },
  { value: 'centro_dia',            label: 'Centro Dia' },
  { value: 'hotelaria',             label: 'Hotelaria' },
];

const Tab_Admissao: React.FC<Props> = ({ idosoId, admissao, responsavel, onUpdate }) => {
  const [adm, setAdm] = useState<T_Admissao>({ ...admissao });
  const [resp, setResp] = useState<T_ResponsavelIdoso>({ ...responsavel });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAdm({ ...admissao });
    setResp({ ...responsavel });
  }, [admissao, responsavel]);

  const handleSalvar = async () => {
    try {
      setSaving(true);
      await Promise.all([
        S_idosoDetalhes.updateAdmissao(idosoId, adm),
        S_idosoDetalhes.updateResponsavel(idosoId, resp),
      ]);
      onUpdate({ admissao: adm, responsavel: resp });
      notifySuccess('Dados de admissão atualizados!');
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
      {/* Admissão */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Dados de Admissão</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Data de Entrada *</label>
            <input type="date" value={adm.dataEntrada} onChange={(e) => setAdm(prev => ({ ...prev, dataEntrada: e.target.value }))}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Modalidade Principal *</label>
            <select value={adm.modalidadePrincipal} onChange={(e) => setAdm(prev => ({ ...prev, modalidadePrincipal: e.target.value as T_Admissao['modalidadePrincipal'] }))}
              className={inputClass}>
              {MODALIDADES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Nº Prontuário</label>
            <input type="text" value={adm.numProntuario ?? ''} onChange={(e) => setAdm(prev => ({ ...prev, numProntuario: e.target.value }))}
              className={inputClass} placeholder="Ex: PRN-001" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Motivo da Entrada</label>
            <input type="text" value={adm.motivoEntrada ?? ''} onChange={(e) => setAdm(prev => ({ ...prev, motivoEntrada: e.target.value }))}
              className={inputClass} />
          </div>
        </div>
      </div>

      <hr />

      {/* Responsável */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Responsável / Curador</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nome do Responsável</label>
            <input type="text" value={resp.nome ?? ''} onChange={(e) => setResp(prev => ({ ...prev, nome: e.target.value }))}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Parentesco</label>
            <input type="text" value={resp.parentesco ?? ''} onChange={(e) => setResp(prev => ({ ...prev, parentesco: e.target.value }))}
              className={inputClass} placeholder="Ex: Filho(a)" />
          </div>
          <div>
            <label className={labelClass}>Contato</label>
            <input type="text" value={resp.contato ?? ''} onChange={(e) => setResp(prev => ({ ...prev, contato: e.target.value }))}
              className={inputClass} placeholder="(00) 00000-0000" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id="interditado" checked={resp.interditado ?? false}
              onChange={(e) => setResp(prev => ({ ...prev, interditado: e.target.checked }))}
              className="rounded" />
            <label htmlFor="interditado" className="text-sm text-gray-700 cursor-pointer">Idoso interditado</label>
          </div>
          {resp.interditado && (
            <div className="sm:col-span-2">
              <label className={labelClass}>Nº do Processo de Interdição</label>
              <input type="text" value={resp.processoInterdicao ?? ''} onChange={(e) => setResp(prev => ({ ...prev, processoInterdicao: e.target.value }))}
                className={inputClass} />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button_M3 label={saving ? 'Salvando...' : 'Salvar'} onClick={handleSalvar} type="button" disabled={saving} />
      </div>
    </div>
  );
};

export default Tab_Admissao;
