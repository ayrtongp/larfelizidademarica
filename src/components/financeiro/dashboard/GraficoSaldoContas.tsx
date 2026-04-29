import React, { useState } from 'react';
import { T_EvolucaoMensal } from '@/types/T_financeiroDashboard';

const MESES_ABREV = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

function labelMes(comp: string) {
  const [year, month] = comp.split('-');
  return `${MESES_ABREV[parseInt(month, 10) - 1]}/${year.slice(2)}`;
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

interface Props {
  evolucao: T_EvolucaoMensal[];
  totalAtual: number;
}

const PAD = { top: 24, right: 16, bottom: 44, left: 72 };
const W = 520;
const H = 220;
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;
const Y_TICKS = 4;

export default function GraficoSaldoContas({ evolucao, totalAtual }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; mes: string; saldo: number } | null>(null);

  if (!evolucao.length) return null;

  // Compute historical saldo working backwards from totalAtual
  const saldos: number[] = new Array(evolucao.length);
  let s = totalAtual;
  for (let i = evolucao.length - 1; i >= 0; i--) {
    saldos[i] = s;
    if (i > 0) s = s - evolucao[i].entradas + evolucao[i].saidas;
  }

  const minVal = Math.min(...saldos);
  const maxVal = Math.max(...saldos, 1);
  const range  = maxVal - minVal || 1;
  const scale  = (v: number) => CHART_H - ((v - minVal) / range) * CHART_H;

  const tickStep = range / Y_TICKS;
  const yTicks   = Array.from({ length: Y_TICKS + 1 }, (_, i) => minVal + i * tickStep);

  const pts = evolucao.map((d, i) => {
    const x = PAD.left + (i / (evolucao.length - 1 || 1)) * CHART_W;
    const y = PAD.top  + scale(saldos[i]);
    return { x, y, mes: d.mes, saldo: saldos[i] };
  });

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const area     = `M ${pts[0].x},${PAD.top + CHART_H} ` +
                   pts.map((p) => `L ${p.x},${p.y}`).join(' ') +
                   ` L ${pts[pts.length - 1].x},${PAD.top + CHART_H} Z`;

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ minWidth: 260 }}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Grid + Y labels */}
        {yTicks.map((tick, ti) => {
          const cy = PAD.top + scale(tick);
          return (
            <g key={ti}>
              <line x1={PAD.left} x2={PAD.left + CHART_W} y1={cy} y2={cy} stroke="#e5e7eb" strokeWidth={1} />
              <text x={PAD.left - 6} y={cy + 4} textAnchor="end" fontSize={9} fill="#9ca3af">
                {Math.abs(tick) >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={area} fill="#6366f1" fillOpacity={0.08} />

        {/* Line */}
        <polyline points={polyline} fill="none" stroke="#6366f1" strokeWidth={2} strokeLinejoin="round" />

        {/* Dots + X labels */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x} cy={p.y} r={4}
              fill="#6366f1" stroke="white" strokeWidth={1.5}
              className="cursor-pointer"
              onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, mes: p.mes, saldo: p.saldo })}
              onMouseMove={(e)  => setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
            />
            <text x={p.x} y={PAD.top + CHART_H + 14} textAnchor="middle" fontSize={10} fill="#6b7280">
              {labelMes(p.mes)}
            </text>
          </g>
        ))}

        {/* Axes */}
        <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={PAD.top + CHART_H} stroke="#d1d5db" strokeWidth={1} />
        <line x1={PAD.left} x2={PAD.left + CHART_W} y1={PAD.top + CHART_H} y2={PAD.top + CHART_H} stroke="#d1d5db" strokeWidth={1} />
      </svg>

      <div className="flex items-center gap-1.5 mt-1 px-1">
        <span className="inline-block w-3 h-3 rounded-sm bg-indigo-500" />
        <span className="text-xs text-gray-500">Saldo total das contas</span>
      </div>

      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-white border border-gray-200 rounded shadow-lg px-3 py-2 text-xs space-y-0.5"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <p className="font-semibold text-gray-700 mb-1">{labelMes(tooltip.mes)}</p>
          <p className={`font-semibold ${tooltip.saldo >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>
            Saldo: {fmt(tooltip.saldo)}
          </p>
        </div>
      )}
    </div>
  );
}
