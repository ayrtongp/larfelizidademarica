import React from 'react';
import { T_TituloVencimento } from '@/types/T_financeiroDashboard';

interface Props {
  titulos: T_TituloVencimento[];
}

const fmt = (v: number) =>
  v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? '-';

const formatDate = (d?: string) => {
  if (!d) return '-';
  const [y, m, day] = d.slice(0, 10).split('-');
  return `${day}/${m}/${y}`;
};

const diasVencido = (vencimento: string): number => {
  const hoje = new Date();
  const venc = new Date(vencimento);
  const diff = Math.floor((hoje.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
};

const VencidosList: React.FC<Props> = ({ titulos }) => {
  if (titulos.length === 0) {
    return (
      <p className="text-gray-400 text-sm text-center py-4">Nenhum título vencido.</p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {titulos.map((t) => (
        <li key={t._id} className="py-3 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{t.descricao}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-gray-500">Venc: {formatDate(t.vencimento)}</p>
              <span className="text-xs text-red-600 font-medium">{diasVencido(t.vencimento)} dias</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right">
              <p className="text-xs text-gray-500">Saldo</p>
              <p className="text-sm font-bold text-red-600">{fmt(t.saldo)}</p>
            </div>
            <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">
              Vencido
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default VencidosList;
