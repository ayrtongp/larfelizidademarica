import React from 'react';

type Cor = 'verde' | 'vermelho' | 'azul' | 'amarelo' | 'cinza';

interface Props {
  titulo: string;
  valor: string;
  cor?: Cor;
  icone?: React.ReactNode;
}

const corConfig: Record<Cor, string> = {
  verde: 'border-green-500',
  vermelho: 'border-red-500',
  azul: 'border-blue-500',
  amarelo: 'border-yellow-500',
  cinza: 'border-gray-400',
};

const DashboardCard: React.FC<Props> = ({ titulo, valor, cor = 'azul', icone }) => {
  const borderClass = corConfig[cor];

  return (
    <div className={`bg-white rounded-lg shadow border border-gray-100 border-l-4 ${borderClass} p-4 flex items-start gap-3`}>
      {icone && (
        <div className="flex-shrink-0 text-gray-400 mt-0.5">
          {icone}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide truncate">{titulo}</p>
        <p className="text-xl font-bold text-gray-800 mt-1">{valor}</p>
      </div>
    </div>
  );
};

export default DashboardCard;
