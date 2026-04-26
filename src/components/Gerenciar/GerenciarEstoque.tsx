import { InsumoWithInventory } from '@/models/insumos.model';
import React, { useMemo, useState } from 'react';

interface Props {
  insumos: InsumoWithInventory[];
}

function catColor(cat: string) {
  const palette = [
    'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700',
    'bg-purple-100 text-purple-700', 'bg-yellow-100 text-yellow-800',
    'bg-pink-100 text-pink-700', 'bg-indigo-100 text-indigo-700',
  ];
  let h = 0;
  for (let i = 0; i < cat.length; i++) h = (h * 31 + cat.charCodeAt(i)) % palette.length;
  return palette[Math.abs(h)];
}

function StockAlert({ total, minimo }: { total: number; minimo?: number }) {
  const min = minimo ?? 0;
  if (min <= 0) return null;
  if (total <= 0) return <span className="text-[10px] font-semibold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Zerado</span>;
  if (total < min) return <span className="text-[10px] font-semibold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">Baixo</span>;
  return null;
}

function stockValueColor(total: number, minimo?: number) {
  const min = minimo ?? 0;
  if (total <= 0) return 'text-red-600 font-bold';
  if (min > 0 && total < min) return 'text-orange-500 font-semibold';
  return 'text-gray-800 font-medium';
}

const GerenciarEstoque = ({ insumos }: Props) => {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');

  const categorias = useMemo(
    () => [...new Set(insumos.map(i => i.cod_categoria))].sort(),
    [insumos]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return insumos.filter(i => {
      const matchSearch = !q || i.nome_insumo.toLowerCase().includes(q);
      const matchCat = !catFilter || i.cod_categoria === catFilter;
      return matchSearch && matchCat;
    });
  }, [insumos, search, catFilter]);

  const alertCount = useMemo(
    () => insumos.filter(i => (i.estoque_minimo ?? 0) > 0 && i.totalQuantidade < (i.estoque_minimo ?? 0)).length,
    [insumos]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="font-bold text-xl">Gerenciar Estoque</h1>
        {alertCount > 0 && (
          <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full">
            {alertCount} item(ns) abaixo do mínimo
          </span>
        )}
      </div>

      {/* Busca */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="search"
          placeholder="Buscar insumo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      </div>

      {/* Filtro por categoria */}
      {categorias.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCatFilter('')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${!catFilter ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Todos
          </button>
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setCatFilter(catFilter === cat ? '' : cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${catFilter === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">Nenhum insumo encontrado.</p>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(obj => (
              <div
                key={obj._id}
                className={`bg-white border rounded-xl p-4 shadow-sm ${(obj.estoque_minimo ?? 0) > 0 && obj.totalQuantidade < (obj.estoque_minimo ?? 0) ? 'border-orange-200' : 'border-gray-200'}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-semibold text-gray-800 text-sm leading-tight">{obj.nome_insumo}</span>
                  <StockAlert total={obj.totalQuantidade} minimo={obj.estoque_minimo} />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${catColor(obj.cod_categoria)}`}>{obj.cod_categoria}</span>
                  <span className="text-xs text-gray-400">{obj.unidade_base}</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Estoque</p>
                    <p className={`text-2xl tabular-nums ${stockValueColor(obj.totalQuantidade, obj.estoque_minimo)}`}>
                      {obj.totalQuantidade}
                    </p>
                  </div>
                  {(obj.estoque_minimo ?? 0) > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Mínimo</p>
                      <p className="text-sm font-medium text-gray-500 tabular-nums">{obj.estoque_minimo}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: tabela */}
          <div className="hidden md:block overflow-x-auto border rounded-xl shadow-sm bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Insumo</th>
                  <th className="px-4 py-3 text-left">Categoria</th>
                  <th className="px-4 py-3 text-center">Unidade</th>
                  <th className="px-4 py-3 text-right">Estoque</th>
                  <th className="px-4 py-3 text-right">Mínimo</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((obj, index) => (
                  <tr key={obj._id ?? index} className="odd:bg-white even:bg-gray-50 hover:bg-indigo-50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-gray-800">{obj.nome_insumo}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${catColor(obj.cod_categoria)}`}>{obj.cod_categoria}</span>
                    </td>
                    <td className="px-4 py-2.5 text-center text-xs text-gray-500">{obj.unidade_base}</td>
                    <td className={`px-4 py-2.5 text-right tabular-nums ${stockValueColor(obj.totalQuantidade, obj.estoque_minimo)}`}>
                      {obj.totalQuantidade}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-xs text-gray-400">
                      {(obj.estoque_minimo ?? 0) > 0 ? obj.estoque_minimo : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <StockAlert total={obj.totalQuantidade} minimo={obj.estoque_minimo} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="text-xs text-gray-400 text-center">{filtered.length} de {insumos.length} insumos</p>
    </div>
  );
};

export default GerenciarEstoque;
