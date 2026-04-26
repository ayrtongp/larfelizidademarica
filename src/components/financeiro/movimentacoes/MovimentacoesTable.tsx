import React, { useRef, useState, useEffect, useCallback } from 'react';
import { T_Movimentacao, TipoMovimento } from '@/types/T_financeiroMovimentacoes';

function formatDateBR(dateStr: string): string {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('T')[0].split('-');
  return `${day}/${month}/${year}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const MESES_ABREV = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

function formatCompetencia(comp?: string): string {
  if (!comp) return '-';
  const [year, month] = comp.split('-');
  return `${MESES_ABREV[parseInt(month, 10) - 1]}/${year}`;
}

const TIPO_LABELS: Record<TipoMovimento, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  transferencia: 'Transferência',
  ajuste: 'Ajuste',
};

const TIPO_STYLES: Record<TipoMovimento, string> = {
  entrada: 'bg-green-100 text-green-800',
  saida: 'bg-red-100 text-red-800',
  transferencia: 'bg-blue-100 text-blue-800',
  ajuste: 'bg-gray-100 text-gray-800',
};

const VINCULO_LABELS: Record<string, string> = {
  residente: 'Residente',
  usuario:   'Usuário',
};

// ── Ícones inline (sem dependência extra) ──────────────────────────────────
const IconPerson = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
  </svg>
);

const IconSplit = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 12h-4l3-8H8L5 12H1l8 10 8-10z"/>
  </svg>
);

interface ContaNome { _id: string; nome: string; }
interface CategoriaNome { _id: string; nome: string; }

interface Props {
  movimentacoes: T_Movimentacao[];
  contas?: ContaNome[];
  onVerRateios?: (movimentacao: T_Movimentacao) => void;
  onEditar?: (movimentacao: T_Movimentacao) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

// Definição de colunas (índice → largura inicial em px, null = auto)
const COLS = [
  { key: 'data',        label: 'Data',        initW: 90  },
  { key: 'competencia', label: 'Competência', initW: 90  },
  { key: 'tipo',        label: 'Tipo',        initW: 110 },
  { key: 'historico',   label: 'Histórico',   initW: 240 },
  { key: 'conta',       label: 'Conta',       initW: 130 },
  { key: 'categoria',   label: 'Categoria',   initW: 130 },
  { key: 'valor',       label: 'Valor',       initW: 110 },
  { key: 'vinculos',    label: 'Vínculos',    initW: 80  },
  { key: 'acoes',       label: 'Ações',       initW: 80  },
];

export default function MovimentacoesTable({ movimentacoes, contas = [], onVerRateios, onEditar, selectedIds = [], onSelectionChange }: Props) {
  const [widths, setWidths] = useState<number[]>(COLS.map((c) => c.initW));
  const resizing = useRef<{ idx: number; startX: number; startW: number } | null>(null);
  const [categorias, setCategorias] = useState<CategoriaNome[]>([]);

  useEffect(() => {
    fetch('/api/Controller/C_financeiroCategorias?type=getAll')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setCategorias(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const allIds = movimentacoes.map((m) => m._id!).filter(Boolean);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));
  const someSelected = !allSelected && allIds.some((id) => selectedIds.includes(id));

  function toggleAll() {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? [] : allIds);
  }

  function toggleOne(id: string) {
    if (!onSelectionChange) return;
    onSelectionChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  }

  // ── Resize handlers ────────────────────────────────────────────────────
  const onResizeStart = useCallback((e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    resizing.current = { idx, startX: e.clientX, startW: widths[idx] };
  }, [widths]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizing.current) return;
      const { idx, startX, startW } = resizing.current;
      const newW = Math.max(40, startW + (e.clientX - startX));
      setWidths((prev) => { const n = [...prev]; n[idx] = newW; return n; });
    };
    const onUp = () => { resizing.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  function getNomeConta(id: string) {
    return contas.find((c) => c._id === id)?.nome ?? id;
  }

  function getNomeCategoria(id?: string) {
    if (!id) return '-';
    return categorias.find((c) => c._id === id)?.nome ?? '-';
  }

  if (!movimentacoes.length) {
    return <div className="text-center py-10 text-gray-500">Nenhuma movimentação encontrada.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-md shadow select-none">
      <table className="bg-white divide-y divide-gray-200" style={{ tableLayout: 'fixed', width: 40 + widths.reduce((a, b) => a + b, 0) }}>
        <colgroup>
          <col style={{ width: 40 }} />
          {widths.map((w, i) => <col key={i} style={{ width: w }} />)}
        </colgroup>

        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-2 py-3 text-center" style={{ width: 40 }}>
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = someSelected; }}
                onChange={toggleAll}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-pointer"
              />
            </th>
            {COLS.map((col, idx) => (
              <th
                key={col.key}
                className="relative px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider overflow-hidden"
                style={{ width: widths[idx] }}
              >
                <span className="block truncate">{col.label}</span>
                {idx < COLS.length - 1 && (
                  <div
                    onMouseDown={(e) => onResizeStart(e, idx)}
                    className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-indigo-400 opacity-0 hover:opacity-100 transition-opacity"
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {movimentacoes.map((mov) => {
            const isEntrada = mov.tipoMovimento === 'entrada';
            const isSaida   = mov.tipoMovimento === 'saida';
            const valorClass = isEntrada ? 'text-green-700 font-semibold' : isSaida ? 'text-red-700 font-semibold' : 'text-gray-700';
            const valorPrefix = isEntrada ? '+' : isSaida ? '-' : '';
            const hasVinculo  = !!mov.vinculadoId;
            const hasRateio   = mov.temRateio && (mov.rateioCount ?? 0) > 0;
            const isSelected  = selectedIds.includes(mov._id!);

            return (
              <tr key={mov._id} className={isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'}>
                <td className="px-2 py-1.5 text-center" style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOne(mov._id!)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-pointer"
                  />
                </td>
                {/* Data */}
                <td className="px-3 py-1.5 text-xs text-gray-700 whitespace-nowrap overflow-hidden">
                  {formatDateBR(mov.dataMovimento)}
                </td>

                {/* Competência */}
                <td className="px-3 py-1.5 text-xs text-gray-500 whitespace-nowrap overflow-hidden">
                  {formatCompetencia(mov.competencia)}
                </td>

                {/* Tipo */}
                <td className="px-3 py-1.5 overflow-hidden">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TIPO_STYLES[mov.tipoMovimento]}`}>
                    {TIPO_LABELS[mov.tipoMovimento]}
                  </span>
                </td>

                {/* Histórico */}
                <td className="px-3 py-1.5 text-xs text-gray-700 overflow-hidden">
                  <span className="block truncate" title={mov.historico}>{mov.historico}</span>
                </td>

                {/* Conta */}
                <td className="px-3 py-1.5 text-xs text-gray-600 overflow-hidden">
                  <span className="block truncate">{getNomeConta(mov.contaFinanceiraId)}</span>
                </td>

                {/* Categoria */}
                <td className="px-3 py-1.5 text-xs text-gray-500 overflow-hidden">
                  <span className="block truncate">{getNomeCategoria(mov.categoriaId)}</span>
                </td>

                {/* Valor */}
                <td className={`px-3 py-1.5 text-xs text-right whitespace-nowrap overflow-hidden ${valorClass}`}>
                  {valorPrefix}{formatCurrency(mov.valor)}
                </td>

                {/* Vínculos */}
                <td className="px-3 py-1.5 overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    {hasVinculo && (
                      <span
                        title={VINCULO_LABELS[mov.vinculadoTipo ?? ''] ?? mov.vinculadoTipo}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[10px] font-medium cursor-default"
                      >
                        <IconPerson />
                        <span>1</span>
                      </span>
                    )}
                    {hasRateio && (
                      <button
                        onClick={() => onVerRateios?.(mov)}
                        title={`${mov.rateioCount} rateios`}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-[10px] font-medium hover:bg-amber-100 transition-colors"
                      >
                        <IconSplit />
                        <span>{mov.rateioCount}</span>
                      </button>
                    )}
                  </div>
                </td>

                {/* Ações */}
                <td className="px-3 py-1.5 overflow-hidden">
                  <button
                    onClick={() => onEditar?.(mov)}
                    className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium whitespace-nowrap"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
