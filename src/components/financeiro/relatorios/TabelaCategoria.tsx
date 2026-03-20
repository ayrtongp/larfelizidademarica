import React from 'react';
import { CategoriaRelatorio } from '@/services/S_financeiroRelatorios';

interface Props {
  categorias: CategoriaRelatorio[];
  titulo?: string;
}

const fmt = (v: number) =>
  v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? '-';

const TabelaCategoria: React.FC<Props> = ({ categorias, titulo }) => {
  if (!categorias || categorias.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-6">Nenhum dado encontrado para o período.</p>;
  }

  const sorted = [...categorias].sort((a, b) => b.total - a.total);
  const totalGeral = sorted.reduce((acc, c) => acc + c.total, 0);

  return (
    <div className="overflow-x-auto">
      {titulo && <h3 className="text-sm font-semibold text-gray-700 mb-2">{titulo}</h3>}
      <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Categoria</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">% do Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map((c) => {
            const pct = totalGeral > 0 ? ((c.total / totalGeral) * 100).toFixed(1) : '0.0';
            return (
              <tr key={c.categoriaId} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm text-gray-700">{c.nome}</td>
                <td className="px-4 py-2 text-sm text-right text-gray-700 font-medium">{fmt(c.total)}</td>
                <td className="px-4 py-2 text-sm text-right text-gray-500">{pct}%</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-gray-100 font-bold">
          <tr>
            <td className="px-4 py-3 text-sm text-gray-700">Total</td>
            <td className="px-4 py-3 text-sm text-right text-gray-800">{fmt(totalGeral)}</td>
            <td className="px-4 py-3 text-sm text-right text-gray-700">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default TabelaCategoria;
