import React, { useEffect, useState } from 'react';
import { T_FolhaPagamentoItem, T_Lancamento } from '@/types/T_folhaPagamento';
import S_funcionariosCLT from '@/services/S_funcionariosCLT';
import FolhaTabelaView from '@/components/rh/FolhaTabelaView';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const PROVENTOS_SUGERIDOS = ['Salário Base', 'Horas Extras 50%', 'Horas Extras 100%', 'Adicional Noturno', 'DSR', 'Gratificação', 'Comissão', 'Outros'];
const DESCONTOS_SUGERIDOS = ['INSS', 'IRRF', 'Vale Transporte', 'Vale Alimentação', 'Adiantamento', 'Falta', 'Atraso', 'Outros'];

function formatCurrency(v: number) {
  if (isNaN(v)) return 'R$ 0,00';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function somaLancamentos(lista: T_Lancamento[]) {
  return lista.reduce((s, l) => s + Number(l.valor || 0), 0);
}

function calcularItem(item: T_FolhaPagamentoItem): T_FolhaPagamentoItem {
  const totalProventos = somaLancamentos(item.proventos);
  const totalDescontos = somaLancamentos(item.descontos);
  return { ...item, totalProventos, totalDescontos, salarioLiquido: totalProventos - totalDescontos };
}

interface LancamentoEditorProps {
  titulo: string;
  sugeridos: string[];
  itens: T_Lancamento[];
  cor: 'green' | 'red';
  onChange: (itens: T_Lancamento[]) => void;
}

function LancamentoEditor({ titulo, sugeridos, itens, cor, onChange }: LancamentoEditorProps) {
  const colorClass = cor === 'green'
    ? 'bg-green-50 border-green-200 text-green-700'
    : 'bg-red-50 border-red-200 text-red-700';
  const btnClass = cor === 'green'
    ? 'text-green-700 hover:text-green-900'
    : 'text-red-700 hover:text-red-900';

  const adicionar = (descricao = '') => {
    onChange([...itens, { descricao, valor: 0 }]);
  };

  const atualizar = (i: number, campo: keyof T_Lancamento, valor: string | number) => {
    const novo = [...itens];
    novo[i] = { ...novo[i], [campo]: campo === 'valor' ? Number(valor) : valor };
    onChange(novo);
  };

  const remover = (i: number) => {
    onChange(itens.filter((_, idx) => idx !== i));
  };

  const total = somaLancamentos(itens);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${colorClass}`}>
          {titulo}
        </p>
        <span className="text-xs font-semibold text-gray-600">{formatCurrency(total)}</span>
      </div>

      {itens.map((l, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input
            list={`sugestoes-${titulo}`}
            value={l.descricao}
            onChange={e => atualizar(i, 'descricao', e.target.value)}
            placeholder="Descrição"
            className="flex-1 border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300"
          />
          <datalist id={`sugestoes-${titulo}`}>
            {sugeridos.map(s => <option key={s} value={s} />)}
          </datalist>
          <input
            type="number"
            min={0}
            step="0.01"
            value={l.valor || ''}
            onChange={e => atualizar(i, 'valor', e.target.value)}
            placeholder="0,00"
            className="w-24 border rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-300"
          />
          <button onClick={() => remover(i)} className="text-gray-300 hover:text-red-400 shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}

      <div className="flex gap-1 flex-wrap">
        {sugeridos.slice(0, 4).map(s => (
          <button
            key={s}
            onClick={() => adicionar(s)}
            className={`text-[10px] px-2 py-0.5 rounded border ${colorClass} hover:opacity-80 transition-opacity`}
          >
            + {s}
          </button>
        ))}
        <button onClick={() => adicionar()} className="text-[10px] px-2 py-0.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50">
          + Outro
        </button>
      </div>
    </div>
  );
}

interface Props {
  onSalvar: (periodo: { mes: number; ano: number }, itens: T_FolhaPagamentoItem[]) => Promise<void>;
  onFechar: () => void;
  salvando: boolean;
  erro?: string;
}

export default function FolhaPagamentoForm({ onSalvar, onFechar, salvando, erro }: Props) {
  const anoAtual = new Date().getFullYear();
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(anoAtual);
  const [itens, setItens] = useState<T_FolhaPagamentoItem[]>([]);
  const [loadingFunc, setLoadingFunc] = useState(true);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'acordeao' | 'tabela'>('acordeao');

  useEffect(() => {
    S_funcionariosCLT.getAtivos()
      .then(funcs => {
        setItens(funcs.map((f: any) => {
          const salarioBase = f.contrato?.salarioBase ?? 0;
          return calcularItem({
            funcionarioId: f._id as string,
            funcionarioNome: f.usuario ? `${f.usuario.nome} ${f.usuario.sobrenome}`.trim() : '—',
            cargo: f.contrato?.cargo ?? '',
            proventos: salarioBase ? [{ descricao: 'Salário Base', valor: salarioBase }] : [],
            descontos: [],
            totalProventos: salarioBase,
            totalDescontos: 0,
            salarioLiquido: salarioBase,
          });
        }));
      })
      .catch(() => setItens([]))
      .finally(() => setLoadingFunc(false));
  }, []);

  const atualizarProventos = (id: string, proventos: T_Lancamento[]) => {
    setItens(prev => prev.map(i => i.funcionarioId === id ? calcularItem({ ...i, proventos }) : i));
  };

  const atualizarDescontos = (id: string, descontos: T_Lancamento[]) => {
    setItens(prev => prev.map(i => i.funcionarioId === id ? calcularItem({ ...i, descontos }) : i));
  };

  const totalBruto = itens.reduce((s, i) => s + i.totalProventos, 0);
  const totalDescontos = itens.reduce((s, i) => s + i.totalDescontos, 0);
  const totalLiquido = itens.reduce((s, i) => s + i.salarioLiquido, 0);

  const anos = Array.from({ length: 5 }, (_, i) => anoAtual - i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col" style={{ maxHeight: '92vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">Nova Folha de Pagamento</h2>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600 text-sm">fechar</button>
        </div>

        {/* Período */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50">
          <label className="text-xs font-medium text-gray-600">Período:</label>
          <select value={mes} onChange={e => setMes(Number(e.target.value))}
            className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={ano} onChange={e => setAno(Number(e.target.value))}
            className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
            {anos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {/* Toggle visualização */}
        <div className="flex items-center justify-end px-5 py-2 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('acordeao')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${viewMode === 'acordeao' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Acordeão
            </button>
            <button
              onClick={() => setViewMode('tabela')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${viewMode === 'tabela' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Tabela
            </button>
          </div>
        </div>

        {/* Vista Tabela */}
        {viewMode === 'tabela' && !loadingFunc && (
          <div className="flex-1 overflow-auto">
            <FolhaTabelaView
              itens={itens}
              editando={true}
              onChange={setItens}
            />
          </div>
        )}

        {/* Lista de funcionários (acordeão) */}
        {(viewMode === 'acordeao' || loadingFunc) && (
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {loadingFunc ? (
            <p className="text-sm text-gray-400 px-5 py-8 text-center">Carregando colaboradores...</p>
          ) : itens.length === 0 ? (
            <p className="text-sm text-gray-400 px-5 py-8 text-center">Nenhum colaborador ativo.</p>
          ) : itens.map(item => (
            <div key={item.funcionarioId}>
              {/* Linha resumo — clique para expandir */}
              <button
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 text-left"
                onClick={() => setExpandido(expandido === item.funcionarioId ? null : item.funcionarioId)}
              >
                <svg
                  className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${expandido === item.funcionarioId ? 'rotate-90' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.funcionarioNome}</p>
                  <p className="text-xs text-gray-400">{item.cargo}</p>
                </div>
                <div className="shrink-0 text-right text-xs space-y-0.5">
                  <p className="text-green-700 font-semibold">{formatCurrency(item.totalProventos)}</p>
                  <p className="text-red-500">- {formatCurrency(item.totalDescontos)}</p>
                  <p className="text-gray-700 font-bold border-t border-gray-200 pt-0.5">{formatCurrency(item.salarioLiquido)}</p>
                </div>
              </button>

              {/* Painel expandido com lançamentos */}
              {expandido === item.funcionarioId && (
                <div className="px-5 pb-4 pt-1 bg-gray-50 grid gap-4 sm:grid-cols-2">
                  <LancamentoEditor
                    titulo="Proventos"
                    sugeridos={PROVENTOS_SUGERIDOS}
                    itens={item.proventos}
                    cor="green"
                    onChange={p => atualizarProventos(item.funcionarioId, p)}
                  />
                  <LancamentoEditor
                    titulo="Descontos"
                    sugeridos={DESCONTOS_SUGERIDOS}
                    itens={item.descontos}
                    cor="red"
                    onChange={d => atualizarDescontos(item.funcionarioId, d)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        )}

        {/* Rodapé com totais */}
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex gap-6 text-sm">
              <span className="text-gray-500">Total proventos: <strong className="text-green-700">{formatCurrency(totalBruto)}</strong></span>
              <span className="text-gray-500">Descontos: <strong className="text-red-500">{formatCurrency(totalDescontos)}</strong></span>
              <span className="text-gray-500">Líquido: <strong className="text-gray-800">{formatCurrency(totalLiquido)}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              {erro && <p className="text-xs text-red-600 mr-2">{erro}</p>}
              <button onClick={onFechar} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-white">
                Cancelar
              </button>
              <button
                onClick={() => onSalvar({ mes, ano }, itens)}
                disabled={salvando || loadingFunc || itens.length === 0}
                className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-lg transition-colors"
              >
                {salvando ? 'Salvando...' : 'Criar Folha'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
