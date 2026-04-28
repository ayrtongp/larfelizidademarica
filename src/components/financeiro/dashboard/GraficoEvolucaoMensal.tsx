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
  dados: T_EvolucaoMensal[];
}

const PAD = { top: 24, right: 16, bottom: 44, left: 72 };
const W = 640;
const H = 260;
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;
const Y_TICKS = 5;

export default function GraficoEvolucaoMensal({ dados }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; mes: string; entradas: number; saidas: number } | null>(null);

  if (!dados.length) return null;

  const maxVal = Math.max(...dados.flatMap((d) => [d.entradas, d.saidas]), 1);
  const scale = (v: number) => CHART_H - (v / maxVal) * CHART_H;

  const groupW = CHART_W / dados.length;
  const barW = Math.min(groupW * 0.32, 28);
  const gap = barW * 0.2;

  const tickStep = maxVal / Y_TICKS;
  const yTicks = Array.from({ length: Y_TICKS + 1 }, (_, i) => i * tickStep);

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ minWidth: 320 }}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Grid + Y axis labels */}
        {yTicks.map((tick) => {
          const cy = PAD.top + scale(tick);
          return (
            <g key={tick}>
              <line
                x1={PAD.left} x2={PAD.left + CHART_W}
                y1={cy} y2={cy}
                stroke="#e5e7eb" strokeWidth={1}
              />
              <text
                x={PAD.left - 6} y={cy + 4}
                textAnchor="end" fontSize={10} fill="#9ca3af"
              >
                {tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {dados.map((d, i) => {
          const cx = PAD.left + i * groupW + groupW / 2;
          const xEnt = cx - gap / 2 - barW;
          const xSai = cx + gap / 2;

          const hEnt = Math.max((d.entradas / maxVal) * CHART_H, 1);
          const hSai = Math.max((d.saidas  / maxVal) * CHART_H, 1);

          const yEnt = PAD.top + CHART_H - hEnt;
          const ySai = PAD.top + CHART_H - hSai;

          return (
            <g key={d.mes}>
              {/* entrada */}
              <rect
                x={xEnt} y={yEnt} width={barW} height={hEnt}
                rx={2} fill="#22c55e" opacity={0.85}
                className="cursor-pointer hover:opacity-100 transition-opacity"
                onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, ...d })}
                onMouseMove={(e) => setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
              />
              {/* saída */}
              <rect
                x={xSai} y={ySai} width={barW} height={hSai}
                rx={2} fill="#ef4444" opacity={0.8}
                className="cursor-pointer hover:opacity-100 transition-opacity"
                onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, ...d })}
                onMouseMove={(e) => setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
              />
              {/* X label */}
              <text
                x={cx} y={PAD.top + CHART_H + 14}
                textAnchor="middle" fontSize={10} fill="#6b7280"
              >
                {labelMes(d.mes)}
              </text>
            </g>
          );
        })}

        {/* Axes */}
        <line
          x1={PAD.left} x2={PAD.left}
          y1={PAD.top} y2={PAD.top + CHART_H}
          stroke="#d1d5db" strokeWidth={1}
        />
        <line
          x1={PAD.left} x2={PAD.left + CHART_W}
          y1={PAD.top + CHART_H} y2={PAD.top + CHART_H}
          stroke="#d1d5db" strokeWidth={1}
        />
      </svg>

      {/* Legenda */}
      <div className="flex items-center gap-4 mt-1 px-1">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="inline-block w-3 h-3 rounded-sm bg-green-500" />
          Recebido
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-500" />
          Pago
        </span>
      </div>

      {/* Tooltip portal-like */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-white border border-gray-200 rounded shadow-lg px-3 py-2 text-xs space-y-0.5"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <p className="font-semibold text-gray-700 mb-1">{labelMes(tooltip.mes)}</p>
          <p className="text-green-600">Recebido: <span className="font-medium">{fmt(tooltip.entradas)}</span></p>
          <p className="text-red-500">Pago: <span className="font-medium">{fmt(tooltip.saidas)}</span></p>
          <p className={`font-semibold ${tooltip.entradas - tooltip.saidas >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            Resultado: {fmt(tooltip.entradas - tooltip.saidas)}
          </p>
        </div>
      )}
    </div>
  );
}
