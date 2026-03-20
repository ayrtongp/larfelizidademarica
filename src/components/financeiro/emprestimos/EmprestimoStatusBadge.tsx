import React from 'react';
import { StatusEmprestimo } from '@/types/T_financeiroEmprestimos';

interface Props {
  status: StatusEmprestimo;
}

const config: Record<StatusEmprestimo, { label: string; className: string }> = {
  aberto: { label: 'Aberto', className: 'bg-blue-100 text-blue-800' },
  parcial: { label: 'Parcial', className: 'bg-yellow-100 text-yellow-800' },
  quitado: { label: 'Quitado', className: 'bg-green-100 text-green-800' },
  cancelado: { label: 'Cancelado', className: 'bg-gray-100 text-gray-600' },
};

const EmprestimoStatusBadge: React.FC<Props> = ({ status }) => {
  const { label, className } = config[status] || config.aberto;
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
};

export default EmprestimoStatusBadge;
