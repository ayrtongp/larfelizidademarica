import React, { useCallback, useEffect, useState } from 'react';
import { T_AllergyIntolerance } from '@/types/T_allergyIntolerance';
import { T_Condition } from '@/types/T_condition';
import { T_Procedure } from '@/types/T_procedure';

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(d?: string) {
  if (!d) return '';
  const parts = d.split('T')[0].split('-');
  if (parts.length < 3) return d;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

const Badge = ({ text, color }: { text: string; color: string }) => (
  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${color}`}>{text}</span>
);

// ── Label maps ─────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  food: 'Alimento', medication: 'Medicamento', environment: 'Ambiente', biologic: 'Biológico',
};
const CRITICALITY_LABELS: Record<string, string> = {
  low: 'Baixa', high: 'Alta', 'unable-to-assess': 'Inconclusiva',
};
const ALLERGY_STATUS_LABELS: Record<string, string> = {
  active: 'Ativa', inactive: 'Inativa', resolved: 'Resolvida',
};
const CONDITION_STATUS_LABELS: Record<string, string> = {
  active: 'Ativa', recurrence: 'Recorrente', relapse: 'Recaída',
  inactive: 'Inativa', remission: 'Remissão', resolved: 'Resolvida',
};
const VERIFICATION_LABELS: Record<string, string> = {
  confirmed: 'Confirmada', unconfirmed: 'Não confirmada',
  provisional: 'Provisional', differential: 'Diferencial',
  refuted: 'Refutada', 'entered-in-error': 'Erro de registro',
};
const SEVERITY_LABELS: Record<string, string> = {
  mild: 'Leve', moderate: 'Moderada', severe: 'Grave',
};
const PROCEDURE_STATUS_LABELS: Record<string, string> = {
  completed: 'Concluído', 'not-done': 'Não realizado',
  'in-progress': 'Em andamento', stopped: 'Interrompido',
};

// ──────────────────────────────────────────────────────────────────────────
// ALERGIAS SECTION
// ──────────────────────────────────────────────────────────────────────────

type AllergyForm = {
  code_text: string; category: string; criticality: string;
  clinicalStatus: string; verificationStatus: string;
  manifestations: string; severity: string; onsetDateTime: string; note: string;
};

const ALLERGY_EMPTY: AllergyForm = {
  code_text: '', category: 'medication', criticality: 'high',
  clinicalStatus: 'active', verificationStatus: 'confirmed',
  manifestations: '', severity: '', onsetDateTime: '', note: '',
};

function allergyToForm(a: T_AllergyIntolerance): AllergyForm {
  return {
    code_text: a.code?.text ?? '',
    category: a.category?.[0] ?? 'medication',
    criticality: a.criticality ?? 'high',
    clinicalStatus: a.clinicalStatus ?? 'active',
    verificationStatus: a.verificationStatus ?? 'confirmed',
    manifestations: a.reaction?.[0]?.manifestation?.join(', ') ?? '',
    severity: a.reaction?.[0]?.severity ?? '',
    onsetDateTime: a.onsetDateTime ?? '',
    note: a.note ?? '',
  };
}

function formToAllergy(f: AllergyForm, patientId: string): Partial<T_AllergyIntolerance> {
  return {
    patient_id: patientId,
    code: { text: f.code_text },
    category: f.category ? [f.category as any] : undefined,
    criticality: (f.criticality as any) || undefined,
    clinicalStatus: f.clinicalStatus as any,
    verificationStatus: f.verificationStatus as any,
    reaction: f.manifestations ? [{
      manifestation: f.manifestations.split(',').map((s) => s.trim()).filter(Boolean),
      severity: (f.severity as any) || undefined,
    }] : undefined,
    onsetDateTime: f.onsetDateTime || undefined,
    note: f.note || undefined,
  };
}

function AlergiasSection({ patientId }: { patientId: string }) {
  const [items, setItems] = useState<T_AllergyIntolerance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AllergyForm>(ALLERGY_EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/Controller/C_allergyIntolerance?type=getAll&patient_id=${patientId}`);
      const data = res.ok ? await res.json() : [];
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  function startAdd() { setForm(ALLERGY_EMPTY); setEditingId(null); setShowForm(true); }
  function startEdit(a: T_AllergyIntolerance) { setForm(allergyToForm(a)); setEditingId(a._id!); setShowForm(true); }
  function cancelForm() { setShowForm(false); setEditingId(null); }

  async function save() {
    if (!form.code_text.trim()) return;
    setSaving(true);
    try {
      const payload = formToAllergy(form, patientId);
      if (editingId) {
        await fetch(`/api/Controller/C_allergyIntolerance?type=update&id=${editingId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/Controller/C_allergyIntolerance?type=new', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
      }
      setShowForm(false); setEditingId(null); load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Excluir esta alergia?')) return;
    await fetch(`/api/Controller/C_allergyIntolerance?type=delete&id=${id}`, { method: 'DELETE' });
    load();
  }

  const f = (k: keyof AllergyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          Alergias e Intolerâncias
          {items.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">{items.length}</span>
          )}
        </h3>
        {!showForm && (
          <button onClick={startAdd} className="text-xs px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded font-medium hover:bg-red-100 transition-colors">
            + Adicionar
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-gray-400 py-2">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <div key={a._id} className="flex items-start justify-between p-2.5 rounded-lg bg-red-50 border border-red-100">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="text-sm font-medium text-gray-800">{a.code?.text}</span>
                  {a.category?.[0] && (
                    <Badge text={CATEGORY_LABELS[a.category[0]] ?? a.category[0]} color="bg-blue-100 text-blue-700" />
                  )}
                  {a.criticality && (
                    <Badge
                      text={CRITICALITY_LABELS[a.criticality] ?? a.criticality}
                      color={a.criticality === 'high' ? 'bg-red-200 text-red-800' : 'bg-yellow-100 text-yellow-700'}
                    />
                  )}
                  {a.verificationStatus && (
                    <Badge text={VERIFICATION_LABELS[a.verificationStatus] ?? a.verificationStatus} color="bg-gray-100 text-gray-600" />
                  )}
                  {a.clinicalStatus !== 'active' && a.clinicalStatus && (
                    <Badge text={ALLERGY_STATUS_LABELS[a.clinicalStatus] ?? a.clinicalStatus} color="bg-gray-200 text-gray-500" />
                  )}
                </div>
                {(a.reaction?.[0]?.manifestation?.length ?? 0) > 0 && (
                  <p className="text-xs text-gray-500">Manifestações: {a.reaction![0].manifestation.join(', ')}</p>
                )}
                {a.onsetDateTime && <p className="text-xs text-gray-400 mt-0.5">Desde: {fmtDate(a.onsetDateTime)}</p>}
                {a.note && <p className="text-xs text-gray-400 mt-0.5 italic">{a.note}</p>}
              </div>
              <div className="flex gap-1 ml-2 shrink-0">
                <button onClick={() => startEdit(a)} className="text-[11px] px-2 py-1 rounded bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">Editar</button>
                <button onClick={() => remove(a._id!)} className="text-[11px] px-2 py-1 rounded bg-white border border-gray-200 text-red-500 hover:bg-red-50">✕</button>
              </div>
            </div>
          ))}
          {!items.length && !showForm && (
            <p className="text-xs text-gray-400 py-1">Nenhuma alergia registrada.</p>
          )}
        </div>
      )}

      {showForm && (
        <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Substância *</label>
              <input value={form.code_text} onChange={f('code_text')} placeholder="ex: Dipirona, Amendoim..." className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
              <select value={form.category} onChange={f('category')} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400">
                <option value="medication">Medicamento</option>
                <option value="food">Alimento</option>
                <option value="environment">Ambiente</option>
                <option value="biologic">Biológico</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Criticidade</label>
              <select value={form.criticality} onChange={f('criticality')} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400">
                <option value="high">Alta</option>
                <option value="low">Baixa</option>
                <option value="unable-to-assess">Inconclusiva</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status Clínico</label>
              <select value={form.clinicalStatus} onChange={f('clinicalStatus')} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400">
                <option value="active">Ativa</option>
                <option value="inactive">Inativa</option>
                <option value="resolved">Resolvida</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Verificação</label>
              <select value={form.verificationStatus} onChange={f('verificationStatus')} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400">
                <option value="confirmed">Confirmada</option>
                <option value="unconfirmed">Não confirmada</option>
                <option value="refuted">Refutada</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Manifestações (separar por vírgula)</label>
              <input value={form.manifestations} onChange={f('manifestations')} placeholder="urticária, anafilaxia..." className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Gravidade da reação</label>
              <select value={form.severity} onChange={f('severity')} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400">
                <option value="">— Não informado —</option>
                <option value="mild">Leve</option>
                <option value="moderate">Moderada</option>
                <option value="severe">Grave</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data de início</label>
              <input type="date" value={form.onsetDateTime} onChange={f('onsetDateTime')} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
              <textarea value={form.note} onChange={f('note')} rows={2} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={cancelForm} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100">Cancelar</button>
            <button onClick={save} disabled={saving || !form.code_text.trim()} className="px-4 py-1.5 text-sm bg-red-600 text-white rounded font-medium hover:bg-red-700 disabled:opacity-50">
              {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// COMORBIDADES SECTION
// ──────────────────────────────────────────────────────────────────────────

type ConditionForm = {
  code_text: string; cid10: string; clinicalStatus: string;
  verificationStatus: string; severity: string; onsetDateTime: string; note: string;
};

const CONDITION_EMPTY: ConditionForm = {
  code_text: '', cid10: '', clinicalStatus: 'active',
  verificationStatus: 'confirmed', severity: '', onsetDateTime: '', note: '',
};

function conditionToForm(c: T_Condition): ConditionForm {
  return {
    code_text: c.code?.text ?? '',
    cid10: c.code?.coding?.[0]?.code ?? '',
    clinicalStatus: c.clinicalStatus ?? 'active',
    verificationStatus: c.verificationStatus ?? 'confirmed',
    severity: c.severity ?? '',
    onsetDateTime: c.onsetDateTime ?? '',
    note: c.note ?? '',
  };
}

function formToCondition(f: ConditionForm, patientId: string): Partial<T_Condition> {
  return {
    patient_id: patientId,
    code: {
      text: f.code_text,
      coding: f.cid10
        ? [{ system: 'http://hl7.org/fhir/sid/icd-10', code: f.cid10, display: f.code_text }]
        : undefined,
    },
    clinicalStatus: f.clinicalStatus as any,
    verificationStatus: f.verificationStatus as any,
    severity: (f.severity as any) || undefined,
    onsetDateTime: f.onsetDateTime || undefined,
    note: f.note || undefined,
  };
}

function ComorbidasSection({ patientId }: { patientId: string }) {
  const [items, setItems] = useState<T_Condition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ConditionForm>(CONDITION_EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/Controller/C_condition?type=getAll&patient_id=${patientId}`);
      const data = res.ok ? await res.json() : [];
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  function startAdd() { setForm(CONDITION_EMPTY); setEditingId(null); setShowForm(true); }
  function startEdit(c: T_Condition) { setForm(conditionToForm(c)); setEditingId(c._id!); setShowForm(true); }
  function cancelForm() { setShowForm(false); setEditingId(null); }

  async function save() {
    if (!form.code_text.trim()) return;
    setSaving(true);
    try {
      const payload = formToCondition(form, patientId);
      if (editingId) {
        await fetch(`/api/Controller/C_condition?type=update&id=${editingId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/Controller/C_condition?type=new', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
      }
      setShowForm(false); setEditingId(null); load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Excluir esta condição?')) return;
    await fetch(`/api/Controller/C_condition?type=delete&id=${id}`, { method: 'DELETE' });
    load();
  }

  const f = (k: keyof ConditionForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          Comorbidades e Diagnósticos
          {items.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold">{items.length}</span>
          )}
        </h3>
        {!showForm && (
          <button onClick={startAdd} className="text-xs px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-700 rounded font-medium hover:bg-orange-100 transition-colors">
            + Adicionar
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-gray-400 py-2">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <div key={c._id} className="flex items-start justify-between p-2.5 rounded-lg bg-orange-50 border border-orange-100">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="text-sm font-medium text-gray-800">{c.code?.text}</span>
                  {c.code?.coding?.[0]?.code && (
                    <Badge text={`CID: ${c.code.coding[0].code}`} color="bg-indigo-100 text-indigo-700" />
                  )}
                  <Badge
                    text={CONDITION_STATUS_LABELS[c.clinicalStatus] ?? c.clinicalStatus}
                    color={c.clinicalStatus === 'active' ? 'bg-orange-200 text-orange-800' : 'bg-gray-100 text-gray-600'}
                  />
                  {c.verificationStatus && (
                    <Badge text={VERIFICATION_LABELS[c.verificationStatus] ?? c.verificationStatus} color="bg-gray-100 text-gray-500" />
                  )}
                  {c.severity && (
                    <Badge text={SEVERITY_LABELS[c.severity] ?? c.severity} color="bg-yellow-100 text-yellow-700" />
                  )}
                </div>
                {c.onsetDateTime && <p className="text-xs text-gray-400 mt-0.5">Desde: {fmtDate(c.onsetDateTime)}</p>}
                {c.note && <p className="text-xs text-gray-400 mt-0.5 italic">{c.note}</p>}
              </div>
              <div className="flex gap-1 ml-2 shrink-0">
                <button onClick={() => startEdit(c)} className="text-[11px] px-2 py-1 rounded bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">Editar</button>
                <button onClick={() => remove(c._id!)} className="text-[11px] px-2 py-1 rounded bg-white border border-gray-200 text-red-500 hover:bg-red-50">✕</button>
              </div>
            </div>
          ))}
          {!items.length && !showForm && (
            <p className="text-xs text-gray-400 py-1">Nenhuma comorbidade registrada.</p>
          )}
        </div>
      )}

      {showForm && (
        <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Condição / Diagnóstico *</label>
              <input value={form.code_text} onChange={f('code_text')} placeholder="ex: Hipertensão arterial, Diabetes tipo 2..." className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">CID-10 (opcional)</label>
              <input value={form.cid10} onChange={f('cid10')} placeholder="ex: I10, E11..." className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status Clínico</label>
              <select value={form.clinicalStatus} onChange={f('clinicalStatus')} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400">
                <option value="active">Ativa</option>
                <option value="recurrence">Recorrente</option>
                <option value="relapse">Recaída</option>
                <option value="inactive">Inativa</option>
                <option value="remission">Remissão</option>
                <option value="resolved">Resolvida</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Verificação</label>
              <select value={form.verificationStatus} onChange={f('verificationStatus')} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400">
                <option value="confirmed">Confirmada</option>
                <option value="provisional">Provisional</option>
                <option value="differential">Diferencial</option>
                <option value="refuted">Refutada</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Gravidade</label>
              <select value={form.severity} onChange={f('severity')} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400">
                <option value="">— Não informado —</option>
                <option value="mild">Leve</option>
                <option value="moderate">Moderada</option>
                <option value="severe">Grave</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data de início</label>
              <input type="date" value={form.onsetDateTime} onChange={f('onsetDateTime')} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
              <textarea value={form.note} onChange={f('note')} rows={2} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={cancelForm} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100">Cancelar</button>
            <button onClick={save} disabled={saving || !form.code_text.trim()} className="px-4 py-1.5 text-sm bg-orange-600 text-white rounded font-medium hover:bg-orange-700 disabled:opacity-50">
              {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// PROCEDIMENTOS SECTION
// ──────────────────────────────────────────────────────────────────────────

type ProcedureForm = {
  code_text: string; status: string; performedDateTime: string; note: string;
};

const PROCEDURE_EMPTY: ProcedureForm = {
  code_text: '', status: 'completed', performedDateTime: '', note: '',
};

function procedureToForm(p: T_Procedure): ProcedureForm {
  return {
    code_text: p.code?.text ?? '',
    status: p.status ?? 'completed',
    performedDateTime: p.performedDateTime ?? '',
    note: p.note ?? '',
  };
}

function formToProcedure(f: ProcedureForm, patientId: string): Partial<T_Procedure> {
  return {
    patient_id: patientId,
    code: { text: f.code_text },
    status: f.status as any,
    performedDateTime: f.performedDateTime || undefined,
    note: f.note || undefined,
  };
}

function ProcedimentosSection({ patientId }: { patientId: string }) {
  const [items, setItems] = useState<T_Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProcedureForm>(PROCEDURE_EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/Controller/C_procedure?type=getAll&patient_id=${patientId}`);
      const data = res.ok ? await res.json() : [];
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  function startAdd() { setForm(PROCEDURE_EMPTY); setEditingId(null); setShowForm(true); }
  function startEdit(p: T_Procedure) { setForm(procedureToForm(p)); setEditingId(p._id!); setShowForm(true); }
  function cancelForm() { setShowForm(false); setEditingId(null); }

  async function save() {
    if (!form.code_text.trim()) return;
    setSaving(true);
    try {
      const payload = formToProcedure(form, patientId);
      if (editingId) {
        await fetch(`/api/Controller/C_procedure?type=update&id=${editingId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/Controller/C_procedure?type=new', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
      }
      setShowForm(false); setEditingId(null); load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Excluir este procedimento?')) return;
    await fetch(`/api/Controller/C_procedure?type=delete&id=${id}`, { method: 'DELETE' });
    load();
  }

  const f = (k: keyof ProcedureForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          Histórico Cirúrgico e Procedimentos
          {items.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">{items.length}</span>
          )}
        </h3>
        {!showForm && (
          <button onClick={startAdd} className="text-xs px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded font-medium hover:bg-purple-100 transition-colors">
            + Adicionar
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-gray-400 py-2">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {items.map((p) => (
            <div key={p._id} className="flex items-start justify-between p-2.5 rounded-lg bg-purple-50 border border-purple-100">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="text-sm font-medium text-gray-800">{p.code?.text}</span>
                  <Badge
                    text={PROCEDURE_STATUS_LABELS[p.status] ?? p.status}
                    color={p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}
                  />
                </div>
                {p.performedDateTime && <p className="text-xs text-gray-400 mt-0.5">{fmtDate(p.performedDateTime)}</p>}
                {p.note && <p className="text-xs text-gray-400 mt-0.5 italic">{p.note}</p>}
              </div>
              <div className="flex gap-1 ml-2 shrink-0">
                <button onClick={() => startEdit(p)} className="text-[11px] px-2 py-1 rounded bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">Editar</button>
                <button onClick={() => remove(p._id!)} className="text-[11px] px-2 py-1 rounded bg-white border border-gray-200 text-red-500 hover:bg-red-50">✕</button>
              </div>
            </div>
          ))}
          {!items.length && !showForm && (
            <p className="text-xs text-gray-400 py-1">Nenhum procedimento registrado.</p>
          )}
        </div>
      )}

      {showForm && (
        <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Procedimento *</label>
              <input value={form.code_text} onChange={f('code_text')} placeholder="ex: Colecistectomia laparoscópica..." className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={form.status} onChange={f('status')} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400">
                <option value="completed">Concluído</option>
                <option value="not-done">Não realizado</option>
                <option value="in-progress">Em andamento</option>
                <option value="stopped">Interrompido</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data</label>
              <input type="date" value={form.performedDateTime} onChange={f('performedDateTime')} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
              <textarea value={form.note} onChange={f('note')} rows={2} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={cancelForm} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100">Cancelar</button>
            <button onClick={save} disabled={saving || !form.code_text.trim()} className="px-4 py-1.5 text-sm bg-purple-600 text-white rounded font-medium hover:bg-purple-700 disabled:opacity-50">
              {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// MAIN TAB
// ──────────────────────────────────────────────────────────────────────────

export interface Tab_ClinicoProps {
  patientId: string;
}

export default function Tab_Clinico({ patientId }: Tab_ClinicoProps) {
  if (!patientId) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
        Este residente não possui um perfil de paciente vinculado. Contacte o administrador.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AlergiasSection patientId={patientId} />
      <hr className="border-gray-200" />
      <ComorbidasSection patientId={patientId} />
      <hr className="border-gray-200" />
      <ProcedimentosSection patientId={patientId} />
    </div>
  );
}
