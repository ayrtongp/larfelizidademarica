import React, { useCallback, useEffect, useState } from 'react';
import { MeasurementSessionWithMeasurements } from '@/types/T_measurement';
import measurementService from '@/services/measurement.service';
import Modalpadrao from '@/components/ModalPadrao';
import DetalhesSessao from './DetalhesSessao';
import { notifyError, notifySuccess } from '@/utils/Functions';

interface Props { refreshKey: number; }

const PAGE_SIZE = 15;

function formatDatetime(iso: string) {
  try { return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }); }
  catch { return iso; }
}

function typesSummary(measurements: MeasurementSessionWithMeasurements['measurements']) {
  const labels = measurements.filter(m => m.status !== 'cancelled').map(m => m.type_label);
  if (labels.length === 0) return '—';
  if (labels.length <= 3) return labels.join(', ');
  return `${labels.slice(0, 3).join(', ')} +${labels.length - 3}`;
}

function AnomalyBadge({ measurements }: { measurements: MeasurementSessionWithMeasurements['measurements'] }) {
  const active = measurements.filter(m => m.status !== 'cancelled');
  const hasCritical = active.some(m => m.abnormal_flag === 'HH' || m.abnormal_flag === 'LL');
  const hasAbnormal = active.some(m => m.abnormal_flag === 'H' || m.abnormal_flag === 'L');
  if (hasCritical) return <span className="inline-block w-2 h-2 rounded-full bg-red-500 ml-1.5" title="Valor crítico" />;
  if (hasAbnormal) return <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 ml-1.5" title="Valor anormal" />;
  return null;
}

const TabelaSessoes: React.FC<Props> = ({ refreshKey }) => {
  const [sessions, setSessions] = useState<MeasurementSessionWithMeasurements[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo]     = useState(() => new Date().toISOString().slice(0, 10));
  const [elderFilter, setElderFilter] = useState('');
  const [selected, setSelected] = useState<MeasurementSessionWithMeasurements | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { sessions: data, total: t } = await measurementService.getSessions({
        dateFrom: dateFrom || undefined,
        dateTo:   dateTo   || undefined,
        page, limit: PAGE_SIZE,
      });
      setSessions(data);
      setTotal(t);
    } catch { notifyError('Erro ao carregar histórico.'); }
    finally  { setLoading(false); }
  }, [dateFrom, dateTo, page, refreshKey]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Cancelar esta sessão de medição?')) return;
    try {
      await measurementService.deleteSession(id);
      notifySuccess('Sessão cancelada.');
      load();
    } catch { notifyError('Erro ao cancelar sessão.'); }
  };

  const filtered = elderFilter.trim()
    ? sessions.filter(s => s.patient_name?.toLowerCase().includes(elderFilter.toLowerCase()))
    : sessions;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">

      {/* Filtros */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 items-end">
        <div>
          <p className="text-xs text-gray-400 mb-1">De</p>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Até</p>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-400 mb-1">Idoso</p>
          <input type="text" value={elderFilter} onChange={e => setElderFilter(e.target.value)}
            placeholder="Filtrar por nome..." className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm sm:w-48 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <p className="text-xs text-gray-400 col-span-2 sm:ml-auto sm:self-end sm:pb-1">{total} registros</p>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm">Nenhuma sessão encontrada para o período.</p>
        </div>
      ) : (
        <>
          {/* Mobile: lista de cards */}
          <div className="sm:hidden space-y-2">
            {filtered.map(s => (
              <div key={String(s._id)}
                className="rounded-xl border border-gray-100 bg-white p-4 cursor-pointer hover:bg-indigo-50/20 transition-colors"
                onClick={() => setSelected(s)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-800 text-sm truncate">{s.patient_name ?? '—'}</span>
                      <AnomalyBadge measurements={s.measurements} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDatetime(s.measured_at)}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">{typesSummary(s.measurements)}</p>
                    {s.location && <p className="text-xs text-gray-400 mt-0.5">{s.location}</p>}
                  </div>
                  <button onClick={e => { e.stopPropagation(); handleDelete(String(s._id!)); }}
                    className="shrink-0 text-gray-300 hover:text-red-400 transition-colors p-1 rounded"
                    title="Cancelar sessão">
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: tabela */}
          <div className="hidden sm:block rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Data / Hora</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Idoso</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Medições</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Local</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={String(s._id)}
                    className="border-t border-gray-50 hover:bg-indigo-50/30 transition-colors cursor-pointer"
                    onClick={() => setSelected(s)}>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{formatDatetime(s.measured_at)}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">{s.patient_name ?? '—'}</span>
                      <AnomalyBadge measurements={s.measurements} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{typesSummary(s.measurements)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{s.location ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={e => { e.stopPropagation(); handleDelete(String(s._id!)); }}
                        className="text-gray-300 hover:text-red-400 transition-colors px-2 py-1 rounded"
                        title="Cancelar sessão">
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex gap-2 items-center text-sm">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
            ‹ Anterior
          </button>
          <span className="text-gray-400 text-xs">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
            Próximo ›
          </button>
        </div>
      )}

      {/* Modal detalhe */}
      <Modalpadrao isOpen={!!selected} onClose={() => setSelected(null)}>
        {selected && <DetalhesSessao session={selected} />}
      </Modalpadrao>
    </div>
  );
};

export default TabelaSessoes;
