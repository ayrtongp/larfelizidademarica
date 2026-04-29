import React, { useCallback, useEffect, useRef, useState } from 'react';
import PortalBase from '@/components/Portal/PortalBase';
import PermissionWrapper from '@/components/PermissionWrapper';
import { useHasGroup } from '@/hooks/useHasGroup';
import { useRouter } from 'next/router';
import S_folhaPagamento from '@/services/S_folhaPagamento';
import { T_FolhaPagamento, T_FolhaPagamentoItem, T_Lancamento } from '@/types/T_folhaPagamento';
import { uploadArquivoPasta } from '@/actions/DO_UploadFile';
import { notifyError, notifySuccess } from '@/utils/Functions';
import { updateProfile } from '@/utils/Login';
import FolhaTabelaView from '@/components/rh/FolhaTabelaView';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const PROVENTOS_SUGERIDOS = ['Salário Base', 'Horas Extras 50%', 'Horas Extras 100%', 'Adicional Noturno', 'DSR', 'Gratificação', 'Comissão', 'Outros'];
const DESCONTOS_SUGERIDOS = ['INSS', 'IRRF', 'Vale Transporte', 'Vale Alimentação', 'Adiantamento', 'Falta', 'Atraso', 'Outros'];

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function somaLancamentos(lista: T_Lancamento[]) {
  return lista.reduce((s, l) => s + Number(l.valor || 0), 0);
}

function recalcularItem(item: T_FolhaPagamentoItem): T_FolhaPagamentoItem {
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

  const adicionar = (descricao = '') => onChange([...itens, { descricao, valor: 0 }]);
  const atualizar = (i: number, campo: keyof T_Lancamento, valor: string | number) => {
    const novo = [...itens];
    novo[i] = { ...novo[i], [campo]: campo === 'valor' ? Number(valor) : valor };
    onChange(novo);
  };
  const remover = (i: number) => onChange(itens.filter((_, idx) => idx !== i));
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
            list={`sugestoes-det-${titulo}`}
            value={l.descricao}
            onChange={e => atualizar(i, 'descricao', e.target.value)}
            placeholder="Descrição"
            className="flex-1 border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300"
          />
          <datalist id={`sugestoes-det-${titulo}`}>
            {sugeridos.map(s => <option key={s} value={s} />)}
          </datalist>
          <input
            type="number" min={0} step="0.01"
            value={l.valor || ''}
            onChange={e => atualizar(i, 'valor', e.target.value)}
            className="w-24 border rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-300"
          />
          <button onClick={() => remover(i)} className="text-gray-300 hover:text-red-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <div className="flex gap-1 flex-wrap">
        {sugeridos.slice(0, 4).map(s => (
          <button key={s} onClick={() => adicionar(s)}
            className={`text-[10px] px-2 py-0.5 rounded border ${colorClass} hover:opacity-80`}>
            + {s}
          </button>
        ))}
        <button onClick={() => adicionar()}
          className="text-[10px] px-2 py-0.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50">
          + Outro
        </button>
      </div>
    </div>
  );
}

export default function FolhaPagamentoDetalhe() {
  const router = useRouter();
  const { id } = router.query;
  const { hasGroup: isRH } = useHasGroup('rh');

  const [folha, setFolha] = useState<T_FolhaPagamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'acordeao' | 'tabela'>('acordeao');
  const [editando, setEditando] = useState(false);
  const [itensEditaveis, setItensEditaveis] = useState<T_FolhaPagamentoItem[]>([]);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [salvandoItens, setSalvandoItens] = useState(false);
  const [salvandoArquivo, setSalvandoArquivo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const carregar = useCallback(async () => {
    if (!id || typeof id !== 'string') return;
    setLoading(true);
    try {
      const data = await S_folhaPagamento.getById(id);
      setFolha(data);
    } catch {
      notifyError('Erro ao carregar folha.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  const iniciarEdicao = () => {
    if (!folha) return;
    setItensEditaveis(folha.itens.map(i => ({ ...i, proventos: [...i.proventos], descontos: [...i.descontos] })));
    setEditando(true);
  };

  const atualizarProventos = (funcId: string, proventos: T_Lancamento[]) => {
    setItensEditaveis(prev => prev.map(i => i.funcionarioId === funcId ? recalcularItem({ ...i, proventos }) : i));
  };
  const atualizarDescontos = (funcId: string, descontos: T_Lancamento[]) => {
    setItensEditaveis(prev => prev.map(i => i.funcionarioId === funcId ? recalcularItem({ ...i, descontos }) : i));
  };

  const handleSalvarItens = async () => {
    if (!folha) return;
    setSalvandoItens(true);
    try {
      await S_folhaPagamento.atualizar(folha._id!, itensEditaveis);
      notifySuccess('Folha atualizada!');
      setEditando(false);
      setExpandido(null);
      await carregar();
    } catch {
      notifyError('Erro ao salvar alterações.');
    } finally {
      setSalvandoItens(false);
    }
  };

  const handleAnexarArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !folha) return;
    setSalvandoArquivo(true);
    try {
      const profile = updateProfile();
      const nomeUsuario = profile ? `${profile.nome ?? ''} ${profile.sobrenome ?? ''}`.trim() : '';
      const resultado = await uploadArquivoPasta(file, `rh/folha_pagamento/${folha._id}`, nomeUsuario);
      if (!resultado) throw new Error('Falha no upload');
      await S_folhaPagamento.anexarArquivo(folha._id!, {
        cloudURL: resultado.cloudURL, filename: resultado.filename,
        cloudFilename: resultado.cloudFilename, size: resultado.size, format: resultado.format,
      });
      notifySuccess('Arquivo anexado!');
      await carregar();
    } catch {
      notifyError('Erro ao anexar arquivo.');
    } finally {
      setSalvandoArquivo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const itens = editando ? itensEditaveis : (folha?.itens ?? []);
  const totalBruto = itens.reduce((s, i) => s + Number(i.totalProventos || 0), 0);
  const totalDescontos = itens.reduce((s, i) => s + Number(i.totalDescontos || 0), 0);
  const totalLiquido = itens.reduce((s, i) => s + Number(i.salarioLiquido || 0), 0);

  return (
    <PermissionWrapper href="/portal" groups={['rh']}>
      <PortalBase>
        <div className="col-span-full">
          {loading ? (
            <div className="text-center py-16 text-gray-400">Carregando...</div>
          ) : !folha ? (
            <div className="text-center py-16 text-gray-500">Folha não encontrada.</div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
                <div>
                  <button onClick={() => router.back()} className="text-xs text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1">
                    ← Voltar
                  </button>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {MESES[folha.periodo.mes - 1]} {folha.periodo.ano}
                  </h1>
                  <div className="flex items-center gap-5 mt-2 text-sm text-gray-500">
                    <span>Proventos: <strong className="text-green-700">{formatCurrency(folha.totalBruto)}</strong></span>
                    <span>Descontos: <strong className="text-red-500">{formatCurrency(folha.totalDescontos)}</strong></span>
                    <span>Líquido: <strong className="text-gray-800">{formatCurrency(folha.totalLiquido)}</strong></span>
                  </div>
                </div>

                {/* Toggle de visualização */}
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

                {isRH && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {folha.cloudURL ? (
                      <div className="flex items-center gap-2">
                        <a href={folha.cloudURL} target="_blank" rel="noopener noreferrer"
                          className="px-3 py-1.5 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-sm rounded-lg">
                          📎 {folha.filename}
                        </a>
                        <label className="px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm rounded-lg cursor-pointer">
                          {salvandoArquivo ? 'Enviando...' : 'Trocar'}
                          <input ref={fileInputRef} type="file" className="hidden" onChange={handleAnexarArquivo} />
                        </label>
                      </div>
                    ) : (
                      <label className="px-3 py-1.5 border border-dashed border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 text-sm rounded-lg cursor-pointer">
                        {salvandoArquivo ? 'Enviando...' : '+ Anexar arquivo'}
                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleAnexarArquivo} />
                      </label>
                    )}

                    {!editando ? (
                      <button onClick={iniciarEdicao}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg">
                        Editar valores
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => { setEditando(false); setExpandido(null); }}
                          className="px-4 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm rounded-lg">
                          Cancelar
                        </button>
                        <button onClick={handleSalvarItens} disabled={salvandoItens}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm rounded-lg">
                          {salvandoItens ? 'Salvando...' : 'Salvar'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Vista Tabela */}
              {viewMode === 'tabela' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <FolhaTabelaView
                    itens={itens}
                    editando={editando}
                    onChange={editando ? setItensEditaveis : undefined}
                  />
                </div>
              )}

              {/* Vista Acordeão */}
              {viewMode === 'acordeao' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
                {itens.map((item) => (
                  <div key={item.funcionarioId}>
                    {/* Linha resumo */}
                    <button
                      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 text-left"
                      onClick={() => setExpandido(expandido === item.funcionarioId ? null : item.funcionarioId)}
                    >
                      <svg className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${expandido === item.funcionarioId ? 'rotate-90' : ''}`}
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
                        <p className="text-gray-800 font-bold border-t border-gray-200 pt-0.5">{formatCurrency(item.salarioLiquido)}</p>
                      </div>
                    </button>

                    {/* Detalhes expandidos */}
                    {expandido === item.funcionarioId && (
                      <div className={`px-5 pb-4 pt-2 grid gap-4 sm:grid-cols-2 ${editando ? 'bg-gray-50' : 'bg-slate-50/50'}`}>
                        {editando ? (
                          <>
                            <LancamentoEditor titulo="Proventos" sugeridos={PROVENTOS_SUGERIDOS}
                              itens={item.proventos} cor="green"
                              onChange={p => atualizarProventos(item.funcionarioId, p)} />
                            <LancamentoEditor titulo="Descontos" sugeridos={DESCONTOS_SUGERIDOS}
                              itens={item.descontos} cor="red"
                              onChange={d => atualizarDescontos(item.funcionarioId, d)} />
                          </>
                        ) : (
                          <>
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-wide text-green-700 mb-2">Proventos</p>
                              {item.proventos.length === 0 ? (
                                <p className="text-xs text-gray-400">Nenhum lançamento.</p>
                              ) : item.proventos.map((l, i) => (
                                <div key={i} className="flex justify-between text-xs text-gray-600 py-0.5">
                                  <span>{l.descricao}</span>
                                  <span className="font-medium text-green-700">{formatCurrency(l.valor)}</span>
                                </div>
                              ))}
                            </div>
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-wide text-red-600 mb-2">Descontos</p>
                              {item.descontos.length === 0 ? (
                                <p className="text-xs text-gray-400">Nenhum desconto.</p>
                              ) : item.descontos.map((l, i) => (
                                <div key={i} className="flex justify-between text-xs text-gray-600 py-0.5">
                                  <span>{l.descricao}</span>
                                  <span className="font-medium text-red-500">- {formatCurrency(l.valor)}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Totais */}
                <div className="flex items-center justify-between px-5 py-4 bg-gray-50 text-sm font-bold text-gray-700">
                  <span>Total ({itens.length} colaboradores)</span>
                  <div className="flex gap-5">
                    <span className="text-green-700">{formatCurrency(totalBruto)}</span>
                    <span className="text-red-500">- {formatCurrency(totalDescontos)}</span>
                    <span>{formatCurrency(totalLiquido)}</span>
                  </div>
                </div>
              </div>
              )}
            </>
          )}
        </div>
      </PortalBase>
    </PermissionWrapper>
  );
}
