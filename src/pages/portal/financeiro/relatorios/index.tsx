import React, { useState } from 'react';
import PortalBase from '@/components/Portal/PortalBase';
import FiltroRelatorio from '@/components/financeiro/relatorios/FiltroRelatorio';
import TabelaFluxoCaixa from '@/components/financeiro/relatorios/TabelaFluxoCaixa';
import TabelaCategoria from '@/components/financeiro/relatorios/TabelaCategoria';
import TabelaInadimplencia from '@/components/financeiro/relatorios/TabelaInadimplencia';
import { S_financeiroRelatorios, FluxoCaixaResult, CategoriaRelatorio, InadimplenciaResult } from '@/services/S_financeiroRelatorios';

type Tab = 'fluxo' | 'receitas' | 'despesas' | 'inadimplencia';

const TABS: { id: Tab; label: string }[] = [
  { id: 'fluxo', label: 'Fluxo de Caixa' },
  { id: 'receitas', label: 'Receitas por Categoria' },
  { id: 'despesas', label: 'Despesas por Categoria' },
  { id: 'inadimplencia', label: 'Inadimplência' },
];

const inicioMes = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};
const fimMes = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
};

export default function RelatoriosPage() {
  const [tab, setTab] = useState<Tab>('fluxo');
  const [dataInicio, setDataInicio] = useState(inicioMes());
  const [dataFim, setDataFim] = useState(fimMes());
  const [loading, setLoading] = useState(false);

  const [fluxoCaixa, setFluxoCaixa] = useState<FluxoCaixaResult | null>(null);
  const [receitas, setReceitas] = useState<CategoriaRelatorio[] | null>(null);
  const [despesas, setDespesas] = useState<CategoriaRelatorio[] | null>(null);
  const [inadimplencia, setInadimplencia] = useState<InadimplenciaResult | null>(null);

  const handleBuscar = async () => {
    setLoading(true);
    try {
      if (tab === 'fluxo') {
        const d = await S_financeiroRelatorios.getFluxoCaixa({ dataInicio, dataFim });
        setFluxoCaixa(d);
      } else if (tab === 'receitas') {
        const d = await S_financeiroRelatorios.getReceitasPorCategoria({ dataInicio, dataFim });
        setReceitas(d.categorias);
      } else if (tab === 'despesas') {
        const d = await S_financeiroRelatorios.getDespesasPorCategoria({ dataInicio, dataFim });
        setDespesas(d.categorias);
      } else if (tab === 'inadimplencia') {
        const d = await S_financeiroRelatorios.getInadimplencia();
        setInadimplencia(d);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PortalBase>
      <div className="col-span-full w-full">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Relatórios Financeiros</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.id ? 'bg-white text-indigo-700 shadow' : 'text-gray-600 hover:text-gray-800'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filtros - não mostrar para inadimplência */}
        {tab !== 'inadimplencia' ? (
          <div className="mb-4">
            <FiltroRelatorio
              dataInicio={dataInicio}
              dataFim={dataFim}
              onDataInicioChange={setDataInicio}
              onDataFimChange={setDataFim}
              onBuscar={handleBuscar}
              loading={loading}
            />
          </div>
        ) : (
          <div className="mb-4">
            <button
              onClick={handleBuscar}
              disabled={loading}
              className="bg-indigo-500 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded focus:outline-none"
            >
              {loading ? 'Gerando...' : 'Gerar Relatório'}
            </button>
          </div>
        )}

        {/* Conteúdo */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          {tab === 'fluxo' && (
            fluxoCaixa ? <TabelaFluxoCaixa data={fluxoCaixa} /> : <p className="text-gray-400 text-sm text-center py-8">Clique em &quot;Gerar&quot; para ver o relatório.</p>
          )}
          {tab === 'receitas' && (
            receitas ? <TabelaCategoria categorias={receitas} titulo="Receitas por Categoria" /> : <p className="text-gray-400 text-sm text-center py-8">Clique em &quot;Gerar&quot; para ver o relatório.</p>
          )}
          {tab === 'despesas' && (
            despesas ? <TabelaCategoria categorias={despesas} titulo="Despesas por Categoria" /> : <p className="text-gray-400 text-sm text-center py-8">Clique em &quot;Gerar&quot; para ver o relatório.</p>
          )}
          {tab === 'inadimplencia' && (
            inadimplencia ? <TabelaInadimplencia titulos={inadimplencia.titulos} total={inadimplencia.total} /> : <p className="text-gray-400 text-sm text-center py-8">Clique em &quot;Gerar Relatório&quot; para ver os dados.</p>
          )}
        </div>
      </div>
    </PortalBase>
  );
}
