import React, { useCallback, useEffect, useState } from 'react';
import PortalBase from '@/components/Portal/PortalBase';
import S_financeiroMovimentacoes from '@/services/S_financeiroMovimentacoes';
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

interface Conta      { _id: string; nome: string; modeloImportacao?: string }
interface Categoria  { _id: string; nome: string }

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

  const contasOpts     = contas.map(c => ({ value: c._id, label: c.nome }));
  const categoriasOpts = categorias.map(c => ({ value: c._id, label: c.nome }));

  useEffect(() => {
    fetch('/api/Controller/C_financeiroContas?type=getAll')
      .then(r => r.ok ? r.json() : []).then(d => setContas(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/Controller/C_financeiroCategorias?type=getAll')
      .then(r => r.ok ? r.json() : []).then(d => setCategorias(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  // Carga inicial / re-carga quando filtros mudam
  const carregarMovimentacoes = useCallback(async () => {
    setLoadingMovs(true);
    setErro('');
    try {
      const result = await S_financeiroMovimentacoes.getAll({ conditions, logic, skip: 0, limit: PAGE_SIZE });
      setMovimentacoes(result.items);
      setTotal(result.total);
      setSelectedIds([]);
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar movimentações.');
    } finally {
      setLoadingMovs(false);
    }
  }, [conditions, logic]);

  useEffect(() => { carregarMovimentacoes(); }, [carregarMovimentacoes]);

  // Carregar mais (append)
  async function loadMore(limit: number) {
    setLoadingMore(true);
    try {
      const result = await S_financeiroMovimentacoes.getAll({
        conditions, logic, skip: movimentacoes.length, limit,
      });
      setMovimentacoes(prev => [...prev, ...result.items]);
      setTotal(result.total);
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar mais registros.');
    } finally {
      setLoadingMore(false);
    }
  }

  function removeCondition(id: string) {
    setConditions(prev => prev.filter(c => c.id !== id));
  }

  function handleVerRateios(mov: T_Movimentacao) { setMovimentacaoRateios(mov); }
  function handleEditar(mov: T_Movimentacao)      { setEditandoMovimentacao(mov); setModalAberto('movimentacao'); }

  function handleFormSuccess() {
    setModalAberto(null);
    setEditandoMovimentacao(null);
    carregarMovimentacoes();
  }

  function handleBulkSuccess() {
    setModalAberto(null);
    setSelectedIds([]);
    carregarMovimentacoes();
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
        <div className="bg-white rounded-lg shadow" style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
          {loadingMovs ? (
            <div className="text-center py-10 text-gray-500">Carregando movimentações...</div>
          ) : erro ? (
            <div className="text-center py-10 text-red-600">{erro}</div>
          ) : (
            <MovimentacoesTable
              movimentacoes={movimentacoes}
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
              {movimentacoes.length} de {total} registros carregados
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
          onSuccess={() => { setModalAberto(null); carregarMovimentacoes(); }}
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
