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

const statusConfig: Record<string, { label: string; className: string }> = {
  aberto: { label: 'Aberto', className: 'bg-blue-100 text-blue-700' },
  parcial: { label: 'Parcial', className: 'bg-yellow-100 text-yellow-700' },
  vencido: { label: 'Vencido', className: 'bg-red-100 text-red-700' },
};

const ProximosVencimentosList: React.FC<Props> = ({ titulos }) => {
  if (titulos.length === 0) {
    return (
      <p className="text-gray-400 text-sm text-center py-4">Nenhum vencimento nos próximos 7 dias.</p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {titulos.map((t) => {
        const sc = statusConfig[t.status] || { label: t.status, className: 'bg-gray-100 text-gray-600' };
        return (
          <li key={t._id} className="py-3 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{t.descricao}</p>
              <p className="text-xs text-gray-500 mt-0.5">Venc: {formatDate(t.vencimento)}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${t.tipo === 'receber' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {t.tipo === 'receber' ? 'Receber' : 'Pagar'}
              </span>
              <span className="text-sm font-bold text-gray-700">{fmt(t.valorOriginal)}</span>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${sc.className}`}>{sc.label}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default ProximosVencimentosList;
