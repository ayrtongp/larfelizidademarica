import React, { useEffect, useState, useMemo, useCallback } from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';
import PortalBase from '@/components/Portal/PortalBase';
import { FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';
import MovimentacaoForm from '@/components/financeiro/movimentacoes/MovimentacaoForm';
import S_financeiroMovimentacoes from '@/services/S_financeiroMovimentacoes';
import { T_Movimentacao } from '@/types/T_financeiroMovimentacoes';

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

type MesCat = { mes: string; receita: number; despesa: number; saldo: number };
type LinhaCat = {
  categoriaId: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  categoriaPaiId: string | null;
  categoriaPaiNome: string | null;
  meses: MesCat[];
  totalReceita: number;
  totalDespesa: number;
  totalSaldo: number;
};

type Modo = 'receita' | 'despesa' | 'todos';

type DetalheItem = {
  _id: string;
  historico: string;
  tipoMovimento: string;
  valor: number;
  dataMovimento: string;
  fonte: 'direta' | 'rateio';
  movimentacaoId?: string;
};

type ModalState = {
  categoriaId: string;
  nome: string;
  mes: string;
  mesLabel: string;
  items: DetalheItem[] | null;
  loading: boolean;
} | null;

const fmt = (v: number) =>
  v === 0 ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });

const fmtFull = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function fmtData(iso: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

// Returns the value to display for a row given the current modo
function rowVal(l: LinhaCat, mes: string, modo: Modo): number {
  const m = l.meses.find((x) => x.mes === mes);
  if (!m) return 0;
  if (modo === 'receita') return m.receita;
  if (modo === 'despesa') return m.despesa;
  // todos: show natural value per row tipo
  return l.tipo === 'receita' ? m.receita : m.despesa;
}

function rowTotal(l: LinhaCat, modo: Modo): number {
  if (modo === 'receita') return l.totalReceita;
  if (modo === 'despesa') return l.totalDespesa;
  return l.tipo === 'receita' ? l.totalReceita : l.totalDespesa;
}

function valClass(v: number, tipo: 'receita' | 'despesa') {
  if (v === 0) return 'text-gray-300';
  return tipo === 'receita' ? 'text-green-700' : 'text-red-600';
}

function valBg(v: number, tipo: 'receita' | 'despesa') {
  if (v === 0) return '';
  return tipo === 'receita' ? 'bg-green-50' : 'bg-red-50';
}

const MatrizCategorias = () => {
  const [ano, setAno]     = useState(new Date().getFullYear());
  const [dados, setDados] = useState<LinhaCat[]>([]);
  const [loading, setLoading] = useState(false);
  const [modo, setModo]   = useState<Modo>('despesa');
  const [agrupar, setAgrupar] = useState(true);
  const [busca, setBusca]  = useState('');
  const [modal, setModal]  = useState<ModalState>(null);
  const [editMov, setEditMov] = useState<T_Movimentacao | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const carregar = async (a: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/Controller/C_financeiroRelatorios?type=matrizCategorias&ano=${a}`);
      const data = await res.json();
      setDados(Array.isArray(data) ? data : []);
    } catch { setDados([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { carregar(ano); }, [ano]);

  const linhas = useMemo(() => {
    let list = dados;
    if (modo !== 'todos') list = list.filter((l) => l.tipo === modo);
    if (busca) list = list.filter((l) =>
      l.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (l.categoriaPaiNome ?? '').toLowerCase().includes(busca.toLowerCase())
    );
    return list;
  }, [dados, modo, busca]);

  const grupos = useMemo(() => {
    if (!agrupar) return null;
    const map: Record<string, { pai: string | null; nomePai: string; linhas: LinhaCat[] }> = {};
    for (const l of linhas) {
      const key = l.categoriaPaiId ?? '__raiz__';
      if (!map[key]) map[key] = { pai: l.categoriaPaiId, nomePai: l.categoriaPaiNome ?? l.nome, linhas: [] };
      map[key].linhas.push(l);
    }
    return Object.values(map).sort((a, b) => a.nomePai.localeCompare(b.nomePai, 'pt-BR'));
  }, [linhas, agrupar]);

  // Footer totals: sum per mes for the visible rows
  // In "todos" mode, despesa rows are subtracted so the total shows receita - despesa
  const totaisMes = useMemo(() =>
    MESES.map((_, i) => {
      const mes = String(i + 1).padStart(2, '0');
      return linhas.reduce((acc, l) => {
        const v = rowVal(l, mes, modo);
        return acc + (modo === 'todos' && l.tipo === 'despesa' ? -v : v);
      }, 0);
    }),
    [linhas, modo]
  );

  const recarregarDetalhe = useCallback(async () => {
    setModal((prev) => {
      if (!prev) return prev;
      const { categoriaId, mes } = prev;
      fetch(`/api/Controller/C_financeiroRelatorios?type=matrizCategoriasDetalhe&categoriaId=${encodeURIComponent(categoriaId)}&ano=${ano}&mes=${mes}`)
        .then((r) => r.json())
        .then((data) => setModal((p) => p ? { ...p, items: data.items ?? [], loading: false } : null))
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

  const abrirModal = useCallback(async (l: LinhaCat, mesIdx: number) => {
    const mes = String(mesIdx + 1).padStart(2, '0');
    const mesLabel = MESES[mesIdx];
    setModal({ categoriaId: l.categoriaId, nome: l.nome, mes, mesLabel, items: null, loading: true });
    try {
      const res = await fetch(
        `/api/Controller/C_financeiroRelatorios?type=matrizCategoriasDetalhe&categoriaId=${encodeURIComponent(l.categoriaId)}&ano=${ano}&mes=${mes}`
      );
      const data = await res.json();
      setModal((prev) => prev ? { ...prev, items: data.items ?? [], loading: false } : null);
    } catch {
      setModal((prev) => prev ? { ...prev, items: [], loading: false } : null);
    }
  }, [ano]);

  const grandTotal = linhas.reduce((a, l) => {
    const v = rowTotal(l, modo);
    return a + (modo === 'todos' && l.tipo === 'despesa' ? -v : v);
  }, 0);

  const renderLinhas = (rows: LinhaCat[], indent = false) =>
    rows.map((l, idx) => (
      <tr key={l.categoriaId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
        <td className={`sticky left-0 z-10 px-3 py-2 border-r border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
          <div className={`truncate max-w-[180px] font-medium text-gray-800 text-xs ${indent ? 'pl-3' : ''}`}>{l.nome}</div>
          <span className={`text-[9px] uppercase tracking-wide font-medium ${l.tipo === 'receita' ? 'text-green-600' : 'text-red-500'}`}>
            {l.tipo}
          </span>
        </td>
        {MESES.map((_, i) => {
          const mes = String(i + 1).padStart(2, '0');
          const v = rowVal(l, mes, modo);
          return (
            <td
              key={mes}
              className={`px-2 py-2 text-right tabular-nums border-gray-100 text-xs ${valBg(v, l.tipo)} ${v !== 0 ? 'cursor-pointer hover:brightness-95' : ''}`}
              onClick={() => v !== 0 && abrirModal(l, i)}
            >
              <span className={`font-medium ${valClass(v, l.tipo)}`}>
                {v === 0 ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
              </span>
            </td>
          );
        })}
        <td className="px-3 py-2 text-right tabular-nums border-l border-gray-200 text-xs font-bold">
          <span className={valClass(rowTotal(l, modo), l.tipo)}>{fmt(rowTotal(l, modo))}</span>
        </td>
      </tr>
    ));

  // Footer color: green for receita mode, red for despesa, gray for todos
  const footerValClass = (v: number) => {
    if (v === 0) return 'text-gray-300';
    if (modo === 'receita') return 'text-green-700';
    if (modo === 'despesa') return 'text-red-600';
    return 'text-gray-700';
  };

  return (
    <PermissionWrapper href="/portal">
      <PortalBase>
        <div className="col-span-full space-y-4">

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Matriz Financeira — Categorias</h1>
              <p className="text-sm text-gray-500 mt-0.5">Movimentações por categoria / mês de competência</p>
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
              placeholder="Buscar categoria..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400 w-52"
            />

            <div className="flex gap-1">
              {([
                ['receita', 'Receitas'],
                ['despesa', 'Despesas'],
                ['todos',   'Todos'],
              ] as [Modo, string][]).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setModo(v)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                    modo === v ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agrupar}
                onChange={(e) => setAgrupar(e.target.checked)}
                className="rounded"
              />
              Agrupar por categoria pai
            </label>

            {!loading && <span className="text-xs text-gray-400">{linhas.length} categoria(s)</span>}
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
                    <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2.5 text-left font-semibold border-b border-r border-gray-200 min-w-[200px]">
                      Categoria
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
                  {agrupar && grupos
                    ? grupos.map((g) => {
                        const subtotaisMes = MESES.map((_, i) => {
                          const mes = String(i + 1).padStart(2, '0');
                          return g.linhas.reduce((acc, l) => {
                            const v = rowVal(l, mes, modo);
                            return acc + (modo === 'todos' && l.tipo === 'despesa' ? -v : v);
                          }, 0);
                        });
                        const subtotalGeral = g.linhas.reduce((a, l) => {
                          const v = rowTotal(l, modo);
                          return a + (modo === 'todos' && l.tipo === 'despesa' ? -v : v);
                        }, 0);
                        const tipo = g.linhas[0]?.tipo ?? 'despesa';
                        return (
                          <React.Fragment key={g.pai ?? '__raiz__'}>
                            {g.pai !== null && (
                              <tr className="bg-indigo-50 border-t border-indigo-100">
                                <td className="sticky left-0 z-10 bg-indigo-50 px-3 py-1.5 border-r border-indigo-100">
                                  <div className="truncate max-w-[180px] font-bold text-indigo-800 text-xs">{g.nomePai}</div>
                                  <span className={`text-[9px] uppercase tracking-wide font-medium ${tipo === 'receita' ? 'text-green-600' : 'text-red-500'}`}>
                                    {tipo}
                                  </span>
                                </td>
                                {subtotaisMes.map((v, i) => (
                                  <td key={i} className="px-2 py-1.5 text-right tabular-nums text-xs font-bold">
                                    <span className={v === 0 ? 'text-indigo-200' : 'text-indigo-700'}>
                                      {v === 0 ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
                                    </span>
                                  </td>
                                ))}
                                <td className="px-3 py-1.5 text-right tabular-nums border-l border-indigo-100 text-xs font-bold">
                                  <span className={subtotalGeral === 0 ? 'text-indigo-200' : 'text-indigo-700'}>
                                    {subtotalGeral === 0 ? '—' : subtotalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
                                  </span>
                                </td>
                              </tr>
                            )}
                            {renderLinhas(g.linhas, g.pai !== null)}
                          </React.Fragment>
                        );
                      })
                    : renderLinhas(linhas)
                  }
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold text-gray-700 border-t-2 border-gray-300">
                    <td className="sticky left-0 z-10 bg-gray-100 px-3 py-2.5 border-r border-gray-200 text-xs uppercase text-gray-500 tracking-wide">
                      Total
                    </td>
                    {totaisMes.map((v, i) => (
                      <td key={i} className={`px-2 py-2.5 text-right tabular-nums text-xs ${v !== 0 && modo === 'receita' ? 'bg-green-50' : v !== 0 && modo === 'despesa' ? 'bg-red-50' : ''}`}>
                        <span className={footerValClass(v)}>{fmt(v)}</span>
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-right tabular-nums border-l border-gray-200 text-xs">
                      <span className={footerValClass(grandTotal)}>{fmt(grandTotal)}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <div>
                  <h2 className="text-base font-bold text-gray-800">{modal.nome}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{modal.mesLabel}/{ano} — movimentações</p>
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
                          <td className="py-2 text-gray-800 max-w-[240px] truncate">{item.historico || '—'}</td>
                          <td className="py-2 text-center">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              item.fonte === 'rateio' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {item.fonte}
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

export default MatrizCategorias;
