import React from 'react';
import { T_Movimentacao } from '@/types/T_financeiroMovimentacoes';

// ── Types ────────────────────────────────────────────────────────────────────

export type FilterLogic = 'and' | 'or';

export type FilterOperator =
  | 'eq' | 'neq'
  | 'contains' | 'starts'
  | 'gt' | 'gte' | 'lt' | 'lte' | 'between'
  | 'empty' | 'notempty';

export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string;
  value2?: string;
}

interface SelectOpt  { value: string; label: string }
interface OpOpt      { value: FilterOperator; label: string }
interface FieldDef {
  key:       string;
  label:     string;
  inputType: 'date' | 'month' | 'text' | 'number' | 'select';
  operators: OpOpt[];
  options?:  SelectOpt[];
}

// ── Field / operator definitions ─────────────────────────────────────────────

const EQ_NEQ: OpOpt[]    = [{ value: 'eq', label: 'é' }, { value: 'neq', label: 'não é' }];
const DATE_OPS: OpOpt[]  = [{ value: 'eq', label: 'é' }, { value: 'gte', label: 'a partir de' }, { value: 'lte', label: 'até' }, { value: 'between', label: 'entre' }];
const MONTH_OPS: OpOpt[] = [{ value: 'eq', label: 'é' }, { value: 'gte', label: 'a partir de' }, { value: 'lte', label: 'até' }];
const NUM_OPS: OpOpt[]   = [
  { value: 'eq',      label: 'igual a'          },
  { value: 'gt',      label: 'maior que'         },
  { value: 'gte',     label: 'maior ou igual a'  },
  { value: 'lt',      label: 'menor que'         },
  { value: 'lte',     label: 'menor ou igual a'  },
  { value: 'between', label: 'entre'             },
];
const TEXT_OPS: OpOpt[] = [
  { value: 'contains',  label: 'contém'       },
  { value: 'starts',    label: 'começa com'   },
  { value: 'eq',        label: 'é igual a'    },
  { value: 'empty',     label: 'está vazio'   },
  { value: 'notempty',  label: 'não está vazio' },
];

const NULLABLE_OPS: OpOpt[] = [
  ...EQ_NEQ,
  { value: 'empty',    label: 'está vazio'    },
  { value: 'notempty', label: 'não está vazio' },
];

const TIPO_OPTS: SelectOpt[] = [
  { value: 'entrada',       label: 'Entrada'       },
  { value: 'saida',         label: 'Saída'         },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'ajuste',        label: 'Ajuste'        },
];

function buildFields(contas: SelectOpt[], categorias: SelectOpt[]): FieldDef[] {
  return [
    { key: 'dataMovimento',     label: 'Data',          inputType: 'date',   operators: DATE_OPS  },
    { key: 'competencia',       label: 'Competência',   inputType: 'month',  operators: MONTH_OPS },
    { key: 'tipoMovimento',     label: 'Tipo',          inputType: 'select', operators: EQ_NEQ,   options: TIPO_OPTS  },
    { key: 'contaFinanceiraId', label: 'Conta',         inputType: 'select', operators: EQ_NEQ,   options: contas     },
    { key: 'categoriaId',       label: 'Categoria',     inputType: 'select', operators: NULLABLE_OPS, options: categorias },
    { key: 'historico',         label: 'Histórico',     inputType: 'text',   operators: TEXT_OPS     },
    { key: 'valor',             label: 'Valor (R$)',    inputType: 'number', operators: NUM_OPS   },
    {
      key: 'temRateio', label: 'Tem rateio', inputType: 'select',
      operators: [{ value: 'eq', label: 'é' }],
      options: [{ value: 'true', label: 'Sim' }, { value: 'false', label: 'Não' }],
    },
    {
      key: 'vinculadoTipo', label: 'Vínculo', inputType: 'select', operators: NULLABLE_OPS,
      options: [{ value: 'residente', label: 'Residente' }, { value: 'usuario', label: 'Usuário' }],
    },
  ];
}

// ── Exported filter logic ────────────────────────────────────────────────────

export function applyFilters(
  items: T_Movimentacao[],
  conditions: FilterCondition[],
  logic: FilterLogic,
): T_Movimentacao[] {
  const active = conditions.filter(c => c.operator === 'empty' || c.operator === 'notempty' || c.value !== '');
  if (!active.length) return items;
  return items.filter(mov => {
    const results = active.map(c => matchOne(mov, c));
    return logic === 'and' ? results.every(Boolean) : results.some(Boolean);
  });
}

function matchOne(mov: T_Movimentacao, c: FilterCondition): boolean {
  const raw = (mov as any)[c.field];
  const val = c.value;
  switch (c.operator) {
    case 'eq':       return String(raw ?? '') === val;
    case 'neq':      return String(raw ?? '') !== val;
    case 'contains': return String(raw ?? '').toLowerCase().includes(val.toLowerCase());
    case 'starts':   return String(raw ?? '').toLowerCase().startsWith(val.toLowerCase());
    case 'gt':       return Number(raw) > Number(val);
    case 'gte':      return typeof raw === 'string' ? raw >= val : Number(raw) >= Number(val);
    case 'lt':       return Number(raw) < Number(val);
    case 'lte':      return typeof raw === 'string' ? raw <= val : Number(raw) <= Number(val);
    case 'between': {
      const v2 = c.value2 ?? val;
      return typeof raw === 'string'
        ? raw >= val && raw <= v2
        : Number(raw) >= Number(val) && Number(raw) <= Number(v2);
    }
    case 'empty':    return raw == null || raw === '';
    case 'notempty': return raw != null && raw !== '';
    default: return true;
  }
}

export function describeCondition(
  cond: FilterCondition,
  contas: SelectOpt[],
  categorias: SelectOpt[],
): string {
  const fields = buildFields(contas, categorias);
  const fd = fields.find(f => f.key === cond.field);
  if (!fd) return cond.field;
  const opLabel = fd.operators.find(o => o.value === cond.operator)?.label ?? cond.operator;
  const label   = (v: string) => fd.options?.find(o => o.value === v)?.label ?? v;
  if (cond.operator === 'empty' || cond.operator === 'notempty') {
    return `${fd.label} ${opLabel}`;
  }
  if (cond.operator === 'between') {
    return `${fd.label} entre ${label(cond.value)} e ${label(cond.value2 ?? '')}`;
  }
  return `${fd.label} ${opLabel} ${label(cond.value)}`;
}

// ── Component ────────────────────────────────────────────────────────────────

function newCond(): FilterCondition {
  return { id: Math.random().toString(36).slice(2), field: 'tipoMovimento', operator: 'eq', value: TIPO_OPTS[0].value };
}

interface Props {
  open:                boolean;
  onClose:             () => void;
  conditions:          FilterCondition[];
  logic:               FilterLogic;
  onConditionsChange:  (c: FilterCondition[]) => void;
  onLogicChange:       (l: FilterLogic) => void;
  contas:              SelectOpt[];
  categorias:          SelectOpt[];
}

export default function FiltrosSidebar({
  open, onClose, conditions, logic, onConditionsChange, onLogicChange, contas, categorias,
}: Props) {
  const fields = buildFields(contas, categorias);

  function add()                { onConditionsChange([...conditions, newCond()]); }
  function remove(id: string)   { onConditionsChange(conditions.filter(c => c.id !== id)); }
  function patch(id: string, p: Partial<FilterCondition>) {
    onConditionsChange(conditions.map(c => c.id === id ? { ...c, ...p } : c));
  }

  function onFieldChange(id: string, field: string) {
    const fd = fields.find(f => f.key === field)!;
    patch(id, { field, operator: fd.operators[0].value, value: fd.options?.[0]?.value ?? '', value2: undefined });
  }

  function renderValue(cond: FilterCondition) {
    if (cond.operator === 'empty' || cond.operator === 'notempty') return null;
    const fd = fields.find(f => f.key === cond.field);
    if (!fd) return null;
    const cls = 'w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

    if (fd.options) {
      return (
        <select value={cond.value} onChange={e => patch(cond.id, { value: e.target.value })} className={cls}>
          {fd.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    }
    if (cond.operator === 'between') {
      return (
        <div className="flex items-center gap-2">
          <input type={fd.inputType} step={fd.inputType === 'number' ? '0.01' : undefined}
            value={cond.value} onChange={e => patch(cond.id, { value: e.target.value })} className={cls} placeholder="De…" />
          <span className="text-xs text-gray-400 shrink-0">e</span>
          <input type={fd.inputType} step={fd.inputType === 'number' ? '0.01' : undefined}
            value={cond.value2 ?? ''} onChange={e => patch(cond.id, { value2: e.target.value })} className={cls} placeholder="Até…" />
        </div>
      );
    }
    return (
      <input type={fd.inputType} step={fd.inputType === 'number' ? '0.01' : undefined}
        value={cond.value} onChange={e => patch(cond.id, { value: e.target.value })} className={cls} placeholder="Valor…" />
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`fixed inset-y-0 right-0 z-50 flex flex-col w-full sm:w-[460px] bg-white shadow-2xl transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-white">
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h2" />
            </svg>
            <span className="text-sm font-semibold text-gray-800">Filtros avançados</span>
            {conditions.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                {conditions.length}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* AND / OR — só aparece com 2+ condições */}
        {conditions.length > 1 && (
          <div className="flex items-center gap-3 px-5 py-2.5 border-b bg-gray-50 text-xs">
            <span className="text-gray-500 font-medium shrink-0">Combinar com</span>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden font-semibold">
              {(['and', 'or'] as FilterLogic[]).map((l, i) => (
                <button
                  key={l}
                  onClick={() => onLogicChange(l)}
                  className={`px-3 py-1.5 transition-colors ${i > 0 ? 'border-l border-gray-300' : ''} ${logic === l ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  {l === 'and' ? 'E' : 'OU'}
                </button>
              ))}
            </div>
            <span className="text-gray-400">{logic === 'and' ? 'todos os filtros' : 'qualquer filtro'}</span>
          </div>
        )}

        {/* Conditions list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {conditions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg className="w-12 h-12 mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h2" />
              </svg>
              <p className="text-sm font-medium text-gray-400">Sem filtros ativos</p>
              <p className="text-xs text-gray-300 mt-1">Adicione condições abaixo</p>
            </div>
          )}

          {conditions.map((cond, i) => {
            const fd = fields.find(f => f.key === cond.field)!;
            return (
              <div key={cond.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2.5">
                {/* Logic badge entre condições */}
                {i > 0 && (
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${logic === 'and' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                      {logic === 'and' ? 'E' : 'OU'}
                    </span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                )}

                {/* Campo + Operador */}
                <div className="flex gap-2 items-center">
                  <select
                    value={cond.field}
                    onChange={e => onFieldChange(cond.id, e.target.value)}
                    className="flex-1 min-w-0 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {fields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>

                  <select
                    value={cond.operator}
                    onChange={e => patch(cond.id, { operator: e.target.value as FilterOperator, value2: undefined })}
                    className="flex-1 min-w-0 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {fd.operators.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>

                  <button
                    onClick={() => remove(cond.id)}
                    className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Remover condição"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Valor */}
                {renderValue(cond)}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t bg-gray-50 space-y-2">
          <button
            onClick={add}
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 text-indigo-600 rounded-xl text-xs font-semibold transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Adicionar condição
          </button>
          {conditions.length > 0 && (
            <button
              onClick={() => onConditionsChange([])}
              className="w-full py-2 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
            >
              Limpar todos os filtros
            </button>
          )}
        </div>
      </div>
    </>
  );
}
