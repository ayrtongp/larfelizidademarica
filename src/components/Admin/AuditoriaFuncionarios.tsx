import React, { useCallback, useEffect, useState } from 'react';
import { FaChevronDown, FaChevronUp, FaSearch } from 'react-icons/fa';

interface AuditoriaRecord {
  _id: string;
  entidade: string;
  entidadeId: string;
  nomeEntidade?: string;
  acao: string;
  campo?: string;
  antes?: unknown;
  depois?: unknown;
  realizadoPor?: string;
  realizadoPorNome?: string;
  realizadoEm: string;
}

const ACOES: Record<string, { label: string; cls: string }> = {
  criar:                   { label: 'Criado',             cls: 'bg-green-100 text-green-700' },
  editar_contrato:         { label: 'Contrato',           cls: 'bg-blue-100 text-blue-700' },
  editar_dados_pessoais:   { label: 'Dados Pessoais',     cls: 'bg-blue-100 text-blue-700' },
  editar_beneficios:       { label: 'Benefícios',         cls: 'bg-blue-100 text-blue-700' },
  editar_dados_bancarios:  { label: 'Dados Bancários',    cls: 'bg-blue-100 text-blue-700' },
  editar_contato_emergencia:{ label: 'Emergência',        cls: 'bg-blue-100 text-blue-700' },
  adicionar_aso:           { label: 'ASO Adicionado',     cls: 'bg-teal-100 text-teal-700' },
  editar_aso:              { label: 'ASO Editado',        cls: 'bg-sky-100 text-sky-700' },
  excluir_aso:             { label: 'ASO Excluído',       cls: 'bg-orange-100 text-orange-700' },
  demitir:                 { label: 'Demitido',           cls: 'bg-red-100 text-red-700' },
  reativar:                { label: 'Reativado',          cls: 'bg-green-100 text-green-700' },
  editar_observacoes:      { label: 'Observações',        cls: 'bg-gray-100 text-gray-600' },
  atualizar_status:        { label: 'Status',             cls: 'bg-yellow-100 text-yellow-700' },
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function JsonBlock({ value }: { value: unknown }) {
  if (value === undefined || value === null) return <span className="text-gray-400 text-xs italic">—</span>;
  if (typeof value === 'string') return <span className="text-xs text-gray-700">{value}</span>;
  return (
    <pre className="text-xs text-gray-700 bg-gray-50 rounded p-2 overflow-x-auto whitespace-pre-wrap break-words max-h-48">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

const AuditoriaFuncionarios = () => {
  const [records, setRecords]   = useState<AuditoriaRecord[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [loading, setLoading]   = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [busca,      setBusca]      = useState('');
  const [acaoFiltro, setAcaoFiltro] = useState('');
  const [from,       setFrom]       = useState('');
  const [to,         setTo]         = useState('');

  const fetchRecords = useCallback(async (p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ entidade: 'funcionario', page: p.toString(), limit: '20' });
    if (busca)      params.set('busca', busca);
    if (acaoFiltro) params.set('acao', acaoFiltro);
    if (from)       params.set('from', from);
    if (to)         params.set('to', to);

    try {
      const res = await fetch(`/api/Controller/auditoria.controller?${params}`);
      if (res.ok) {
        const json = await res.json();
        setRecords(json.data);
        setTotal(json.total);
        setPage(json.page);
        setPages(json.pages);
      }
    } finally {
      setLoading(false);
    }
  }, [busca, acaoFiltro, from, to]);

  useEffect(() => { fetchRecords(1); }, []);

  function handleSearch() { fetchRecords(1); }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch();
  }

  function toggleExpand(id: string) {
    setExpanded(prev => prev === id ? null : id);
  }

  const hasDetails = (r: AuditoriaRecord) => r.antes !== undefined || r.depois !== undefined;

  return (
    <div className="space-y-4">

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs text-gray-500 mb-1">Funcionário</label>
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Ação</label>
          <select
            value={acaoFiltro}
            onChange={e => setAcaoFiltro(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400"
          >
            <option value="">Todas</option>
            {Object.entries(ACOES).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">De</label>
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Até</label>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400"
          />
        </div>

        <button
          onClick={handleSearch}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition-colors"
        >
          <FaSearch size={12} /> Buscar
        </button>
      </div>

      {/* Contador */}
      <p className="text-xs text-gray-400">{total} registro(s)</p>

      {/* Lista */}
      {loading ? (
        <p className="text-center py-10 text-sm text-gray-400">Carregando...</p>
      ) : records.length === 0 ? (
        <p className="text-center py-10 text-sm text-gray-400">Nenhum registro encontrado.</p>
      ) : (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm text-left hidden sm:table">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-3 py-3">Data/Hora</th>
                <th className="px-3 py-3">Funcionário</th>
                <th className="px-3 py-3">Ação</th>
                <th className="px-3 py-3">Realizado por</th>
                <th className="px-3 py-3 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map(r => {
                const acao = ACOES[r.acao] ?? { label: r.acao, cls: 'bg-gray-100 text-gray-600' };
                const isOpen = expanded === r._id;
                return (
                  <React.Fragment key={r._id}>
                    <tr className={`transition-colors ${isOpen ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-500 text-xs">
                        {formatDate(r.realizadoEm)}
                      </td>
                      <td className="px-3 py-2.5 text-gray-800 font-medium">
                        {r.nomeEntidade || <span className="text-gray-400 italic text-xs">—</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${acao.cls}`}>
                          {acao.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 text-xs">
                        {r.realizadoPorNome || r.realizadoPor || <span className="italic">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {hasDetails(r) && (
                          <button
                            onClick={() => toggleExpand(r._id)}
                            className="text-gray-400 hover:text-indigo-500 transition-colors"
                            title={isOpen ? 'Recolher detalhes' : 'Ver detalhes'}
                          >
                            {isOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                          </button>
                        )}
                      </td>
                    </tr>
                    {isOpen && hasDetails(r) && (
                      <tr className="bg-indigo-50">
                        <td colSpan={5} className="px-4 pb-3 pt-0">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                            {r.antes !== undefined && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 mb-1">Antes</p>
                                <JsonBlock value={r.antes} />
                              </div>
                            )}
                            {r.depois !== undefined && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 mb-1">Depois</p>
                                <JsonBlock value={r.depois} />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {/* Mobile: cards */}
          <div className="sm:hidden flex flex-col divide-y divide-gray-100">
            {records.map(r => {
              const acao = ACOES[r.acao] ?? { label: r.acao, cls: 'bg-gray-100 text-gray-600' };
              const isOpen = expanded === r._id;
              return (
                <div key={r._id} className="p-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${acao.cls}`}>
                      {acao.label}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(r.realizadoEm)}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{r.nomeEntidade || '—'}</p>
                  <p className="text-xs text-gray-500">Por: {r.realizadoPorNome || r.realizadoPor || '—'}</p>
                  {hasDetails(r) && (
                    <button
                      onClick={() => toggleExpand(r._id)}
                      className="text-xs text-indigo-500 flex items-center gap-1 mt-1"
                    >
                      {isOpen ? <><FaChevronUp size={10} /> Recolher</> : <><FaChevronDown size={10} /> Ver detalhes</>}
                    </button>
                  )}
                  {isOpen && hasDetails(r) && (
                    <div className="mt-2 space-y-2">
                      {r.antes !== undefined && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Antes</p>
                          <JsonBlock value={r.antes} />
                        </div>
                      )}
                      {r.depois !== undefined && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Depois</p>
                          <JsonBlock value={r.depois} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Paginação */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => fetchRecords(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            ← Anterior
          </button>
          <span className="text-sm text-gray-500">
            {page} / {pages}
          </span>
          <button
            onClick={() => fetchRecords(page + 1)}
            disabled={page >= pages}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
};

export default AuditoriaFuncionarios;
