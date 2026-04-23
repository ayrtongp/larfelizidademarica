import React, { useEffect, useRef, useState } from 'react';

interface Item { label: string; sub?: string; }

interface BadgeProps {
  label:   string;
  icon:    React.ReactNode;
  ring:    string;   // ring color on hover/active
  header:  string;   // popover header bg
  dot:     string;   // list dot color
  count:   number;
  loading: boolean;
  items:   Item[];
  onClick: () => void;
}

function ClinicalBadge({ label, icon, ring, header, dot, count, loading, items, onClick }: BadgeProps) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const show = () => { clearTimeout(timer.current); setOpen(true); };
  const hide = () => { timer.current = setTimeout(() => setOpen(false), 120); };

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-white transition-all hover:shadow-md hover:${ring} hover:border-current focus:outline-none`}
      >
        <div className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">
          {icon}
        </div>
        <div className="text-left">
          <p className="text-xl font-bold leading-none text-gray-800">
            {loading ? <span className="text-gray-300">—</span> : count}
          </p>
          <p className="text-[11px] font-medium text-gray-500 mt-0.5">{label}</p>
        </div>
      </button>

      {open && !loading && (
        <div
          className="absolute left-0 top-full mt-1 z-50 w-60 bg-white border border-gray-200 rounded-lg shadow-xl"
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          <div className={`px-3 py-2 rounded-t-lg ${header}`}>
            <p className="text-xs font-semibold">{label}</p>
          </div>

          <ul className="py-1.5 px-2 space-y-0.5 max-h-44 overflow-y-auto">
            {items.length === 0 ? (
              <li className="text-xs text-gray-400 px-1 py-2 text-center">Nenhum registro.</li>
            ) : (
              items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 px-1 py-1 rounded hover:bg-gray-50">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-gray-800 block truncate">{item.label}</span>
                    {item.sub && <span className="text-[10px] text-gray-400">{item.sub}</span>}
                  </div>
                </li>
              ))
            )}
          </ul>

          <div className="px-3 py-1.5 border-t">
            <button
              onClick={onClick}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Ver e editar →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Labels ─────────────────────────────────────────────────────────────────

const CRITICALITY_LABELS: Record<string, string> = {
  high: 'Alta', low: 'Baixa', 'unable-to-assess': 'Inconclusiva',
};
const CONDITION_STATUS_LABELS: Record<string, string> = {
  active: 'Ativa', recurrence: 'Recorrente', relapse: 'Recaída',
  inactive: 'Inativa', remission: 'Remissão', resolved: 'Resolvida',
};
const PROCEDURE_STATUS_LABELS: Record<string, string> = {
  completed: 'Concluído', 'not-done': 'Não realizado',
  'in-progress': 'Em andamento', stopped: 'Interrompido',
};

function fmtDate(d?: string) {
  if (!d) return '';
  const p = d.split('T')[0].split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
}

// ── Icons ──────────────────────────────────────────────────────────────────

const IconAllergy = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-500 fill-current">
    <path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19h-17L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
  </svg>
);

const IconCondition = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 text-orange-500 fill-current">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const IconProcedure = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 text-purple-500 fill-current">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H9v-2h3v-3H9v-2h3V7h2v3h3v2h-3v3h3v2h-3v2h-2v-2z"/>
  </svg>
);

// ── Main ───────────────────────────────────────────────────────────────────

interface Props {
  patientId: string;
  onNavigate: () => void;
}

export default function ClinicalSummary({ patientId, onNavigate }: Props) {
  const [allergies,   setAllergies]   = useState<any[]>([]);
  const [conditions,  setConditions]  = useState<any[]>([]);
  const [procedures,  setProcedures]  = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/Controller/C_allergyIntolerance?type=getAll&patient_id=${patientId}`).then((r) => r.ok ? r.json() : []),
      fetch(`/api/Controller/C_condition?type=getAll&patient_id=${patientId}`).then((r) => r.ok ? r.json() : []),
      fetch(`/api/Controller/C_procedure?type=getAll&patient_id=${patientId}`).then((r) => r.ok ? r.json() : []),
    ]).then(([a, c, p]) => {
      setAllergies(Array.isArray(a) ? a : []);
      setConditions(Array.isArray(c) ? c : []);
      setProcedures(Array.isArray(p) ? p : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [patientId]);

  if (!patientId) return null;

  const allergyItems: Item[] = allergies.map((a) => ({
    label: a.code?.text ?? '—',
    sub: a.criticality ? CRITICALITY_LABELS[a.criticality] : undefined,
  }));

  const conditionItems: Item[] = conditions.map((c) => ({
    label: c.code?.text ?? '—',
    sub: c.code?.coding?.[0]?.code
      ? `CID: ${c.code.coding[0].code}`
      : (c.clinicalStatus ? CONDITION_STATUS_LABELS[c.clinicalStatus] : undefined),
  }));

  const procedureItems: Item[] = procedures.map((p) => ({
    label: p.code?.text ?? '—',
    sub: p.performedDateTime
      ? fmtDate(p.performedDateTime)
      : (p.status ? PROCEDURE_STATUS_LABELS[p.status] : undefined),
  }));

  return (
    <div className="grid grid-cols-3 gap-2">
      <ClinicalBadge
        label="Alergias"
        icon={<IconAllergy />}
        ring="ring-red-300"
        header="bg-red-50 text-red-700"
        dot="bg-red-400"
        count={allergies.length}
        loading={loading}
        items={allergyItems}
        onClick={onNavigate}
      />
      <ClinicalBadge
        label="Comorbidades"
        icon={<IconCondition />}
        ring="ring-orange-300"
        header="bg-orange-50 text-orange-700"
        dot="bg-orange-400"
        count={conditions.length}
        loading={loading}
        items={conditionItems}
        onClick={onNavigate}
      />
      <ClinicalBadge
        label="Procedimentos"
        icon={<IconProcedure />}
        ring="ring-purple-300"
        header="bg-purple-50 text-purple-700"
        dot="bg-purple-400"
        count={procedures.length}
        loading={loading}
        items={procedureItems}
        onClick={onNavigate}
      />
    </div>
  );
}
