import React, { useEffect, useMemo, useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaRegCalendarCheck } from 'react-icons/fa';

interface EventosProps {
  data: string;
  titulo: string;
  horario?: string;
  observacao?: string;
  categoria?: 'agenda' | 'aniversario' | 'data_importante' | 'outro';
}

interface Props {
  eventos: EventosProps[];
}

interface ParsedEvento extends EventosProps {
  iso: string;
  date: Date;
  categoria: 'agenda' | 'aniversario' | 'data_importante' | 'outro';
}

const WEEK_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
const SUMMARY_ORDER: ParsedEvento['categoria'][] = ['agenda', 'aniversario', 'data_importante'];

const CATEGORY_META: Record<ParsedEvento['categoria'], { label: string; dot: string; chip: string }> = {
  agenda: {
    label: 'Agenda',
    dot: 'bg-sky-500',
    chip: 'bg-sky-100 text-sky-700',
  },
  aniversario: {
    label: 'Aniversarios',
    dot: 'bg-amber-500',
    chip: 'bg-amber-100 text-amber-700',
  },
  data_importante: {
    label: 'Datas importantes',
    dot: 'bg-violet-500',
    chip: 'bg-violet-100 text-violet-700',
  },
  outro: {
    label: 'Outros',
    dot: 'bg-slate-400',
    chip: 'bg-slate-100 text-slate-700',
  },
};

function parseBrDate(dateString: string): Date | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return null;
  const [day, month, year] = dateString.split('/').map(Number);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function formatIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoDate(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function formatLongDate(date: Date) {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function buildCalendarDays(referenceDate: Date) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - firstWeekday);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return {
      date,
      iso: formatIso(date),
      day: date.getDate(),
      inCurrentMonth: date.getMonth() === month,
    };
  });
}

function sortEventsByDate(events: ParsedEvento[]) {
  return [...events].sort((a, b) => {
    const timeDiff = a.date.getTime() - b.date.getTime();
    if (timeDiff !== 0) return timeDiff;
    return String(a.horario || '').localeCompare(String(b.horario || ''));
  });
}

function buildCategoryCounts(events: ParsedEvento[]) {
  return events.reduce(
    (acc, evento) => {
      acc[evento.categoria] += 1;
      return acc;
    },
    {
      agenda: 0,
      aniversario: 0,
      data_importante: 0,
      outro: 0,
    } as Record<ParsedEvento['categoria'], number>,
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

function EventCard({ evento, compact = false }: { evento: ParsedEvento; compact?: boolean }) {
  const meta = CATEGORY_META[evento.categoria];

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.chip}`}>
          {meta.label}
        </span>

        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {evento.data}
          </p>
          {evento.horario && (
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {evento.horario}
            </p>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm font-semibold leading-5 text-slate-800">
        {evento.titulo}
      </p>

      {!compact && evento.observacao && (
        <p className="mt-2 text-sm leading-5 text-slate-500">
          {evento.observacao}
        </p>
      )}
    </article>
  );
}

const CalendarioM1 = ({ eventos }: Props) => {
  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => formatIso(today), [today]);

  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedIso, setSelectedIso] = useState(todayIso);

  const parsedEvents = useMemo(() => {
    const validEvents = eventos
      .map((evento) => {
        const parsedDate = parseBrDate(evento.data);
        if (!parsedDate) return null;

        return {
          ...evento,
          date: parsedDate,
          iso: formatIso(parsedDate),
          categoria: evento.categoria || 'outro',
        } as ParsedEvento;
      })
      .filter(Boolean) as ParsedEvento[];

    return sortEventsByDate(validEvents);
  }, [eventos]);

  const eventsByIso = useMemo(() => {
    const grouped = new Map<string, ParsedEvento[]>();

    parsedEvents.forEach((evento) => {
      const current = grouped.get(evento.iso) || [];
      grouped.set(evento.iso, [...current, evento]);
    });

    return grouped;
  }, [parsedEvents]);

  const monthEvents = useMemo(
    () =>
      parsedEvents.filter(
        (evento) =>
          evento.date.getMonth() === viewDate.getMonth() &&
          evento.date.getFullYear() === viewDate.getFullYear(),
      ),
    [parsedEvents, viewDate],
  );

  useEffect(() => {
    const selectedDate = parseIsoDate(selectedIso);
    const selectedIsInMonth = selectedDate
      ? selectedDate.getMonth() === viewDate.getMonth() &&
        selectedDate.getFullYear() === viewDate.getFullYear()
      : false;

    if (selectedIsInMonth) return;

    const firstEventOfMonth = monthEvents[0]?.iso;
    const shouldUseToday =
      today.getMonth() === viewDate.getMonth() &&
      today.getFullYear() === viewDate.getFullYear();

    if (firstEventOfMonth) {
      setSelectedIso(firstEventOfMonth);
      return;
    }

    setSelectedIso(shouldUseToday ? todayIso : formatIso(new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)));
  }, [monthEvents, selectedIso, today, todayIso, viewDate]);

  const calendarDays = useMemo(() => buildCalendarDays(viewDate), [viewDate]);
  const selectedDate = useMemo(() => parseIsoDate(selectedIso), [selectedIso]);
  const selectedEvents = useMemo(() => eventsByIso.get(selectedIso) || [], [eventsByIso, selectedIso]);

  const monthCategoryCounts = useMemo(() => buildCategoryCounts(monthEvents), [monthEvents]);

  const summaryItems = useMemo(() => {
    const baseItems = SUMMARY_ORDER.map((categoria) => ({
      categoria,
      total: monthCategoryCounts[categoria],
    }));

    if (monthCategoryCounts.outro > 0) {
      baseItems.push({ categoria: 'outro', total: monthCategoryCounts.outro });
    }

    return baseItems;
  }, [monthCategoryCounts]);

  const upcomingMonthEvents = useMemo(() => {
    return monthEvents
      .filter((evento) => {
        if (!selectedDate) return true;
        return evento.date.getTime() >= selectedDate.getTime();
      })
      .slice(0, 5);
  }, [monthEvents, selectedDate]);

  function changeMonth(offset: number) {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  }

  function goToToday() {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedIso(todayIso);
  }

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-bold capitalize text-gray-700">
            {formatMonthLabel(viewDate)}
          </h2>
          <div className="flex items-center gap-3">
            {summaryItems.map(({ categoria, total }) => {
              const meta = CATEGORY_META[categoria];
              return (
                <span key={categoria} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${meta.dot}`} />
                  <span>{meta.label}</span>
                  <span className="font-semibold text-gray-700">{total}</span>
                </span>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50"
            aria-label="Mes anterior"
          >
            <FaChevronLeft size={11} />
          </button>

          <button
            type="button"
            onClick={goToToday}
            className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Hoje
          </button>

          <button
            type="button"
            onClick={() => changeMonth(1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50"
            aria-label="Proximo mes"
          >
            <FaChevronRight size={11} />
          </button>
        </div>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr),360px]">
        <div className="p-4 sm:p-5">
          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 xl:hidden">
            <h3 className="text-sm font-semibold capitalize text-gray-800">
              {selectedDate ? formatLongDate(selectedDate) : 'Selecione um dia'}
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              {selectedEvents.length > 0
                ? `${selectedEvents.length} evento(s) nessa data`
                : 'Nenhum evento cadastrado nessa data.'}
            </p>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {WEEK_DAYS.map((weekDay) => (
              <div
                key={weekDay}
                className="px-1 pb-1 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400"
              >
                {weekDay}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-2">
            {calendarDays.map((day) => {
              const dayEvents = eventsByIso.get(day.iso) || [];
              const categories = Array.from(new Set(dayEvents.map((evento) => evento.categoria)));
              const isToday = day.iso === todayIso;
              const isSelected = day.iso === selectedIso;

              return (
                <button
                  key={day.iso}
                  type="button"
                  onClick={() => setSelectedIso(day.iso)}
                  className={[
                    'group min-h-[72px] rounded-lg border p-2 text-left transition sm:min-h-[96px] sm:p-3',
                    day.inCurrentMonth ? 'bg-white' : 'bg-slate-50/70',
                    isSelected
                      ? 'border-sky-300 bg-sky-50 shadow-[0_0_0_3px_rgba(125,211,252,0.32)]'
                      : 'border-slate-200 hover:border-sky-200 hover:bg-slate-50',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={[
                        'inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold',
                        isToday
                          ? 'bg-slate-900 text-white'
                          : day.inCurrentMonth
                            ? 'text-slate-700'
                            : 'text-slate-400',
                      ].join(' ')}
                    >
                      {day.day}
                    </span>

                    {dayEvents.length > 0 && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 sm:text-[11px]">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1">
                    {categories.slice(0, 3).map((categoria) => (
                      <span
                        key={`${day.iso}-${categoria}`}
                        className={`h-2 w-2 rounded-full ${CATEGORY_META[categoria].dot}`}
                      />
                    ))}
                  </div>

                  {dayEvents[0] && (
                    <p className="mt-2 hidden line-clamp-2 text-[11px] leading-4 text-slate-500 sm:block">
                      {dayEvents[0].titulo}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 space-y-6 xl:hidden">
            <div>
              <p className="mb-3 text-xs font-semibold text-gray-500">Dia em foco</p>

              {selectedEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedEvents.map((evento, index) => (
                    <EventCard key={`${evento.iso}-${evento.titulo}-${index}`} evento={evento} />
                  ))}
                </div>
              ) : (
                <EmptyState text="Nenhum registro para esse dia." />
              )}
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2">
                <FaRegCalendarCheck className="text-gray-400" size={13} />
                <p className="text-xs font-semibold text-gray-500">Próximos do mês</p>
              </div>

              {upcomingMonthEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingMonthEvents.map((evento, index) => (
                    <EventCard key={`${evento.iso}-upcoming-mobile-${evento.titulo}-${index}`} evento={evento} compact />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Nenhum evento para os proximos dias deste mes.
                </p>
              )}
            </div>
          </div>
        </div>

        <aside className="hidden border-l border-gray-200 bg-gray-50 p-5 xl:block">
          <div className="mb-4">
            <h3 className="text-sm font-semibold capitalize text-gray-800">
              {selectedDate ? formatLongDate(selectedDate) : 'Selecione um dia'}
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              {selectedEvents.length > 0
                ? `${selectedEvents.length} evento(s) nessa data`
                : 'Nenhum evento cadastrado nessa data.'}
            </p>
          </div>

          <div className="space-y-3">
            {selectedEvents.length > 0 ? (
              selectedEvents.map((evento, index) => (
                <EventCard key={`${evento.iso}-${evento.titulo}-${index}`} evento={evento} />
              ))
            ) : (
              <EmptyState text="Nenhum registro para esse dia." />
            )}
          </div>

          <div className="mt-5 border-t border-gray-200 pt-4">
            <div className="mb-3 flex items-center gap-2">
              <FaRegCalendarCheck className="text-gray-400" size={13} />
              <p className="text-xs font-semibold text-gray-500">
                Próximos do mês
              </p>
            </div>

            <div className="space-y-3">
              {upcomingMonthEvents.length > 0 ? (
                upcomingMonthEvents.map((evento, index) => (
                  <EventCard key={`${evento.iso}-upcoming-${evento.titulo}-${index}`} evento={evento} compact />
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  Nenhum evento para os proximos dias deste mes.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default CalendarioM1;
