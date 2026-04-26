import React, { useEffect, useState } from 'react';
import PortalBase from '@/components/Portal/PortalBase';

interface InsumoAbaixoMinimo {
  _id: string;
  nome_insumo: string;
  unidade_base: string;
  cod_categoria: string;
  estoque_minimo: number;
  totalQuantidade: number;
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

const Reposicao = () => {
  const [items, setItems] = useState<InsumoAbaixoMinimo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  function load() {
    setLoading(true);
    fetch('/api/Controller/Insumos?type=getAbaixoMinimo')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setItems(Array.isArray(data) ? data : []); setLastRefresh(new Date()); })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return (
    <PortalBase>
      <div className="col-span-full space-y-4">

        {/* Cabeçalho */}
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <h1 className="font-bold text-xl text-gray-900">Lista de Reposição</h1>
            <p className="text-sm text-gray-500 mt-0.5">Insumos com estoque abaixo do mínimo configurado</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Atualizar
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <svg className="w-12 h-12 text-emerald-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-gray-600">Tudo em ordem!</p>
            <p className="text-xs text-gray-400">Nenhum insumo abaixo do estoque mínimo.</p>
            <p className="text-xs text-gray-300 mt-2">
              Configure o estoque mínimo em <span className="font-medium">Suprimentos → Novo Insumo</span> para ativar os alertas.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400">{items.length} item(ns) precisam de reposição</p>

            {/* Cards — funciona bem em mobile e desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map(item => {
                const falta = item.estoque_minimo - item.totalQuantidade;
                const isZerado = item.totalQuantidade <= 0;
                return (
                  <div
                    key={item._id}
                    className={`bg-white rounded-xl border shadow-sm p-4 ${isZerado ? 'border-red-200' : 'border-orange-200'}`}
                  >
                    {/* Nome + categoria */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-gray-800 text-sm leading-tight">{item.nome_insumo}</h3>
                      <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${catColor(item.cod_categoria)}`}>
                        {item.cod_categoria}
                      </span>
                    </div>

                    {/* Métricas */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-50 rounded-lg py-2 px-1">
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Atual</p>
                        <p className={`text-xl font-bold tabular-nums ${isZerado ? 'text-red-600' : 'text-orange-500'}`}>
                          {item.totalQuantidade}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg py-2 px-1">
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Mínimo</p>
                        <p className="text-xl font-bold tabular-nums text-gray-700">{item.estoque_minimo}</p>
                      </div>
                      <div className={`rounded-lg py-2 px-1 ${isZerado ? 'bg-red-50' : 'bg-orange-50'}`}>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Repor</p>
                        <p className={`text-xl font-bold tabular-nums ${isZerado ? 'text-red-600' : 'text-orange-600'}`}>
                          {falta}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 mt-2 text-center">em {item.unidade_base}</p>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-gray-300 text-center">
              Atualizado em {lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </>
        )}
      </div>
    </PortalBase>
  );
};

export default Reposicao;
