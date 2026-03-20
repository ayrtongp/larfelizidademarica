import React from 'react';
import Button_M3 from '@/components/Formularios/Button_M3';

interface Props {
  dataInicio: string;
  dataFim: string;
  onDataInicioChange: (v: string) => void;
  onDataFimChange: (v: string) => void;
  onBuscar: () => void;
  loading?: boolean;
}

const FiltroRelatorio: React.FC<Props> = ({ dataInicio, dataFim, onDataInicioChange, onDataFimChange, onBuscar, loading }) => {
  return (
    <div className="flex flex-wrap items-end gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1">Data Início</label>
        <input
          type="date"
          value={dataInicio}
          onChange={(e) => onDataInicioChange(e.target.value)}
          className="shadow border rounded py-2 px-3 text-gray-700 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1">Data Fim</label>
        <input
          type="date"
          value={dataFim}
          onChange={(e) => onDataFimChange(e.target.value)}
          className="shadow border rounded py-2 px-3 text-gray-700 focus:outline-none"
        />
      </div>
      <Button_M3 label={loading ? 'Gerando...' : 'Gerar'} onClick={onBuscar} type="button" disabled={loading} />
    </div>
  );
};

export default FiltroRelatorio;
