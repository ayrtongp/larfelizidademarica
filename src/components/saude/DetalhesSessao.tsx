import React from 'react';
import { MeasurementSessionWithMeasurements, AbnormalFlag, MEASUREMENT_TYPES, CATEGORY_LABELS, MeasurementCategory } from '@/types/T_measurement';

interface Props {
  session: MeasurementSessionWithMeasurements;
}

const SOURCE_LABEL: Record<string, string> = {
  manual: 'Manual', device: 'Dispositivo', imported: 'Importado', corrected: 'Correção',
};

function formatDatetime(iso: string) {
  try { return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }); }
  catch { return iso; }
}

function FlagBadge({ flag }: { flag?: AbnormalFlag }) {
  if (!flag || flag === 'N') return <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">Normal</span>;
  const map: Record<AbnormalFlag, { label: string; cls: string }> = {
    H:  { label: '↑ Alto',         cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
    L:  { label: '↓ Baixo',        cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
    HH: { label: '↑↑ Crítico',     cls: 'bg-red-50 text-red-600 border border-red-200' },
    LL: { label: '↓↓ Crítico',     cls: 'bg-red-50 text-red-600 border border-red-200' },
    N:  { label: 'Normal',         cls: 'bg-green-50 text-green-600' },
  };
  const { label, cls } = map[flag];
  return <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cls}`}>{label}</span>;
}

const DetalhesSessao: React.FC<Props> = ({ session }) => {
  const active = session.measurements.filter(m => m.status !== 'cancelled');
  const hasCritical = active.some(m => m.abnormal_flag === 'HH' || m.abnormal_flag === 'LL');
  const hasAbnormal = active.some(m => m.abnormal_flag && m.abnormal_flag !== 'N');

  // Agrupar por categoria
  const byCategory = new Map<MeasurementCategory, typeof active>();
  for (const m of active) {
    const meta = MEASUREMENT_TYPES.find(t => t.code === m.type_code);
    const cat: MeasurementCategory = meta?.category ?? 'clinical';
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(m);
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-lg font-semibold text-gray-800">{session.patient_name ?? 'Idoso'}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            Aferido em <span className="font-medium text-gray-700">{formatDatetime(session.measured_at)}</span>
            {session.location && <> · <span className="text-gray-600">{session.location}</span></>}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Registrado em {formatDatetime(session.recorded_at)}
            {session.recorded_by_name && <> · por <span className="font-medium text-gray-500">{session.recorded_by_name}</span></>}
            {' · '}{SOURCE_LABEL[session.source_type] ?? session.source_type}
          </p>
        </div>
        {hasCritical && (
          <span className="shrink-0 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full">
            ⚠ Valor crítico
          </span>
        )}
        {!hasCritical && hasAbnormal && (
          <span className="shrink-0 text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1 rounded-full">
            Valor anormal
          </span>
        )}
      </div>

      {session.notes && (
        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
          {session.notes}
        </div>
      )}

      {/* Medições agrupadas por categoria */}
      {Array.from(byCategory.entries()).map(([cat, items]) => (
        <div key={cat}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {CATEGORY_LABELS[cat]}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {items.map((m, i) => {
              const isCritical = m.abnormal_flag === 'HH' || m.abnormal_flag === 'LL';
              const isAbnormal = m.abnormal_flag === 'H' || m.abnormal_flag === 'L';
              return (
                <div key={m._id ?? i}
                  className={`rounded-xl p-3 border ${isCritical ? 'border-red-200 bg-red-50' : isAbnormal ? 'border-yellow-200 bg-yellow-50' : 'border-gray-100 bg-gray-50'}`}>
                  <p className="text-xs text-gray-500 mb-1 truncate">{m.type_label}</p>
                  <p className={`text-xl font-bold leading-none ${isCritical ? 'text-red-600' : isAbnormal ? 'text-yellow-700' : 'text-gray-800'}`}>
                    {m.value_numeric !== undefined ? m.value_numeric : (m.value_text ?? '—')}
                    {m.unit && <span className="text-sm font-normal text-gray-400 ml-1">{m.unit}</span>}
                  </p>
                  <div className="mt-2">
                    <FlagBadge flag={m.abnormal_flag} />
                  </div>
                  {m.reference_min !== undefined && m.reference_max !== undefined && (
                    <p className="text-xs text-gray-400 mt-1">Ref: {m.reference_min}–{m.reference_max}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DetalhesSessao;
