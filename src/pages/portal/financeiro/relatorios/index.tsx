import React, { useState } from 'react';
import PortalBase from '@/components/Portal/PortalBase';
import FiltroRelatorio from '@/components/financeiro/relatorios/FiltroRelatorio';
import TabelaFluxoCaixa from '@/components/financeiro/relatorios/TabelaFluxoCaixa';
import TabelaCategoria from '@/components/financeiro/relatorios/TabelaCategoria';
import TabelaInadimplencia from '@/components/financeiro/relatorios/TabelaInadimplencia';
import { S_financeiroRelatorios, FluxoCaixaResult, CategoriaRelatorio, InadimplenciaResult } from '@/services/S_financeiroRelatorios';
import { S_financeiroDashboard } from '@/services/S_financeiroDashboard';

type Tab = 'fluxo' | 'receitas' | 'despesas' | 'inadimplencia' | 'posicao';

const TABS: { id: Tab; label: string }[] = [
  { id: 'fluxo',        label: 'Fluxo de Caixa' },
  { id: 'receitas',     label: 'Receitas por Categoria' },
  { id: 'despesas',     label: 'Despesas por Categoria' },
  { id: 'inadimplencia', label: 'Inadimplência' },
  { id: 'posicao',      label: 'Posição em Data' },
];

const inicioMes = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};
const fimMes = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
};
const hoje = () => new Date().toISOString().slice(0, 10);

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface ContaPosicao {
  _id: string;
  nome: string;
  tipo: string;
  banco?: string;
  saldoInicial: number;
  saldoNaData: number;
}

export default function RelatoriosPage() {
  const [tab, setTab] = useState<Tab>('fluxo');
  const [dataInicio, setDataInicio] = useState(inicioMes());
  const [dataFim, setDataFim] = useState(fimMes());
  const [loading, setLoading] = useState(false);

  const [fluxoCaixa,    setFluxoCaixa]    = useState<FluxoCaixaResult | null>(null);
  const [receitas,      setReceitas]      = useState<CategoriaRelatorio[] | null>(null);
  const [despesas,      setDespesas]      = useState<CategoriaRelatorio[] | null>(null);
  const [inadimplencia, setInadimplencia] = useState<InadimplenciaResult | null>(null);

  // Posição em data
  const [dataPosicao,   setDataPosicao]   = useState(hoje());
  const [posicao,       setPosicao]       = useState<{ data: string; contas: ContaPosicao[]; totalGeral: number } | null>(null);

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
      } else if (tab === 'posicao') {
        const d = await S_financeiroDashboard.getSaldoNaData(dataPosicao);
        setPosicao(d as any);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const [dd, mm, yyyy] = posicao
    ? posicao.data.split('-').reverse()
    : ['', '', ''];
  const dataFormatada = posicao ? `${dd}/${mm}/${yyyy}` : '';

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

        {/* Filtros */}
        {tab === 'posicao' ? (
          <div className="mb-4 flex items-end gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de referência</label>
              <input
                type="date"
                value={dataPosicao}
                onChange={e => setDataPosicao(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <button
              onClick={handleBuscar}
              disabled={loading || !dataPosicao}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium py-2 px-4 rounded text-sm"
            >
              {loading ? 'Consultando...' : 'Consultar'}
            </button>
          </div>
        ) : tab !== 'inadimplencia' ? (
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
          {tab === 'posicao' && (
            posicao ? (
              <div>
                <p className="text-sm text-gray-500 mb-4">Saldos em <strong>{dataFormatada}</strong></p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
                      <th className="pb-2 pr-4 font-semibold">Conta</th>
                      <th className="pb-2 pr-4 font-semibold">Tipo</th>
                      <th className="pb-2 pr-4 font-semibold text-right">Saldo Inicial</th>
                      <th className="pb-2 font-semibold text-right">Saldo em {dataFormatada}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posicao.contas.map(c => (
                      <tr key={c._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2.5 pr-4 font-medium text-gray-800">
                          {c.nome}
                          {c.banco && <span className="text-xs text-gray-400 ml-1">({c.banco})</span>}
                        </td>
                        <td className="py-2.5 pr-4 text-gray-500 capitalize">{c.tipo}</td>
                        <td className="py-2.5 pr-4 text-right text-gray-500">{fmt(c.saldoInicial)}</td>
                        <td className={`py-2.5 text-right font-semibold ${c.saldoNaData >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                          {fmt(c.saldoNaData)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300">
                      <td colSpan={3} className="pt-3 font-bold text-gray-700">Total Geral</td>
                      <td className={`pt-3 text-right font-bold text-lg ${posicao.totalGeral >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {fmt(posicao.totalGeral)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">Selecione uma data e clique em &quot;Consultar&quot;.</p>
            )
          )}
        </div>
      </div>
    </PortalBase>
  );
}
