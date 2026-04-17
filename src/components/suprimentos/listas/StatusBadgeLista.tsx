import React from 'react';
import { StatusLista, STATUS_LISTA_CONFIG } from '@/types/T_listaCompras';

interface Props {
  status: StatusLista;
}

const StatusBadgeLista: React.FC<Props> = ({ status }) => {
  const config = STATUS_LISTA_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadgeLista;
