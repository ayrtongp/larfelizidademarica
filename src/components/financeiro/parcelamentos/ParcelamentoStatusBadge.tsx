import React from 'react';
import { StatusParcelamento } from '@/types/T_financeiroParcelamentos';

interface Props {
  status: StatusParcelamento;
}

const config: Record<StatusParcelamento, { label: string; className: string }> = {
  ativo:     { label: 'Ativo',     className: 'bg-blue-100 text-blue-800' },
  quitado:   { label: 'Quitado',   className: 'bg-green-100 text-green-800' },
  cancelado: { label: 'Cancelado', className: 'bg-gray-100 text-gray-600' },
};

const ParcelamentoStatusBadge: React.FC<Props> = ({ status }) => {
  const { label, className } = config[status] ?? config.ativo;
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
};

export default ParcelamentoStatusBadge;
