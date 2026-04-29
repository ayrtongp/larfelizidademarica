import React, { useCallback, useEffect, useRef, useState } from 'react';
import PortalBase from '@/components/Portal/PortalBase';
import S_financeiroMovimentacoes, { TotaisResult } from '@/services/S_financeiroMovimentacoes';
import { T_Movimentacao } from '@/types/T_financeiroMovimentacoes';
import MovimentacoesTable from '@/components/financeiro/movimentacoes/MovimentacoesTable';
import MovimentacaoForm from '@/components/financeiro/movimentacoes/MovimentacaoForm';
import TransferenciaForm from '@/components/financeiro/movimentacoes/TransferenciaForm';
import RateiosListModal from '@/components/financeiro/movimentacoes/RateiosListModal';
import ImportacaoExtrato from '@/components/financeiro/movimentacoes/ImportacaoExtrato';
import BulkEditModal from '@/components/financeiro/movimentacoes/BulkEditModal';
import FiltrosSidebar, {
  FilterCondition, FilterLogic, describeCondition,
} from '@/components/financeiro/movimentacoes/FiltrosSidebar';

const PAGE_SIZE = 100;

type ModalTipo = 'movimentacao' | 'transferencia' | 'importar' | 'bulkEdit' | null;

interface Conta      { _id: string; nome: string; saldoInicial?: number; modeloImportacao?: string }
interface Categoria  { _id: string; nome: string }

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function MovimentacoesPage() {
  const [movimentacoes, setMovimentacoes] = useState<T_Movimentacao[]>([]);
  const [total, setTotal]                 = useState(0);
  const [contas, setContas]               = useState<Conta[]>([]);
  const [categorias, setCategorias]       = useState<Categoria[]>([]);
  const [loadingMovs, setLoadingMovs]     = useState(false);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [erro, setErro]                   = useState('');

  const [modalAberto, setModalAberto]                     = useState<ModalTipo>(null);
  const [movimentacaoRateios, setMovimentacaoRateios]     = useState<T_Movimentacao | null>(null);
  const [editandoMovimentacao, setEditandoMovimentacao]   = useState<T_Movimentacao | null>(null);
  const [selectedIds, setSelectedIds]                     = useState<string[]>([]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conditions, setConditions]   = useState<FilterCondition[]>([]);
  const [logic, setLogic]             = useState<FilterLogic>('and');
  const [totais, setTotais]           = useState<TotaisResult | null>(null);
  const [busca, setBusca]             = useState('');
  const [semCategoria, setSemCategoria] = useState<number | null>(null);
  const [transferenciaNet, setTransferenciaNet] = useState<number | null>(null);

  const loadSeqRef = useRef(0);

  const contasOpts     = contas.map(c => ({ value: c._id, label: c.nome }));
  const categoriasOpts = categorias.map(c => ({ value: c._id, label: c.nome }));

  const movimentacoesFiltradas = busca.trim()
    ? (() => {
        const q = busca.trim().toLowerCase();
        return movimentacoes.filter(m => {
          const nomeConta = contas.find(c => c._id === m.contaFinanceiraId)?.nome ?? '';
          const nomeCategoria = categorias.find(c => c._id === m.categoriaId)?.nome ?? '';
          return (
            m.historico?.toLowerCase().includes(q) ||
            m.observacoes?.toLowerCase().includes(q) ||
            nomeConta.toLowerCase().includes(q) ||
            nomeCategoria.toLowerCase().includes(q) ||
            String(m.valor).includes(q) ||
            m.dataMovimento?.includes(q)
          );
        });
      })()
    : movimentacoes;

  // Quando há busca ativa, os totais são calculados client-side sobre os registros visíveis
  const totaisVisiveis: TotaisResult | null = busca.trim()
    ? (() => {
        let totalEntradas = 0, totalSaidas = 0, count = 0;
        for (const m of movimentacoesFiltradas) {
          count++;
          if (m.tipoMovimento === 'entrada') totalEntradas += m.valor;
          else if (m.tipoMovimento === 'saida') totalSaidas += m.valor;
        }
        return { totalEntradas, totalSaidas, resultado: totalEntradas - totalSaidas, count };
      })()
    : totais;

  // Saldo inicial: da conta filtrada (se houver filtro eq por conta) ou soma de todas
  const saldoInicial = (() => {
    const contaEq = conditions.find(c => c.field === 'contaFinanceiraId' && c.operator === 'eq');
    if (contaEq) return contas.find(c => c._id === contaEq.value)?.saldoInicial ?? 0;
    return contas.reduce((acc, c) => acc + (c.saldoInicial ?? 0), 0);
  })();
  const saldoFinal = saldoInicial + (totaisVisiveis?.resultado ?? 0);

  useEffect(() => {
    fetch('/api/Controller/C_financeiroContas?type=getAll')
      .then(r => r.ok ? r.json() : []).then(d => setContas(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/Controller/C_financeiroCategorias?type=getAll')
      .then(r => r.ok ? r.json() : []).then(d => setCategorias(Array.isArray(d) ? d : [])).catch(() => {});
    const condSC = encodeURIComponent(JSON.stringify([{ field: 'categoriaId', operator: 'empty', value: '' }]));
    fetch(`/api/Controller/C_financeiroMovimentacoes?type=getAll&conditions=${condSC}&limit=1`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setSemCategoria(d.total))
      .catch(() => {});
    fetch('/api/Controller/C_financeiroMovimentacoes?type=transferenciaStatus')
      .then(r => r.ok ? r.json() : null)
      .then(d => d !== null && setTransferenciaNet(d.net ?? 0))
      .catch(() => {});
  }, []);

  const carregarTotais = useCallback(async () => {
    const seq = loadSeqRef.current;
    try {
      const t = await S_financeiroMovimentacoes.getTotals({ conditions, logic });
      if (seq !== loadSeqRef.current) return;
      setTotais(t);
    } catch { if (seq === loadSeqRef.current) setTotais(null); }
  }, [conditions, logic]);

  const atualizarSemCategoria = useCallback(() => {
    const condSC = encodeURIComponent(JSON.stringify([{ field: 'categoriaId', operator: 'empty', value: '' }]));
    fetch(`/api/Controller/C_financeiroMovimentacoes?type=getAll&conditions=${condSC}&limit=1`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setSemCategoria(d.total))
      .catch(() => {});
  }, []);

  useEffect(() => { carregarTotais(); }, [carregarTotais]);

  // Carga inicial / re-carga quando filtros mudam
  const carregarMovimentacoes = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    setLoadingMovs(true);
    setErro('');
    try {
      const result = await S_financeiroMovimentacoes.getAll({ conditions, logic, skip: 0, limit: PAGE_SIZE });
      if (seq !== loadSeqRef.current) return; // resposta obsoleta — descarta
      setMovimentacoes(result.items);
      setTotal(result.total);
      setSelectedIds([]);
    } catch (err: any) {
      if (seq !== loadSeqRef.current) return;
      setErro(err.message || 'Erro ao carregar movimentações.');
    } finally {
      if (seq === loadSeqRef.current) setLoadingMovs(false);
    }
  }, [conditions, logic]);

  useEffect(() => { carregarMovimentacoes(); }, [carregarMovimentacoes]);

  // Carregar mais (append)
  async function loadMore(limit: number) {
    const seq = ++loadSeqRef.current;
    setLoadingMore(true);
    try {
      const result = await S_financeiroMovimentacoes.getAll({
        conditions, logic, skip: movimentacoes.length, limit,
      });
      if (seq !== loadSeqRef.current) return;
      setMovimentacoes(prev => [...prev, ...result.items]);
      setTotal(result.total);
    } catch (err: any) {
      if (seq === loadSeqRef.current) setErro(err.message || 'Erro ao carregar mais registros.');
    } finally {
      if (seq === loadSeqRef.current) setLoadingMore(false);
    }
  }

  function removeCondition(id: string) {
    setConditions(prev => prev.filter(c => c.id !== id));
  }

  function aplicarFiltroSemCategoria() {
    const jaAtivo = conditions.some(c => c.field === 'categoriaId' && c.operator === 'empty');
    if (!jaAtivo) {
      setConditions(prev => [...prev, { id: 'sem-categoria-' + Date.now(), field: 'categoriaId', operator: 'empty', value: '' }]);
    }
  }

  function handleVerRateios(mov: T_Movimentacao) { setMovimentacaoRateios(mov); }
  function handleEditar(mov: T_Movimentacao)      { setEditandoMovimentacao(mov); setModalAberto('movimentacao'); }

  // Recarrega silenciosamente — sem spinner, sem perder posição de scroll
  const recarregarPreservando = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    const limit = Math.max(movimentacoes.length, PAGE_SIZE);
    try {
      const result = await S_financeiroMovimentacoes.getAll({ conditions, logic, skip: 0, limit });
      if (seq !== loadSeqRef.current) return;
      setMovimentacoes(result.items);
      setTotal(result.total);
    } catch (err: any) {
      if (seq === loadSeqRef.current) setErro(err.message || 'Erro ao recarregar.');
    }
  }, [conditions, logic, movimentacoes.length]);

  function handleFormSuccess() {
    setModalAberto(null);
    setEditandoMovimentacao(null);
    recarregarPreservando();
    carregarTotais();
    atualizarSemCategoria();
  }

  function handleBulkSuccess() {
    setModalAberto(null);
    setSelectedIds([]);
    recarregarPreservando();
    carregarTotais();
    atualizarSemCategoria();
  }

  const hasMore = movimentacoes.length < total;

  return (
    <PortalBase>
      <div className="col-span-full w-full space-y-4">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Movimentações Financeiras</h1>
            <p className="text-sm text-gray-500 mt-1">Registre e acompanhe entradas, saídas e transferências</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Busca global */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar histórico, conta..."
                className="pl-9 pr-8 py-2 border border-gray-300 rounded shadow bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 w-56"
              />
              {busca && (
                <button
                  onClick={() => setBusca('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <button
              onClick={() => setSidebarOpen(true)}
              className={`relative flex items-center gap-2 px-4 py-2 border text-sm font-medium rounded shadow transition-colors ${conditions.length > 0 ? 'border-indigo-400 bg-indigo-50 text-indigo-700 hover:bg-indigo-100' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h2" />
              </svg>
              Filtros
              {conditions.length > 0 && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                  {conditions.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setEditandoMovimentacao(null); setModalAberto('movimentacao'); }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded shadow"
            >
              Nova Movimentação
            </button>
            <button
              onClick={() => setModalAberto('transferencia')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded shadow"
            >
              Nova Transferência
            </button>
            <button
              onClick={() => setModalAberto('importar')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded shadow"
            >
              Importar Extrato
            </button>
          </div>
        </div>

        {/* Chips de filtros ativos */}
        {conditions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${logic === 'and' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
              {logic === 'and' ? 'E' : 'OU'}
            </span>
            {conditions.map(cond => (
              <span
                key={cond.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-medium"
              >
                {describeCondition(cond, contasOpts, categoriasOpts)}
                <button
                  onClick={() => removeCondition(cond.id)}
                  className="text-indigo-400 hover:text-indigo-700 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            <button
              onClick={() => setConditions([])}
              className="text-xs text-gray-400 hover:text-red-600 font-medium transition-colors ml-1"
            >
              Limpar tudo
            </button>
            <span className="text-xs text-gray-400 ml-auto">
              {movimentacoes.length} de {total} registros
            </span>
          </div>
        )}

        {/* Barra de somatórios */}
        {totaisVisiveis && (
          <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm">
            {busca.trim() && (
              <>
                <span className="text-xs text-amber-600 font-medium">busca ativa</span>
                <span className="text-gray-300">|</span>
              </>
            )}
            <span className="text-green-700 font-semibold">
              ↑ Entradas&nbsp;
              <span className="font-bold">
                {formatCurrency(totaisVisiveis.totalEntradas)}
              </span>
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-red-600 font-semibold">
              ↓ Saídas&nbsp;
              <span className="font-bold">
                {formatCurrency(totaisVisiveis.totalSaidas)}
              </span>
            </span>
            <span className="text-gray-300">|</span>
            <span className={`font-semibold ${totaisVisiveis.resultado >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
              = Resultado&nbsp;
              <span className="font-bold">
                {formatCurrency(totaisVisiveis.resultado)}
              </span>
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-slate-600 font-semibold">
              Saldo inicial&nbsp;
              <span className="font-bold">{formatCurrency(saldoInicial)}</span>
            </span>
            <span className="text-gray-300">|</span>
            <span className={`font-semibold ${saldoFinal >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              Saldo final&nbsp;
              <span className="font-bold">{formatCurrency(saldoFinal)}</span>
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">{totaisVisiveis.count} registro{totaisVisiveis.count !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Aviso: transferências desbalanceadas */}
        {transferenciaNet !== null && transferenciaNet !== 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-xs font-medium">
            <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span>
              Transferências desbalanceadas — diferença de{' '}
              <strong>{Math.abs(transferenciaNet).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
              {transferenciaNet > 0 ? ' a mais em entradas (falta criar saída par)' : ' a mais em saídas (falta criar entrada par)'}
            </span>
          </div>
        )}

        {/* Card: sem categoria */}
        {semCategoria !== null && semCategoria > 0 && (
          <button
            onClick={aplicarFiltroSemCategoria}
            title="Filtrar movimentações sem categoria"
            className="self-start flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-xs font-medium hover:bg-amber-100 transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 4a8 8 0 100 16 8 8 0 000-16z" />
            </svg>
            <span>{semCategoria} sem categoria</span>
            <span className="text-amber-500 text-[10px]">— clique para filtrar</span>
          </button>
        )}

        {/* Barra de ações em lote */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2.5">
            <span className="text-sm font-medium text-indigo-700">{selectedIds.length} selecionadas</span>
            <button
              onClick={() => setModalAberto('bulkEdit')}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded shadow"
            >
              Editar em lote
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Limpar seleção
            </button>
          </div>
        )}

        {/* Tabela */}
        <div className="bg-white rounded-lg shadow" style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', overflowX: 'auto' }}>
          {loadingMovs ? (
            <div className="text-center py-10 text-gray-500">Carregando movimentações...</div>
          ) : erro ? (
            <div className="text-center py-10 text-red-600">{erro}</div>
          ) : (
            <MovimentacoesTable
              movimentacoes={movimentacoesFiltradas}
              contas={contas}
              onVerRateios={handleVerRateios}
              onEditar={handleEditar}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          )}
        </div>

        {/* Rodapé de paginação */}
        {!loadingMovs && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              {busca.trim()
                ? <>{movimentacoesFiltradas.length} resultado{movimentacoesFiltradas.length !== 1 ? 's' : ''} de {movimentacoes.length} carregados</>
                : <>{movimentacoes.length} de {total} registros carregados</>
              }
            </span>
            {hasMore && (
              <div className="flex items-center gap-2">
                {loadingMore && <span className="text-xs text-gray-400">Carregando…</span>}
                {total - movimentacoes.length > 100 && (
                  <button
                    onClick={() => loadMore(100)}
                    disabled={loadingMore}
                    className="px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    + 100
                  </button>
                )}
                <button
                  onClick={() => loadMore(total - movimentacoes.length)}
                  disabled={loadingMore}
                  className="px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  + {total - movimentacoes.length}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar de filtros */}
      <FiltrosSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conditions={conditions}
        logic={logic}
        onConditionsChange={setConditions}
        onLogicChange={setLogic}
        contas={contasOpts}
        categorias={categoriasOpts}
      />

      {/* Modal Nova Movimentação / Transferência */}
      {(modalAberto === 'movimentacao' || modalAberto === 'transferencia') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                {modalAberto === 'transferencia' ? 'Nova Transferência' : editandoMovimentacao ? 'Editar Movimentação' : 'Nova Movimentação'}
              </h3>
              <button
                onClick={() => { setModalAberto(null); setEditandoMovimentacao(null); }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {modalAberto === 'movimentacao'
                ? <MovimentacaoForm initialData={editandoMovimentacao ?? undefined} onSuccess={handleFormSuccess} />
                : <TransferenciaForm onSuccess={handleFormSuccess} />
              }
            </div>
          </div>
        </div>
      )}

      {/* Modal Importar Extrato */}
      {modalAberto === 'importar' && (
        <ImportacaoExtrato
          contas={contas}
          onClose={() => setModalAberto(null)}
          onSuccess={() => { setModalAberto(null); carregarMovimentacoes(); carregarTotais(); }}
        />
      )}

      {/* Modal Rateios */}
      <RateiosListModal
        movimentacao={movimentacaoRateios}
        onClose={() => setMovimentacaoRateios(null)}
      />

      {/* Modal Edição em Lote */}
      {modalAberto === 'bulkEdit' && (
        <BulkEditModal
          ids={selectedIds}
          onSuccess={handleBulkSuccess}
          onClose={() => setModalAberto(null)}
        />
      )}
    </PortalBase>
  );
}
