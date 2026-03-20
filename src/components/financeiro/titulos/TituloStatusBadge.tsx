import React from 'react';
import { TituloStatus } from '@/types/T_financeiroTitulos';

interface Props {
  status: TituloStatus;
}

const STATUS_CONFIG: Record<TituloStatus, { label: string; className: string }> = {
  aberto: { label: 'Aberto', className: 'bg-blue-100 text-blue-800' },
  parcial: { label: 'Parcial', className: 'bg-yellow-100 text-yellow-800' },
  liquidado: { label: 'Liquidado', className: 'bg-green-100 text-green-800' },
  vencido: { label: 'Vencido', className: 'bg-red-100 text-red-800' },
  cancelado: { label: 'Cancelado', className: 'bg-gray-100 text-gray-600' },
};

const TituloStatusBadge: React.FC<Props> = ({ status }) => {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
};

export default TituloStatusBadge;
