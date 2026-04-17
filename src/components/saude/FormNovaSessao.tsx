import React, { useEffect, useState } from 'react';
import {
  MEASUREMENT_TYPES, CATEGORY_LABELS, MeasurementCategory, MeasurementTypeCode,
  calcAbnormalFlag, calcBMI,
} from '@/types/T_measurement';
import measurementService, { CreateSessionPayload } from '@/services/measurement.service';
import { getUserID } from '@/utils/Login';
import { notifyError, notifySuccess } from '@/utils/Functions';

interface IdosoOption { _id: string; nome: string; } // compatibilidade — usa PatientOption internamente

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white transition';

// Ícones SVG inline por categoria / código
const ICONS: Partial<Record<MeasurementTypeCode | 'BP', React.ReactNode>> = {
  BP:          <span className="text-xl">🫀</span>,
  HR:          <span className="text-xl">💓</span>,
  RR:          <span className="text-xl">🫁</span>,
  TEMP:        <span className="text-xl">🌡️</span>,
  SPO2:        <span className="text-xl">🩸</span>,
  GLUCOSE:     <span className="text-xl">🩸</span>,
  HBA1C:       <span className="text-xl">📊</span>,
  BMI:         <span className="text-xl">📏</span>,
  WEIGHT:      <span className="text-xl">⚖️</span>,
  HEIGHT:      <span className="text-xl">📐</span>,
  ABD_CIRC:    <span className="text-xl">📏</span>,
  PAIN_SCORE:  <span className="text-xl">😣</span>,
  DIURESIS:    <span className="text-xl">🚰</span>,
  GCS:         <span className="text-xl">🧠</span>,
  BRADEN:      <span className="text-xl">🏥</span>,
  BARTHEL:     <span className="text-xl">♿</span>,
  MMSE:        <span className="text-xl">🧩</span>,
  GDS:         <span className="text-xl">😔</span>,
};

// "BP" é o grupo virtual Pressão Arterial
type CardKey = MeasurementTypeCode | 'BP';

const CATEGORY_ORDER: MeasurementCategory[] = ['vitals', 'metabolic', 'anthropometric', 'clinical', 'geriatric'];

// Constrói a lista de "cards" por categoria — PA aparece como um único card "BP"
function buildCards(category: MeasurementCategory): CardKey[] {
  if (category === 'vitals') return ['BP', 'HR', 'RR', 'TEMP', 'SPO2'];
  return MEASUREMENT_TYPES
    .filter(t => t.category === category && !t.isPressurePart && !t.isCalculated)
    .map(t => t.code as CardKey);
}

function getLabel(code: CardKey): string {
  if (code === 'BP') return 'Pressão Arterial';
  return MEASUREMENT_TYPES.find(t => t.code === code)?.label ?? code;
}

function getUnit(code: CardKey): string {
  if (code === 'BP') return 'mmHg';
  return MEASUREMENT_TYPES.find(t => t.code === code)?.unit ?? '';
}

const FormNovaSessao: React.FC<Props> = ({ onSuccess, onCancel }) => {
  const [idosos, setIdosos] = useState<IdosoOption[]>([]);
  const [elderId, setElderId] = useState('');
  const [measuredAt, setMeasuredAt] = useState(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [selected, setSelected] = useState<Set<CardKey>>(new Set());
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/Controller/patient.controller?type=getActivePatients')
      .then(r => r.json())
      .then((data: any[]) => setIdosos(data.map(d => ({
          _id: String(d._id),
          nome: d.display_name ?? 'Paciente',
        }))))
      .catch(() => {});
  }, []);

  const toggle = (code: CardKey) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const setValue = (code: string, val: string) => setValues(prev => ({ ...prev, [code]: val }));

  // IMC auto: recalcula quando peso ou altura mudam e ambos estão selecionados
  const weightVal = parseFloat(values['WEIGHT']?.replace(',', '.'));
  const heightVal = parseFloat(values['HEIGHT']?.replace(',', '.'));
  const bmiAuto   = !isNaN(weightVal) && !isNaN(heightVal) && heightVal > 0
    ? calcBMI(weightVal, heightVal)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!elderId) { notifyError('Selecione um idoso.'); return; }
    if (selected.size === 0) { notifyError('Selecione ao menos uma medição.'); return; }

    const measurementList: CreateSessionPayload['measurements'] = [];

    for (const cardKey of Array.from(selected)) {
      const codesForCard: MeasurementTypeCode[] = cardKey === 'BP'
        ? ['BP_SYS', 'BP_DIA']
        : [cardKey as MeasurementTypeCode];

      for (const code of codesForCard) {
        const meta = MEASUREMENT_TYPES.find(t => t.code === code);
        if (!meta) continue;
        const rawVal = values[code];
        if (!rawVal || rawVal.trim() === '') {
          notifyError(`Preencha o valor de ${meta.label}.`);
          return;
        }
        const numeric = parseFloat(rawVal.replace(',', '.'));
        if (isNaN(numeric)) { notifyError(`Valor inválido para ${meta.label}.`); return; }

        measurementList.push({
          type_code: code,
          type_label: meta.label,
          value_numeric: numeric,
          unit: meta.unit,
          reference_min: meta.reference_min,
          reference_max: meta.reference_max,
          abnormal_flag: calcAbnormalFlag(code, numeric),
          status: 'final',
        });
      }
    }

    // BMI calculado automaticamente se peso e altura presentes
    if (bmiAuto !== null) {
      const bmiMeta = MEASUREMENT_TYPES.find(t => t.code === 'BMI')!;
      measurementList.push({
        type_code: 'BMI',
        type_label: bmiMeta.label,
        value_numeric: bmiAuto,
        unit: bmiMeta.unit,
        reference_min: bmiMeta.reference_min,
        reference_max: bmiMeta.reference_max,
        abnormal_flag: calcAbnormalFlag('BMI', bmiAuto),
        status: 'final',
      });
    }

    try {
      setSaving(true);
      await measurementService.createSession({
        session: {
          patient_id: elderId,
          measured_at: new Date(measuredAt + ':00').toISOString(),
          recorded_by_user_id: getUserID(),
          source_type: 'manual',
          location: location || undefined,
          notes: notes || undefined,
          status: 'active',
        },
        measurements: measurementList,
      });
      notifySuccess('Medições registradas!');
      onSuccess();
    } catch (err: any) {
      notifyError(err.message || 'Erro ao registrar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
      <p className="text-base font-semibold text-gray-800">Nova Sessão de Medição</p>

      {/* Cabeçalho da sessão */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Idoso *</label>
          <select value={elderId} onChange={e => setElderId(e.target.value)} className={inputCls} required>
            <option value="">Selecione...</option>
            {idosos.map(i => <option key={i._id} value={i._id}>{i.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Data e hora *</label>
          <input type="datetime-local" value={measuredAt} onChange={e => setMeasuredAt(e.target.value)} className={inputCls} required />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Local</label>
          <input type="text" value={location} onChange={e => setLocation(e.target.value)} className={inputCls} placeholder="Ex: Quarto 3, Enfermaria" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Observações</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} rows={2} placeholder="Anotações sobre esta sessão..." />
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Cards por categoria */}
      <div className="space-y-5">
        {CATEGORY_ORDER.map(cat => {
          const cards = buildCards(cat);
          return (
            <div key={cat}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {CATEGORY_LABELS[cat]}
              </p>
              <div className={`grid gap-2 items-start ${cat === 'geriatric' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                {cards.map(cardKey => {
                  const isSelected = selected.has(cardKey);
                  const isBP       = cardKey === 'BP';
                  const meta       = isBP ? null : MEASUREMENT_TYPES.find(t => t.code === cardKey);

                  return (
                    <div key={cardKey}
                      className={`rounded-xl border-2 transition-all duration-150 overflow-hidden
                        ${isSelected
                          ? 'border-indigo-400 bg-indigo-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 cursor-pointer'}`}>

                      {/* Header do card — clicável */}
                      <div className="flex items-center gap-2 p-3 cursor-pointer select-none"
                        onClick={() => toggle(cardKey)}>
                        <span className="text-lg leading-none">{ICONS[cardKey] ?? '📋'}</span>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${isSelected ? 'text-indigo-700' : 'text-gray-700'}`}>
                            {getLabel(cardKey)}
                          </p>
                          <p className="text-xs text-gray-400">{getUnit(cardKey)}</p>
                        </div>
                        <div className="ml-auto shrink-0">
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold transition-colors
                            ${isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                            {isSelected ? '✓' : '+'}
                          </span>
                        </div>
                      </div>

                      {/* Inputs — visíveis quando selecionado */}
                      {isSelected && (
                        <div className="px-3 pb-3 space-y-2 border-t border-indigo-100 pt-2">
                          {isBP ? (
                            <div className="grid grid-cols-2 gap-2">
                              {['BP_SYS', 'BP_DIA'].map(code => {
                                const m = MEASUREMENT_TYPES.find(t => t.code === code)!;
                                return (
                                  <div key={code}>
                                    <label className="block text-xs text-indigo-500 mb-1">{m.shortLabel}</label>
                                    <input type="number" min={m.min} max={m.max} step={1}
                                      value={values[code] ?? ''}
                                      onChange={e => setValue(code, e.target.value)}
                                      className={inputCls}
                                      placeholder={code === 'BP_SYS' ? '120' : '80'} />
                                  </div>
                                );
                              })}
                            </div>
                          ) : meta ? (
                            <div>
                              <input
                                type="number"
                                min={meta.min} max={meta.max} step={meta.step ?? 1}
                                value={values[cardKey as string] ?? ''}
                                onChange={e => setValue(cardKey as string, e.target.value)}
                                className={inputCls}
                                placeholder={meta.reference_min !== undefined ? String(meta.reference_min) : ''}
                              />
                              {meta.hint && (
                                <p className="text-xs text-gray-400 mt-1 leading-snug">{meta.hint}</p>
                              )}
                              {meta.reference_min !== undefined && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  Ref: {meta.reference_min}–{meta.reference_max} {meta.unit}
                                </p>
                              )}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* IMC automático se WEIGHT + HEIGHT selecionados */}
              {cat === 'metabolic' && bmiAuto !== null && (selected.has('WEIGHT') || selected.has('HEIGHT')) && (
                <div className="mt-2 ml-1 text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                  IMC calculado automaticamente: <strong>{bmiAuto} kg/m²</strong>
                  {bmiAuto < 22 ? ' — Abaixo do ideal para idosos' : bmiAuto > 27 ? ' — Acima do ideal' : ' — Dentro da faixa ideal'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ações */}
      <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1">
        <button type="submit" disabled={saving}
          className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 px-6 rounded-xl transition-colors">
          {saving ? 'Registrando...' : 'Registrar Medições'}
        </button>
        <button type="button" onClick={onCancel}
          className="flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2.5 px-6 rounded-xl transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default FormNovaSessao;
