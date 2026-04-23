import React, { useCallback, useEffect, useState } from 'react';
import { notifyError, notifySuccess } from '@/utils/Functions';

// ── Types ──────────────────────────────────────────────────────────────────

interface EstoqueItem {
  _id: string;
  nome_insumo: string;
  unidade: string;
  cod_categoria: string;
  soma: number;
}

interface HistoricoItem {
  _id?: string;
  nome_insumo: string;
  unidade?: string;
  quantidade: number;
  nomeUsuario: string;
  observacoes: string;
  createdAt: string;
}

interface InsumoOption {
  _id: string;
  nome_insumo: string;
  unidade: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDateTime(str: string) {
  if (!str) return '—';
  const d = new Date(str.includes('T') ? str : str.replace(' ', 'T'));
  if (isNaN(d.getTime())) return str;
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function stockColor(soma: number) {
  if (soma <= 0) return 'text-red-600 font-bold';
  if (soma < 10) return 'text-orange-500 font-semibold';
  return 'text-gray-800 font-medium';
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

function getUserInfo() {
  try { const u = JSON.parse(localStorage.userInfo); return { nome: u.nome ?? '', id: u.id ?? '' }; }
  catch { return { nome: '', id: '' }; }
}

// ── Component ──────────────────────────────────────────────────────────────

const Suprimentos = ({ ResidenteId }: { ResidenteId: string }) => {
  const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
  const [loadingEstoque, setLoadingEstoque] = useState(true);

  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [countHistorico, setCountHistorico] = useState(0);
  const [pageHistorico, setPageHistorico] = useState(1);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  const [insumos, setInsumos] = useState<InsumoOption[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'entrada' | 'saida'>('entrada');
  const [selectedId, setSelectedId] = useState('');
  const [selectedNome, setSelectedNome] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Data loaders ──────────────────────────────────────────────────────────

  const loadEstoque = useCallback(async () => {
    setLoadingEstoque(true);
    try {
      const res = await fetch(`/api/Controller/InsumoEstoque?type=getListaInsumosResidente&idResidente=${ResidenteId}`);
      const data = res.ok ? await res.json() : [];
      setEstoque(Array.isArray(data) ? data.filter((i: any) => i.soma !== 0) : []);
    } catch {
      notifyError('Erro ao carregar estoque.');
    } finally {
      setLoadingEstoque(false);
    }
  }, [ResidenteId]);

  const loadHistorico = useCallback(async (page: number, append: boolean) => {
    setLoadingHistorico(true);
    try {
      const res = await fetch(`/api/Controller/InsumoEstoque?type=getHistoricoPaginado&residenteId=${ResidenteId}&page=${page}`);
      if (res.ok) {
        const { data, count } = await res.json();
        setHistorico((prev) => append ? [...prev, ...(data ?? [])] : (data ?? []));
        setCountHistorico(count ?? 0);
      }
    } finally {
      setLoadingHistorico(false);
    }
  }, [ResidenteId]);

  useEffect(() => {
    fetch('/api/Controller/Insumos?type=getAll')
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setInsumos(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => { loadEstoque(); }, [loadEstoque]);
  useEffect(() => { loadHistorico(1, false); }, [loadHistorico]);

  // ── Modal helpers ─────────────────────────────────────────────────────────

  function openModal(m: 'entrada' | 'saida', id = '', nome = '') {
    setMode(m);
    setSelectedId(id);
    setSelectedNome(nome);
    setQuantidade(1);
    setObservacoes('');
    setModalOpen(true);
  }

  function closeModal() { setModalOpen(false); }

  async function handleSubmit() {
    if (!selectedId) { notifyError('Selecione um insumo.'); return; }
    if (quantidade < 1) { notifyError('Quantidade deve ser pelo menos 1.'); return; }

    if (mode === 'saida') {
      const item = estoque.find((e) => e._id === selectedId);
      if (item && item.soma < quantidade) {
        notifyError(`Estoque insuficiente. Disponível: ${item.soma} ${item.unidade}.`);
        return;
      }
    }

    const { nome: nomeUsuario, id: idUsuario } = getUserInfo();
    const qtd = mode === 'saida' ? -Math.abs(quantidade) : Math.abs(quantidade);

    setSaving(true);
    try {
      const res = await fetch('/api/Controller/InsumoEstoque?type=addFraldaResidente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insumo_id: selectedId,
          quantidade: qtd,
          residente_id: ResidenteId,
          observacoes: observacoes.trim() || '—',
          nomeUsuario,
          idUsuario,
        }),
      });
      if (res.ok) {
        notifySuccess(mode === 'entrada' ? 'Entrada registrada!' : 'Saída registrada!');
        closeModal();
        setPageHistorico(1);
        loadEstoque();
        loadHistorico(1, false);
      } else {
        notifyError('Erro ao registrar movimentação.');
      }
    } catch {
      notifyError('Erro na requisição.');
    } finally {
      setSaving(false);
    }
  }

  const isEntrada = mode === 'entrada';

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">
            {loadingEstoque ? 'Carregando...' : `${estoque.length} item(ns) em estoque`}
          </p>
        </div>
        <button
          onClick={() => openModal('entrada')}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nova Entrada
        </button>
      </div>

      {/* ── Tabela de estoque ──────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loadingEstoque ? (
          <div className="py-10 text-center text-sm text-gray-400">Carregando estoque...</div>
        ) : estoque.length === 0 ? (
          <div className="py-10 text-center space-y-1">
            <p className="text-sm text-gray-400">Nenhum item em estoque.</p>
            <button
              onClick={() => openModal('entrada')}
              className="text-xs text-emerald-600 hover:underline font-medium"
            >
              Registrar primeira entrada →
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-2.5 text-left">Categoria</th>
                <th className="px-4 py-2.5 text-left">Insumo</th>
                <th className="px-4 py-2.5 text-center">Unidade</th>
                <th className="px-4 py-2.5 text-right">Qtd</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {estoque.map((item, i) => (
                <tr key={item._id ?? i} className="odd:bg-white even:bg-gray-50 hover:bg-yellow-50 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${catColor(item.cod_categoria)}`}>
                      {item.cod_categoria}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-gray-800">{item.nome_insumo}</td>
                  <td className="px-4 py-2.5 text-center text-xs text-gray-500">{item.unidade}</td>
                  <td className={`px-4 py-2.5 text-right tabular-nums text-sm ${stockColor(item.soma)}`}>
                    {item.soma}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openModal('entrada', item._id, item.nome_insumo)}
                        title="Entrada"
                        className="w-6 h-6 flex items-center justify-center rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openModal('saida', item._id, item.nome_insumo)}
                        title="Saída"
                        className="w-6 h-6 flex items-center justify-center rounded bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Histórico ──────────────────────────────────────────────────── */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Histórico de Movimentações</p>
        <HistoricoSuprimentos
          historico={historico}
          count={countHistorico}
          loading={loadingHistorico}
          onLoadMore={() => {
            const next = pageHistorico + 1;
            setPageHistorico(next);
            loadHistorico(next, true);
          }}
        />
      </div>

      {/* ── Modal ──────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="text-base font-semibold text-gray-800">Movimentar Estoque</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">&times;</button>
            </div>

            <div className="px-5 py-4 space-y-4">

              {/* Tabs entrada / saída */}
              <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setMode('entrada')}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${isEntrada ? 'bg-emerald-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  ↑ Entrada
                </button>
                <button
                  onClick={() => setMode('saida')}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${!isEntrada ? 'bg-red-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  ↓ Saída
                </button>
              </div>

              {/* Insumo */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Insumo</label>
                {selectedNome ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="text-sm font-medium text-gray-800 flex-1">{selectedNome}</span>
                    <button
                      onClick={() => { setSelectedId(''); setSelectedNome(''); }}
                      className="text-xs text-gray-400 hover:text-gray-600 shrink-0"
                    >
                      trocar
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedId}
                    onChange={(e) => {
                      const opt = insumos.find((i) => i._id === e.target.value);
                      setSelectedId(e.target.value);
                      setSelectedNome(opt ? `${opt.nome_insumo} (${opt.unidade})` : '');
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  >
                    <option value="">— Selecione —</option>
                    {insumos.map((i) => (
                      <option key={i._id} value={i._id}>{i.nome_insumo} ({i.unidade})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Quantidade */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Quantidade</label>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  <button
                    onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xl font-bold transition-colors select-none"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={quantidade}
                    onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 text-center text-xl font-bold text-gray-800 py-2 bg-transparent focus:outline-none"
                  />
                  <button
                    onClick={() => setQuantidade((q) => q + 1)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xl font-bold transition-colors select-none"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={2}
                  placeholder="Opcional..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !selectedId}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 ${isEntrada ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600'}`}
              >
                {saving ? 'Salvando...' : isEntrada ? 'Confirmar Entrada' : 'Confirmar Saída'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Histórico ─────────────────────────────────────────────────────────────

interface HistoricoProps {
  historico: HistoricoItem[];
  count: number;
  loading: boolean;
  onLoadMore: () => void;
}

function HistoricoSuprimentos({ historico, count, loading, onLoadMore }: HistoricoProps) {
  if (!historico.length && !loading) {
    return <p className="text-sm text-gray-400 py-4 text-center">Nenhuma movimentação registrada.</p>;
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {historico.map((h, i) => {
          const isEnt = h.quantidade > 0;
          return (
            <li
              key={h._id ?? i}
              className={`flex gap-3 p-3 rounded-lg bg-white border border-gray-100 border-l-4 ${isEnt ? 'border-l-emerald-400' : 'border-l-red-400'}`}
            >
              <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isEnt ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                {isEnt ? '↑' : '↓'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-gray-800 truncate">{h.nome_insumo}</span>
                  <span className={`shrink-0 text-sm font-bold tabular-nums ${isEnt ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isEnt ? '+' : ''}{h.quantidade}{h.unidade ? ` ${h.unidade}` : ''}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {fmtDateTime(h.createdAt)}{h.nomeUsuario ? ` · ${h.nomeUsuario}` : ''}
                </p>
                {h.observacoes && h.observacoes !== '—' && (
                  <p className="text-xs text-gray-500 mt-0.5 italic">{h.observacoes}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {historico.length < count && (
        <div className="pt-2 text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-40 transition-colors"
          >
            {loading ? 'Carregando...' : `Carregar mais · ${count - historico.length} restantes`}
          </button>
        </div>
      )}

      {historico.length > 0 && (
        <p className="text-[11px] text-gray-300 text-center pt-1">
          {historico.length} de {count} registros
        </p>
      )}
    </div>
  );
}

export default Suprimentos;
