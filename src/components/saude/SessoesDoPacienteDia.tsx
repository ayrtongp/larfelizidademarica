import React, { useCallback, useEffect, useState } from 'react';
import { MeasurementSessionWithMeasurements } from '@/types/T_measurement';
import measurementService from '@/services/measurement.service';
import DetalhesSessao from './DetalhesSessao';

interface Props {
  patientId: string;
  patientName: string;
  date: string; // YYYY-MM-DD
}

function formatTimeBR(iso: string) {
  try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }); }
  catch { return iso; }
}

const SessoesDoPacienteDia: React.FC<Props> = ({ patientId, patientName, date }) => {
  const [sessions, setSessions] = useState<MeasurementSessionWithMeasurements[]>([]);
  const [loading, setLoading]   = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { sessions: data } = await measurementService.getSessions({
        patientId,
        dateFrom: date,
        dateTo:   date,
        limit:    50,
      });
      setSessions(data);
      if (data.length === 1) setExpanded(String(data[0]._id));
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [patientId, date]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="py-10 text-center text-sm text-gray-400">Carregando...</div>
  );

  if (sessions.length === 0) return (
    <div className="py-10 text-center text-gray-400">
      <p className="text-3xl mb-2">📋</p>
      <p className="text-sm">Nenhuma sessão registrada para {patientName} nesta data.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        {sessions.length} {sessions.length === 1 ? 'sessão registrada' : 'sessões registradas'}
      </p>

      {sessions.map(s => {
        const sid = String(s._id);
        const isOpen = expanded === sid;
        const active = s.measurements.filter(m => m.status !== 'cancelled');
        const hasCritical = active.some(m => m.abnormal_flag === 'HH' || m.abnormal_flag === 'LL');
        const hasAbnormal = active.some(m => m.abnormal_flag === 'H' || m.abnormal_flag === 'L');

        return (
          <div key={sid}
            className={`rounded-xl border transition-colors ${hasCritical ? 'border-red-200' : hasAbnormal ? 'border-yellow-200' : 'border-gray-200'}`}>

            {/* Cabeçalho da sessão — clicável */}
            <button className="w-full flex items-center justify-between px-4 py-3 text-left"
              onClick={() => setExpanded(isOpen ? null : sid)}>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${hasCritical ? 'text-red-600' : hasAbnormal ? 'text-yellow-700' : 'text-gray-700'}`}>
                  {formatTimeBR(s.measured_at)}
                </span>
                {s.location && <span className="text-xs text-gray-400">{s.location}</span>}
                {s.recorded_by_name && (
                  <span className="text-xs text-gray-400 hidden sm:inline">por {s.recorded_by_name}</span>
                )}
                <span className="text-xs text-gray-400">
                  {active.length} {active.length === 1 ? 'medição' : 'medições'}
                </span>
                {hasCritical && <span className="text-xs font-semibold bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">⚠ Crítico</span>}
                {!hasCritical && hasAbnormal && <span className="text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full">Anormal</span>}
              </div>
              <span className={`text-gray-400 text-lg transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}>›</span>
            </button>

            {/* Detalhes expandidos */}
            {isOpen && (
              <div className="border-t border-gray-100 px-4 py-4">
                <DetalhesSessao session={s} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SessoesDoPacienteDia;
