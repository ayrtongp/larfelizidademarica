import React from 'react';
import { FluxoCaixaLinha, FluxoCaixaResult } from '@/services/S_financeiroRelatorios';

interface Props {
  data: FluxoCaixaResult;
}

const fmt = (v: number) =>
  v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? '-';

const formatDate = (d: string) => {
  const [y, m, day] = d.slice(0, 10).split('-');
  return `${day}/${m}/${y}`;
};

const TabelaFluxoCaixa: React.FC<Props> = ({ data }) => {
  if (!data || data.linhas.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-6">Nenhum dado encontrado para o período.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Data</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Entradas</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Saídas</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Resultado do Dia</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.linhas.map((l: FluxoCaixaLinha) => (
            <tr key={l.data} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm text-gray-700">{formatDate(l.data)}</td>
              <td className="px-4 py-2 text-sm text-right text-green-600">{fmt(l.entradas)}</td>
              <td className="px-4 py-2 text-sm text-right text-red-600">{fmt(l.saidas)}</td>
              <td className={`px-4 py-2 text-sm text-right font-semibold ${l.saldo_dia >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {fmt(l.saldo_dia)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-100 font-bold">
          <tr>
            <td className="px-4 py-3 text-sm text-gray-700">Total</td>
            <td className="px-4 py-3 text-sm text-right text-green-700">{fmt(data.totalEntradas)}</td>
            <td className="px-4 py-3 text-sm text-right text-red-700">{fmt(data.totalSaidas)}</td>
            <td className={`px-4 py-3 text-sm text-right ${data.resultado >= 0 ? 'text-green-700' : 'text-red-700'}`}>{fmt(data.resultado)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default TabelaFluxoCaixa;
