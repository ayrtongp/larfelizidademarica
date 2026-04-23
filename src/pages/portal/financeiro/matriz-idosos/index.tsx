import React, { useEffect, useState, useMemo } from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';
import PortalBase from '@/components/Portal/PortalBase';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

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

type Visao = 'saldo' | 'receita' | 'despesa';

const fmt = (v: number) =>
  v === 0 ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });

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

const MatrizIdosos = () => {
  const [ano, setAno]       = useState(new Date().getFullYear());
  const [dados, setDados]   = useState<LinhaIdoso[]>([]);
  const [loading, setLoading] = useState(false);
  const [visao, setVisao]   = useState<Visao>('saldo');
  const [busca, setBusca]   = useState('');

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

  // Totais por mês (rodapé)
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

            {/* Navegação de ano */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAno((a) => a - 1)}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
              >
                <FaChevronLeft size={12} />
              </button>
              <span className="w-16 text-center font-bold text-gray-800 text-lg">{ano}</span>
              <button
                onClick={() => setAno((a) => a + 1)}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
              >
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
            {!loading && (
              <span className="text-xs text-gray-400">{linhas.length} idoso(s)</span>
            )}
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
                      <td className={`sticky left-0 z-10 px-3 py-2 border-r border-gray-100 font-medium text-gray-800 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <div className="truncate max-w-[170px]">{l.nome}</div>
                        {!l.ativo && (
                          <span className="text-[9px] text-gray-400 uppercase tracking-wide">inativo</span>
                        )}
                      </td>
                      {l.meses.map((m) => {
                        const val = getValue(m, visao);
                        return (
                          <td
                            key={m.mes}
                            className={`px-2 py-2 text-right tabular-nums border-gray-100 ${cellBg(val, visao)}`}
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
                {/* Rodapé com totais */}
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
      </PortalBase>
    </PermissionWrapper>
  );
};

export default MatrizIdosos;
