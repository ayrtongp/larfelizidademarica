import React, { useCallback, useEffect, useState } from 'react';
import PortalBase from '@/components/Portal/PortalBase';
import S_financeiroMovimentacoes, { FiltrosMovimentacao } from '@/services/S_financeiroMovimentacoes';
import { T_Movimentacao } from '@/types/T_financeiroMovimentacoes';
import MovimentacoesTable from '@/components/financeiro/movimentacoes/MovimentacoesTable';
import MovimentacaoForm from '@/components/financeiro/movimentacoes/MovimentacaoForm';
import TransferenciaForm from '@/components/financeiro/movimentacoes/TransferenciaForm';
import RateiosListModal from '@/components/financeiro/movimentacoes/RateiosListModal';
import ImportacaoExtrato from '@/components/financeiro/movimentacoes/ImportacaoExtrato';

type ModalTipo = 'movimentacao' | 'transferencia' | 'importar' | null;

interface Conta {
  _id: string;
  nome: string;
  modeloImportacao?: string;
}

export default function MovimentacoesPage() {
  const [movimentacoes, setMovimentacoes] = useState<T_Movimentacao[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [loadingMovs, setLoadingMovs] = useState(false);
  const [erro, setErro] = useState('');

  const [modalAberto, setModalAberto] = useState<ModalTipo>(null);
  const [movimentacaoRateios, setMovimentacaoRateios] = useState<T_Movimentacao | null>(null);
  const [editandoMovimentacao, setEditandoMovimentacao] = useState<T_Movimentacao | null>(null);

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [filtroContaId, setFiltroContaId] = useState('');

  useEffect(() => {
    fetch('/api/Controller/C_financeiroContas?type=getAll')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setContas(Array.isArray(data) ? data : []))
      .catch(() => setContas([]));
  }, []);

  const carregarMovimentacoes = useCallback(async () => {
    setLoadingMovs(true);
    setErro('');
    try {
      const filtros: FiltrosMovimentacao = {};
      if (filtroTipo) filtros.tipoMovimento = filtroTipo;
      if (filtroDataInicio) filtros.dataInicio = filtroDataInicio;
      if (filtroDataFim) filtros.dataFim = filtroDataFim;
      if (filtroContaId) filtros.contaFinanceiraId = filtroContaId;

      const data = await S_financeiroMovimentacoes.getAll(filtros);
      setMovimentacoes(data);
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar movimentações.');
    } finally {
      setLoadingMovs(false);
    }
  }, [filtroTipo, filtroDataInicio, filtroDataFim, filtroContaId]);

  useEffect(() => {
    carregarMovimentacoes();
  }, [carregarMovimentacoes]);

  function handleVerRateios(movimentacao: T_Movimentacao) {
    setMovimentacaoRateios(movimentacao);
  }

  function handleEditar(movimentacao: T_Movimentacao) {
    setEditandoMovimentacao(movimentacao);
    setModalAberto('movimentacao');
  }

  function handleFormSuccess() {
    setModalAberto(null);
    setEditandoMovimentacao(null);
    carregarMovimentacoes();
  }

  return (
    <PortalBase>
      <div className="col-span-full w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Movimentações Financeiras</h1>
            <p className="text-sm text-gray-500 mt-1">Registre e acompanhe entradas, saídas e transferências</p>
          </div>
          <div className="flex flex-wrap gap-2">
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

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Filtros</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full border rounded py-1.5 px-2 text-sm text-gray-700 focus:outline-none focus:shadow-outline"
              >
                <option value="">Todos</option>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
                <option value="transferencia">Transferência</option>
                <option value="ajuste">Ajuste</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data Início</label>
              <input
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                className="w-full border rounded py-1.5 px-2 text-sm text-gray-700 focus:outline-none focus:shadow-outline"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data Fim</label>
              <input
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                className="w-full border rounded py-1.5 px-2 text-sm text-gray-700 focus:outline-none focus:shadow-outline"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Conta</label>
              <select
                value={filtroContaId}
                onChange={(e) => setFiltroContaId(e.target.value)}
                className="w-full border rounded py-1.5 px-2 text-sm text-gray-700 focus:outline-none focus:shadow-outline"
              >
                <option value="">Todas</option>
                {contas.map((c) => (
                  <option key={c._id} value={c._id}>{c.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-lg shadow">
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
            />
          )}
        </div>
      </div>

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
              {modalAberto === 'movimentacao' ? (
                <MovimentacaoForm initialData={editandoMovimentacao ?? undefined} onSuccess={handleFormSuccess} />
              ) : (
                <TransferenciaForm onSuccess={handleFormSuccess} />
              )}
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
    </PortalBase>
  );
}
