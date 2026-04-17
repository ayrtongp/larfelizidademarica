import React, { useCallback, useEffect, useState } from 'react';
import { MEASUREMENT_TYPES, PANEL_COLUMNS, MeasurementTypeCode, AbnormalFlag } from '@/types/T_measurement';
import Modalpadrao from '@/components/ModalPadrao';
import SessoesDoPacienteDia from './SessoesDoPacienteDia';

interface ElderSummary {
  patient_id: string;
  patient_name: string;
  latest: Record<string, {
    value_numeric?: number;
    value_text?: string;
    unit?: string;
    abnormal_flag?: string;
    measured_at: string;
  }>;
}

interface Props {
  date: string;        // YYYY-MM-DD
  refreshKey?: number; // incrementar para forçar reload
  onNovaSessionForElder?: (elderId: string, elderName: string) => void;
}

function flagStyle(flag?: string): string {
  if (!flag || flag === 'N') return 'text-gray-700';
  if (flag === 'HH' || flag === 'LL') return 'text-red-600 font-bold';
  return 'text-yellow-700 font-semibold';
}

function flagBg(flag?: string): string {
  if (!flag || flag === 'N') return '';
  if (flag === 'HH' || flag === 'LL') return 'bg-red-50';
  return 'bg-yellow-50';
}

function formatValue(code: MeasurementTypeCode, entry?: ElderSummary['latest'][string]): string {
  if (!entry) return '—';
  const v = entry.value_numeric;
  if (v === undefined) return entry.value_text ?? '—';
  // BP_SYS é mostrado junto com BP_DIA no painel — tratado externamente
  return String(v);
}

const PainelHoje: React.FC<Props> = ({ date, refreshKey, onNovaSessionForElder }) => {
  const [data, setData] = useState<ElderSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/Controller/measurement.controller?type=getTodaySummary&date=${date}`);
      const json: ElderSummary[] = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [date, refreshKey]);

  useEffect(() => { load(); }, [load]);

  // Colunas: PA (SYS/DIA combinados), depois os demais
  const columns: { code: MeasurementTypeCode; label: string; unit: string }[] = PANEL_COLUMNS.map(code => {
    const m = MEASUREMENT_TYPES.find(t => t.code === code)!;
    return { code, label: m.shortLabel, unit: m.unit };
  });

  if (loading) return (
    <div className="flex items-center justify-center py-16 text-gray-400">
      <svg className="animate-spin mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
      </svg>
      Carregando...
    </div>
  );

  if (data.length === 0) return (
    <div className="text-center py-16 text-gray-400">
      <p className="text-4xl mb-3">📋</p>
      <p className="font-medium text-gray-500">Nenhuma medição registrada hoje</p>
      <p className="text-sm mt-1">Clique em &quot;Nova Sessão&quot; para iniciar o registro.</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {/* ── Mobile: cards por idoso ─────────────────────────── */}
      <div className="sm:hidden space-y-3">
        {data.map(elder => {
          const rowHasCritical = Object.values(elder.latest).some(e => e.abnormal_flag === 'HH' || e.abnormal_flag === 'LL');
          const rowHasAbnormal = Object.values(elder.latest).some(e => e.abnormal_flag === 'H' || e.abnormal_flag === 'L');

          const sys = elder.latest['BP_SYS'];
          const dia = elder.latest['BP_DIA'];
          const paDisplay = sys && dia ? `${sys.value_numeric}/${dia.value_numeric}` : sys ? String(sys.value_numeric) : null;
          const paFlag = sys?.abnormal_flag || dia?.abnormal_flag;

          return (
            <div key={elder.patient_id}
              className={`rounded-xl border p-4 cursor-pointer hover:shadow-sm transition-shadow ${rowHasCritical ? 'border-red-200 bg-red-50/40' : rowHasAbnormal ? 'border-yellow-200 bg-yellow-50/30' : 'border-gray-100 bg-white'}`}
              onClick={() => setSelected({ id: elder.patient_id, name: elder.patient_name })}>
              <div className="flex items-center gap-2 mb-3">
                {(rowHasCritical || rowHasAbnormal) && (
                  <span className={`w-2 h-2 rounded-full shrink-0 ${rowHasCritical ? 'bg-red-500' : 'bg-yellow-400'}`} />
                )}
                <span className="font-semibold text-gray-800 text-sm">{elder.patient_name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {paDisplay && (
                  <div className={`rounded-lg p-2 text-center ${flagBg(paFlag) || 'bg-gray-50'}`}>
                    <p className="text-xs text-gray-400 mb-0.5">PA</p>
                    <p className={`text-sm font-bold ${flagStyle(paFlag)}`}>{paDisplay}</p>
                    <p className="text-xs text-gray-300">mmHg</p>
                  </div>
                )}
                {columns.filter(c => c.code !== 'BP_SYS').map(col => {
                  const entry = elder.latest[col.code];
                  if (!entry) return null;
                  return (
                    <div key={col.code} className={`rounded-lg p-2 text-center ${flagBg(entry.abnormal_flag) || 'bg-gray-50'}`}>
                      <p className="text-xs text-gray-400 mb-0.5">{col.label}</p>
                      <p className={`text-sm font-bold ${flagStyle(entry.abnormal_flag)}`}>{formatValue(col.code, entry)}</p>
                      {col.unit && <p className="text-xs text-gray-300">{col.unit}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Desktop: tabela ────────────────────────────────── */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Idoso</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                PA <span className="text-gray-300 font-normal">mmHg</span>
              </th>
              {columns.filter(c => c.code !== 'BP_SYS').map(col => (
                <th key={col.code} className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {col.label} {col.unit && <span className="text-gray-300 font-normal">{col.unit}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(elder => {
              const rowHasCritical = Object.values(elder.latest).some(e => e.abnormal_flag === 'HH' || e.abnormal_flag === 'LL');
              const rowHasAbnormal = Object.values(elder.latest).some(e => e.abnormal_flag === 'H' || e.abnormal_flag === 'L');

              const sys = elder.latest['BP_SYS'];
              const dia = elder.latest['BP_DIA'];
              const paDisplay = sys && dia
                ? `${sys.value_numeric}/${dia.value_numeric}`
                : sys ? String(sys.value_numeric) : '—';
              const paFlag = sys?.abnormal_flag || dia?.abnormal_flag;

              return (
                <tr key={elder.patient_id}
                  className={`border-t border-gray-50 transition-colors hover:bg-indigo-50/30 cursor-pointer
                    ${rowHasCritical ? 'bg-red-50/40' : rowHasAbnormal ? 'bg-yellow-50/30' : ''}`}
                  onClick={() => setSelected({ id: elder.patient_id, name: elder.patient_name })}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {(rowHasCritical || rowHasAbnormal) && (
                        <span className={`w-2 h-2 rounded-full shrink-0 ${rowHasCritical ? 'bg-red-500' : 'bg-yellow-400'}`} />
                      )}
                      <span className="font-medium text-gray-800">{elder.patient_name}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-center ${flagBg(paFlag)}`}>
                    <span className={flagStyle(paFlag)}>{paDisplay}</span>
                  </td>
                  {columns.filter(c => c.code !== 'BP_SYS').map(col => {
                    const entry = elder.latest[col.code];
                    return (
                      <td key={col.code} className={`px-4 py-3 text-center ${flagBg(entry?.abnormal_flag)}`}>
                        <span className={flagStyle(entry?.abnormal_flag)}>
                          {formatValue(col.code, entry)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Legenda */}
        <div className="flex gap-4 px-4 py-2 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Valor crítico</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Valor anormal</span>
          <span className="ml-auto">— = não registrado hoje</span>
        </div>
      </div>

      {/* Legenda mobile */}
      <div className="flex gap-4 sm:hidden text-xs text-gray-400 px-1">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Crítico</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Anormal</span>
        <span className="ml-auto text-gray-300">Toque para ver histórico do dia</span>
      </div>

      {/* Modal: sessões do paciente no dia */}
      <Modalpadrao isOpen={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-4">
            <div>
              <p className="text-base font-semibold text-gray-800">{selected.name}</p>
              <p className="text-sm text-gray-400">Sessões do dia {date.split('-').reverse().join('/')}</p>
            </div>
            <SessoesDoPacienteDia
              patientId={selected.id}
              patientName={selected.name}
              date={date}
            />
          </div>
        )}
      </Modalpadrao>
    </div>
  );
};

export default PainelHoje;
