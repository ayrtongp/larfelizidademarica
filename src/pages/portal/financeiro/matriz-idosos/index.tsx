import React, { useEffect, useState, useMemo, useCallback } from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';
import PortalBase from '@/components/Portal/PortalBase';
import { FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';
import MovimentacaoForm from '@/components/financeiro/movimentacoes/MovimentacaoForm';
import S_financeiroMovimentacoes from '@/services/S_financeiroMovimentacoes';
import { T_Movimentacao } from '@/types/T_financeiroMovimentacoes';

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

type MesData  = { mes: string; receita: number; despesa: number; saldo: number };
type LinhaIdoso = {
  residenteId: string;
  nome: string;
  ativo: boolean;
  meses: MesData[];
  totalReceita: number;
  totalDespesa: number;
  totalSaldo: number;
};

type DetalheItem = {
  _id: string;
  historico: string;
  tipoMovimento: string;
  valor: number;
  dataMovimento: string;
  competencia: string;
  fonte: 'direta' | 'rateio';
  movimentacaoId?: string;
};

type ModalState =
  | { tipo: 'geral'; linha: LinhaIdoso }
  | { tipo: 'mes'; residenteId: string; nome: string; ano: number; mes: string; mesLabel: string; items: DetalheItem[] | null; loading: boolean }
  | null;

type Visao = 'saldo' | 'receita' | 'despesa';

const fmt = (v: number) =>
  v === 0 ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });

const fmtFull = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function cellClass(saldo: number, visao: Visao) {
  if (visao === 'receita') return saldo > 0 ? 'text-green-700' : 'text-gray-300';
  if (visao === 'despesa') return saldo > 0 ? 'text-red-600'   : 'text-gray-300';
  if (saldo > 0)  return 'text-green-700';
  if (saldo < 0)  return 'text-red-600';
  return 'text-gray-300';
}

function cellBg(saldo: number, visao: Visao) {
  if (saldo === 0) return '';
  if (visao === 'receita') return 'bg-green-50';
  if (visao === 'despesa') return 'bg-red-50';
  return saldo > 0 ? 'bg-green-50' : 'bg-red-50';
}

function fmtData(iso: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

const MatrizIdosos = () => {
  const [ano, setAno]       = useState(new Date().getFullYear());
  const [dados, setDados]   = useState<LinhaIdoso[]>([]);
  const [loading, setLoading] = useState(false);
  const [visao, setVisao]   = useState<Visao>('saldo');
  const [busca, setBusca]   = useState('');
  const [modal, setModal]   = useState<ModalState>(null);
  const [editMov, setEditMov] = useState<T_Movimentacao | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const carregar = async (a: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/Controller/C_financeiroRelatorios?type=matrizIdosos&ano=${a}`);
      const data = await res.json();
      setDados(Array.isArray(data) ? data : []);
    } catch { setDados([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { carregar(ano); }, [ano]);

  const linhas = useMemo(() =>
    dados.filter((l) => !busca || l.nome.toLowerCase().includes(busca.toLowerCase())),
    [dados, busca]
  );

  const totaisMes = useMemo(() =>
    MESES.map((_, i) => {
      const mes = String(i + 1).padStart(2, '0');
      return linhas.reduce((acc, l) => {
        const m = l.meses.find((x) => x.mes === mes);
        return {
          receita: acc.receita + (m?.receita ?? 0),
          despesa: acc.despesa + (m?.despesa ?? 0),
          saldo:   acc.saldo   + (m?.saldo   ?? 0),
        };
      }, { receita: 0, despesa: 0, saldo: 0 });
    }),
    [linhas]
  );

  const getValue = (m: MesData, v: Visao) =>
    v === 'receita' ? m.receita : v === 'despesa' ? m.despesa : m.saldo;

  const getTotalValue = (l: LinhaIdoso, v: Visao) =>
    v === 'receita' ? l.totalReceita : v === 'despesa' ? l.totalDespesa : l.totalSaldo;

  const abrirModalGeral = useCallback((linha: LinhaIdoso) => {
    setModal({ tipo: 'geral', linha });
  }, []);

  const recarregarDetalhe = useCallback(async () => {
    setModal((prev) => {
      if (prev?.tipo !== 'mes') return prev;
      const { residenteId, mes } = prev;
      fetch(`/api/Controller/C_financeiroRelatorios?type=matrizIdososDetalhe&residenteId=${encodeURIComponent(residenteId)}&ano=${ano}&mes=${mes}`)
        .then((r) => r.json())
        .then((data) => setModal((p) => p?.tipo === 'mes' ? { ...p, items: data.items ?? [], loading: false } : p))
        .catch(() => {});
      return { ...prev, loading: true };
    });
  }, [ano]);

  const abrirEdicao = useCallback(async (item: DetalheItem) => {
    const movId = item.fonte === 'rateio' ? item.movimentacaoId! : item._id;
    setLoadingEdit(true);
    try {
      const mov = await S_financeiroMovimentacoes.getById(movId);
      setEditMov(mov);
    } catch { /* silencioso */ }
    finally { setLoadingEdit(false); }
  }, []);

  const abrirModalMes = useCallback(async (linha: LinhaIdoso, mesIdx: number) => {
    const mes = String(mesIdx + 1).padStart(2, '0');
    const mesLabel = MESES[mesIdx];
    setModal({ tipo: 'mes', residenteId: linha.residenteId, nome: linha.nome, ano, mes, mesLabel, items: null, loading: true });
    try {
      const res = await fetch(
        `/api/Controller/C_financeiroRelatorios?type=matrizIdososDetalhe&residenteId=${encodeURIComponent(linha.residenteId)}&ano=${ano}&mes=${mes}`
      );
      const data = await res.json();
      setModal((prev) => prev?.tipo === 'mes' ? { ...prev, items: data.items ?? [], loading: false } : prev);
    } catch {
      setModal((prev) => prev?.tipo === 'mes' ? { ...prev, items: [], loading: false } : prev);
    }
  }, [ano]);

  return (
    <PermissionWrapper href="/portal">
      <PortalBase>
        <div className="col-span-full space-y-4">

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Matriz Financeira — Idosos</h1>
              <p className="text-sm text-gray-500 mt-0.5">Receitas e despesas por idoso / mês</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setAno((a) => a - 1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">
                <FaChevronLeft size={12} />
              </button>
              <span className="w-16 text-center font-bold text-gray-800 text-lg">{ano}</span>
              <button onClick={() => setAno((a) => a + 1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">
                <FaChevronRight size={12} />
              </button>
            </div>
          </div>

          {/* Controles */}
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="Buscar idoso..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400 w-52"
            />
            <div className="flex gap-1">
              {(['saldo', 'receita', 'despesa'] as Visao[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVisao(v)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold capitalize transition ${
                    visao === v ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {v === 'saldo' ? 'Saldo' : v === 'receita' ? 'Receitas' : 'Despesas'}
                </button>
              ))}
            </div>
            {!loading && <span className="text-xs text-gray-400">{linhas.length} idoso(s)</span>}
          </div>

          {/* Tabela */}
          {loading ? (
            <div className="flex justify-center py-20 text-gray-400 text-sm">Carregando...</div>
          ) : !linhas.length ? (
            <div className="flex justify-center py-20 text-gray-400 text-sm">Nenhum dado encontrado para {ano}.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase text-[10px]">
                    <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2.5 text-left font-semibold border-b border-r border-gray-200 min-w-[180px]">
                      Idoso
                    </th>
                    {MESES.map((m) => (
                      <th key={m} className="px-2 py-2.5 text-center font-semibold border-b border-gray-200 min-w-[80px]">
                        {m}
                      </th>
                    ))}
                    <th className="px-3 py-2.5 text-center font-semibold border-b border-l border-gray-200 min-w-[90px]">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l, idx) => (
                    <tr key={l.residenteId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className={`sticky left-0 z-10 px-3 py-2 border-r border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <button
                          onClick={() => abrirModalGeral(l)}
                          className="text-left font-medium text-indigo-700 hover:text-indigo-900 hover:underline w-full"
                        >
                          <div className="truncate max-w-[170px]">{l.nome}</div>
                        </button>
                        {!l.ativo && (
                          <span className="text-[9px] text-gray-400 uppercase tracking-wide">inativo</span>
                        )}
                      </td>
                      {l.meses.map((m, mi) => {
                        const val = getValue(m, visao);
                        return (
                          <td
                            key={m.mes}
                            className={`px-2 py-2 text-right tabular-nums border-gray-100 ${cellBg(val, visao)} ${val !== 0 ? 'cursor-pointer hover:brightness-95' : ''}`}
                            onClick={() => val !== 0 && abrirModalMes(l, mi)}
                          >
                            <span className={`font-medium ${cellClass(val, visao)}`}>
                              {val === 0 ? '—' : val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-right tabular-nums border-l border-gray-200 font-bold">
                        <span className={cellClass(getTotalValue(l, visao), visao)}>
                          {fmt(getTotalValue(l, visao))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold text-gray-700 border-t-2 border-gray-300">
                    <td className="sticky left-0 z-10 bg-gray-100 px-3 py-2.5 border-r border-gray-200 text-xs uppercase text-gray-500 tracking-wide">
                      Total
                    </td>
                    {totaisMes.map((t, i) => {
                      const val = visao === 'receita' ? t.receita : visao === 'despesa' ? t.despesa : t.saldo;
                      return (
                        <td key={i} className={`px-2 py-2.5 text-right tabular-nums ${cellBg(val, visao)}`}>
                          <span className={cellClass(val, visao)}>{fmt(val)}</span>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2.5 text-right tabular-nums border-l border-gray-200">
                      {(() => {
                        const grand = linhas.reduce((a, l) => a + getTotalValue(l, visao), 0);
                        return <span className={cellClass(grand, visao)}>{fmt(grand)}</span>;
                      })()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* ── Modal Geral (clique no nome) ─────────────────────────────── */}
        {modal?.tipo === 'geral' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <div>
                  <h2 className="text-base font-bold text-gray-800">{modal.linha.nome}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Resumo anual — {ano}</p>
                </div>
                <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700 p-1">
                  <FaTimes size={16} />
                </button>
              </div>
              <div className="overflow-y-auto p-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase border-b border-gray-200">
                      <th className="pb-2 text-left font-semibold">Mês</th>
                      <th className="pb-2 text-right font-semibold text-green-700">Receitas</th>
                      <th className="pb-2 text-right font-semibold text-red-600">Despesas</th>
                      <th className="pb-2 text-right font-semibold">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modal.linha.meses.map((m, i) => (
                      <tr
                        key={m.mes}
                        onClick={() => { setModal(null); setTimeout(() => abrirModalMes(modal.linha, i), 50); }}
                        className={`border-b border-gray-100 cursor-pointer hover:bg-indigo-50 transition-colors ${
                          m.receita === 0 && m.despesa === 0 ? 'opacity-40' : ''
                        }`}
                      >
                        <td className="py-2 text-gray-700 font-medium">{MESES[i]}</td>
                        <td className="py-2 text-right tabular-nums text-green-700">{m.receita > 0 ? fmtFull(m.receita) : '—'}</td>
                        <td className="py-2 text-right tabular-nums text-red-600">{m.despesa > 0 ? fmtFull(m.despesa) : '—'}</td>
                        <td className={`py-2 text-right tabular-nums font-semibold ${m.saldo > 0 ? 'text-green-700' : m.saldo < 0 ? 'text-red-600' : 'text-gray-300'}`}>
                          {m.saldo !== 0 ? fmtFull(m.saldo) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 font-bold">
                      <td className="pt-3 text-gray-700 uppercase text-xs tracking-wide">Total</td>
                      <td className="pt-3 text-right tabular-nums text-green-700">{fmtFull(modal.linha.totalReceita)}</td>
                      <td className="pt-3 text-right tabular-nums text-red-600">{fmtFull(modal.linha.totalDespesa)}</td>
                      <td className={`pt-3 text-right tabular-nums text-lg font-bold ${modal.linha.totalSaldo >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {fmtFull(modal.linha.totalSaldo)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
                <p className="text-xs text-gray-400 mt-3 text-center">Clique em um mês para ver o detalhamento.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Detalhe do Mês (clique na célula) ──────────────────── */}
        {modal?.tipo === 'mes' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <div>
                  <h2 className="text-base font-bold text-gray-800">{modal.nome}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{modal.mesLabel}/{ano} — movimentações vinculadas</p>
                </div>
                <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700 p-1">
                  <FaTimes size={16} />
                </button>
              </div>
              <div className="overflow-y-auto p-5">
                {modal.loading ? (
                  <div className="text-center py-10 text-gray-400 text-sm">Carregando...</div>
                ) : !modal.items?.length ? (
                  <div className="text-center py-10 text-gray-400 text-sm">Nenhuma movimentação encontrada.</div>
                ) : (
                  <>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-500 uppercase border-b border-gray-200">
                          <th className="pb-2 text-left font-semibold">Data</th>
                          <th className="pb-2 text-left font-semibold">Histórico</th>
                          <th className="pb-2 text-center font-semibold">Fonte</th>
                          <th className="pb-2 text-right font-semibold">Valor</th>
                          <th className="pb-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {modal.items.map((item) => (
                          <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 text-gray-500 whitespace-nowrap">{fmtData(item.dataMovimento)}</td>
                            <td className="py-2 text-gray-800 max-w-[200px] truncate">{item.historico || '—'}</td>
                            <td className="py-2 text-center">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                item.fonte === 'rateio' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {item.fonte === 'rateio' ? 'rateio' : 'direta'}
                              </span>
                            </td>
                            <td className={`py-2 text-right tabular-nums font-semibold ${
                              item.tipoMovimento === 'entrada' ? 'text-green-700' : 'text-red-600'
                            }`}>
                              {item.tipoMovimento === 'saida' ? '-' : ''}{fmtFull(item.valor)}
                            </td>
                            <td className="py-2 pl-2">
                              <button
                                onClick={() => abrirEdicao(item)}
                                disabled={loadingEdit}
                                className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium whitespace-nowrap disabled:opacity-50"
                              >
                                Editar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        {(() => {
                          const totalEntradas = modal.items.filter(i => i.tipoMovimento === 'entrada').reduce((a, i) => a + i.valor, 0);
                          const totalSaidas   = modal.items.filter(i => i.tipoMovimento === 'saida').reduce((a, i) => a + i.valor, 0);
                          const saldo = totalEntradas - totalSaidas;
                          return (
                            <>
                              {totalEntradas > 0 && totalSaidas > 0 && (
                                <>
                                  <tr className="border-t border-gray-200 text-xs text-gray-500">
                                    <td colSpan={3} className="pt-2 text-right">Receitas</td>
                                    <td className="pt-2 text-right text-green-700 font-semibold">{fmtFull(totalEntradas)}</td>
                                  </tr>
                                  <tr className="text-xs text-gray-500">
                                    <td colSpan={3} className="text-right">Despesas</td>
                                    <td className="text-right text-red-600 font-semibold">{fmtFull(totalSaidas)}</td>
                                  </tr>
                                </>
                              )}
                              <tr className="border-t-2 border-gray-300 font-bold">
                                <td colSpan={3} className="pt-2 text-right text-gray-700 uppercase text-xs tracking-wide">Saldo</td>
                                <td className={`pt-2 text-right tabular-nums text-base ${saldo >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                  {fmtFull(saldo)}
                                </td>
                              </tr>
                            </>
                          );
                        })()}
                      </tfoot>
                    </table>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {editMov && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <h2 className="text-base font-bold text-gray-800">Editar Movimentação</h2>
                <button onClick={() => setEditMov(null)} className="text-gray-400 hover:text-gray-700 p-1">
                  <FaTimes size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <MovimentacaoForm
                  initialData={editMov}
                  onSuccess={() => { setEditMov(null); carregar(ano); recarregarDetalhe(); }}
                />
              </div>
            </div>
          </div>
        )}

      </PortalBase>
    </PermissionWrapper>
  );
};

export default MatrizIdosos;
