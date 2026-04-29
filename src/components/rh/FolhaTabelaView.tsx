import React, { useMemo, useState } from 'react';
import { T_FolhaPagamentoItem, T_Lancamento } from '@/types/T_folhaPagamento';

const PROVENTOS_SUGERIDOS = ['Salário Base', 'Horas Extras 50%', 'Horas Extras 100%', 'Adicional Noturno', 'DSR', 'Gratificação', 'Comissão'];
const DESCONTOS_SUGERIDOS = ['INSS', 'IRRF', 'Vale Transporte', 'Vale Alimentação', 'Adiantamento', 'Falta', 'Atraso'];

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface Coluna {
  tipo: 'provento' | 'desconto';
  descricao: string;
}

function coletarColunas(itens: T_FolhaPagamentoItem[]): Coluna[] {
  const set = new Map<string, Coluna>();
  for (const item of itens) {
    for (const l of item.proventos) {
      const k = `p:${l.descricao}`;
      if (!set.has(k)) set.set(k, { tipo: 'provento', descricao: l.descricao });
    }
    for (const l of item.descontos) {
      const k = `d:${l.descricao}`;
      if (!set.has(k)) set.set(k, { tipo: 'desconto', descricao: l.descricao });
    }
  }
  const colunas = Array.from(set.values());
  const proventos = colunas.filter(c => c.tipo === 'provento');
  const descontos = colunas.filter(c => c.tipo === 'desconto');
  return [...proventos, ...descontos];
}

function getValor(item: T_FolhaPagamentoItem, col: Coluna): number {
  const lista = col.tipo === 'provento' ? item.proventos : item.descontos;
  return lista.find(l => l.descricao === col.descricao)?.valor ?? 0;
}

function recalcular(item: T_FolhaPagamentoItem): T_FolhaPagamentoItem {
  const totalProventos = item.proventos.reduce((s, l) => s + Number(l.valor || 0), 0);
  const totalDescontos = item.descontos.reduce((s, l) => s + Number(l.valor || 0), 0);
  return { ...item, totalProventos, totalDescontos, salarioLiquido: totalProventos - totalDescontos };
}

interface Props {
  itens: T_FolhaPagamentoItem[];
  editando: boolean;
  onChange?: (itens: T_FolhaPagamentoItem[]) => void;
}

export default function FolhaTabelaView({ itens, editando, onChange }: Props) {
  const [novaColuna, setNovaColuna] = useState<{ tipo: 'provento' | 'desconto'; descricao: string } | null>(null);
  const [nomeColuna, setNomeColuna] = useState('');

  const colunas = useMemo(() => coletarColunas(itens), [itens]);

  const setValor = (funcId: string, col: Coluna, valor: number) => {
    if (!onChange) return;
    onChange(itens.map(item => {
      if (item.funcionarioId !== funcId) return item;
      const campo = col.tipo === 'provento' ? 'proventos' : 'descontos';
      const lista: T_Lancamento[] = item[campo].map(l =>
        l.descricao === col.descricao ? { ...l, valor } : l
      );
      if (!lista.some(l => l.descricao === col.descricao)) {
        lista.push({ descricao: col.descricao, valor });
      }
      return recalcular({ ...item, [campo]: lista });
    }));
  };

  const adicionarColuna = () => {
    if (!novaColuna || !nomeColuna.trim() || !onChange) return;
    const col: Coluna = { tipo: novaColuna.tipo, descricao: nomeColuna.trim() };
    if (colunas.some(c => c.tipo === col.tipo && c.descricao === col.descricao)) {
      setNovaColuna(null); setNomeColuna(''); return;
    }
    const campo = col.tipo === 'provento' ? 'proventos' : 'descontos';
    onChange(itens.map(item => recalcular({
      ...item,
      [campo]: [...item[campo], { descricao: col.descricao, valor: 0 }],
    })));
    setNovaColuna(null); setNomeColuna('');
  };

  const removerColuna = (col: Coluna) => {
    if (!onChange) return;
    const campo = col.tipo === 'provento' ? 'proventos' : 'descontos';
    onChange(itens.map(item => recalcular({
      ...item,
      [campo]: item[campo].filter(l => l.descricao !== col.descricao),
    })));
  };

  const totalBruto = itens.reduce((s, i) => s + i.totalProventos, 0);
  const totalDescontos = itens.reduce((s, i) => s + i.totalDescontos, 0);
  const totalLiquido = itens.reduce((s, i) => s + i.salarioLiquido, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 border-b border-gray-200 sticky left-0 bg-gray-50 z-10 min-w-[160px]">
              Colaborador
            </th>

            {/* Colunas de proventos */}
            {colunas.filter(c => c.tipo === 'provento').map(col => (
              <th key={`p:${col.descricao}`} className="px-3 py-2.5 text-right text-xs font-semibold border-b border-gray-200 min-w-[110px] group">
                <div className="flex items-center justify-end gap-1">
                  <span className="text-green-700 truncate max-w-[90px]" title={col.descricao}>{col.descricao}</span>
                  {editando && (
                    <button onClick={() => removerColuna(col)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity shrink-0">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </th>
            ))}

            {/* Colunas de descontos */}
            {colunas.filter(c => c.tipo === 'desconto').map(col => (
              <th key={`d:${col.descricao}`} className="px-3 py-2.5 text-right text-xs font-semibold border-b border-gray-200 min-w-[110px] group">
                <div className="flex items-center justify-end gap-1">
                  <span className="text-red-600 truncate max-w-[90px]" title={col.descricao}>{col.descricao}</span>
                  {editando && (
                    <button onClick={() => removerColuna(col)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity shrink-0">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </th>
            ))}

            {/* Botão adicionar coluna */}
            {editando && (
              <th className="px-2 py-2.5 border-b border-gray-200 w-8">
                {novaColuna === null ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setNovaColuna({ tipo: 'provento', descricao: '' }); setNomeColuna(''); }}
                      className="text-[10px] px-1.5 py-0.5 rounded border border-green-200 text-green-700 hover:bg-green-50"
                      title="Adicionar provento"
                    >+ P</button>
                    <button
                      onClick={() => { setNovaColuna({ tipo: 'desconto', descricao: '' }); setNomeColuna(''); }}
                      className="text-[10px] px-1.5 py-0.5 rounded border border-red-200 text-red-600 hover:bg-red-50"
                      title="Adicionar desconto"
                    >+ D</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 min-w-[200px]">
                    <input
                      autoFocus
                      list="sugestoes-nova-col"
                      value={nomeColuna}
                      onChange={e => setNomeColuna(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') adicionarColuna(); if (e.key === 'Escape') setNovaColuna(null); }}
                      placeholder={novaColuna.tipo === 'provento' ? 'Nome do provento' : 'Nome do desconto'}
                      className={`border rounded px-2 py-0.5 text-xs w-36 focus:outline-none focus:ring-1 ${novaColuna.tipo === 'provento' ? 'focus:ring-green-300 border-green-200' : 'focus:ring-red-300 border-red-200'}`}
                    />
                    <datalist id="sugestoes-nova-col">
                      {(novaColuna.tipo === 'provento' ? PROVENTOS_SUGERIDOS : DESCONTOS_SUGERIDOS).map(s => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                    <button onClick={adicionarColuna} className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold">OK</button>
                    <button onClick={() => setNovaColuna(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                  </div>
                )}
              </th>
            )}

            <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-700 border-b border-gray-200 min-w-[110px]">
              Líquido
            </th>
          </tr>

          {/* Legenda tipo */}
          {colunas.length > 0 && (
            <tr className="bg-gray-50/60">
              <td />
              {colunas.filter(c => c.tipo === 'provento').map(col => (
                <td key={`lp:${col.descricao}`} className="px-3 py-0.5">
                  <div className="h-0.5 rounded bg-green-300" />
                </td>
              ))}
              {colunas.filter(c => c.tipo === 'desconto').map(col => (
                <td key={`ld:${col.descricao}`} className="px-3 py-0.5">
                  <div className="h-0.5 rounded bg-red-300" />
                </td>
              ))}
              {editando && <td />}
              <td />
            </tr>
          )}
        </thead>

        <tbody className="divide-y divide-gray-100">
          {itens.map(item => (
            <tr key={item.funcionarioId} className="hover:bg-gray-50">
              {/* Nome */}
              <td className="px-4 py-2.5 sticky left-0 bg-white hover:bg-gray-50 z-10">
                <p className="text-sm font-medium text-gray-800 truncate max-w-[150px]" title={item.funcionarioNome}>
                  {item.funcionarioNome}
                </p>
                <p className="text-[11px] text-gray-400 truncate">{item.cargo}</p>
              </td>

              {/* Proventos */}
              {colunas.filter(c => c.tipo === 'provento').map(col => {
                const val = getValor(item, col);
                return (
                  <td key={`p:${col.descricao}:${item.funcionarioId}`} className="px-3 py-2.5 text-right">
                    {editando ? (
                      <input
                        type="number" min={0} step="0.01"
                        value={val || ''}
                        onChange={e => setValor(item.funcionarioId, col, Number(e.target.value))}
                        className="w-24 border rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-green-300"
                      />
                    ) : (
                      <span className={val ? 'text-green-700 font-medium' : 'text-gray-300'}>
                        {val ? fmt(val) : '—'}
                      </span>
                    )}
                  </td>
                );
              })}

              {/* Descontos */}
              {colunas.filter(c => c.tipo === 'desconto').map(col => {
                const val = getValor(item, col);
                return (
                  <td key={`d:${col.descricao}:${item.funcionarioId}`} className="px-3 py-2.5 text-right">
                    {editando ? (
                      <input
                        type="number" min={0} step="0.01"
                        value={val || ''}
                        onChange={e => setValor(item.funcionarioId, col, Number(e.target.value))}
                        className="w-24 border rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-red-300"
                      />
                    ) : (
                      <span className={val ? 'text-red-500' : 'text-gray-300'}>
                        {val ? `- ${fmt(val)}` : '—'}
                      </span>
                    )}
                  </td>
                );
              })}

              {editando && <td />}

              {/* Líquido */}
              <td className="px-4 py-2.5 text-right font-bold text-gray-800">
                {fmt(item.salarioLiquido)}
              </td>
            </tr>
          ))}
        </tbody>

        {/* Totais */}
        <tfoot>
          <tr className="bg-gray-50 border-t-2 border-gray-200 text-sm font-bold">
            <td className="px-4 py-3 text-gray-700 sticky left-0 bg-gray-50">
              Total <span className="font-normal text-xs text-gray-400">({itens.length})</span>
            </td>
            {colunas.filter(c => c.tipo === 'provento').map(col => {
              const total = itens.reduce((s, i) => s + getValor(i, col), 0);
              return (
                <td key={`tp:${col.descricao}`} className="px-3 py-3 text-right text-green-700">
                  {total ? fmt(total) : '—'}
                </td>
              );
            })}
            {colunas.filter(c => c.tipo === 'desconto').map(col => {
              const total = itens.reduce((s, i) => s + getValor(i, col), 0);
              return (
                <td key={`td:${col.descricao}`} className="px-3 py-3 text-right text-red-500">
                  {total ? `- ${fmt(total)}` : '—'}
                </td>
              );
            })}
            {editando && <td />}
            <td className="px-4 py-3 text-right text-gray-800">{fmt(totalLiquido)}</td>
          </tr>
          <tr className="bg-gray-50">
            <td className="px-4 pb-3 sticky left-0 bg-gray-50" colSpan={2}>
              <span className="text-xs text-gray-400">
                Proventos: <strong className="text-green-700">{fmt(totalBruto)}</strong>
                {'  '}Descontos: <strong className="text-red-500">{fmt(totalDescontos)}</strong>
              </span>
            </td>
            <td colSpan={colunas.length + (editando ? 1 : 0)} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
