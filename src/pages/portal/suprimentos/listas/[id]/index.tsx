import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import PortalBase from '@/components/Portal/PortalBase';
import PermissionWrapper from '@/components/PermissionWrapper';
import StatusBadgeLista from '@/components/suprimentos/listas/StatusBadgeLista';
import TabelaItensLista from '@/components/suprimentos/listas/TabelaItensLista';
import S_listaCompras from '@/services/S_listaCompras';
import { StatusLista, T_ItemLista, T_ListaCompras, TIPO_LISTA_CONFIG } from '@/types/T_listaCompras';
import { getUserID, updateProfile } from '@/utils/Login';
import { formatDateBR, notifyError, notifySuccess } from '@/utils/Functions';

const Detalhe = () => {
  const router = useRouter();
  const { id } = router.query;

  const [lista, setLista] = useState<T_ListaCompras | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [itensLocais, setItensLocais] = useState<T_ItemLista[]>([]);
  const [itensAlterados, setItensAlterados] = useState(false);
  const [editandoInfo, setEditandoInfo] = useState(false);
  const [formInfo, setFormInfo] = useState({ titulo: '', data: '', observacoes: '' });

  const carregarLista = useCallback(async (listId: string) => {
    try {
      setLoading(true);
      const data = await S_listaCompras.getById(listId);
      setLista(data);
      setItensLocais(data.itens ?? []);
      setItensAlterados(false);
      setFormInfo({ titulo: data.titulo, data: data.data, observacoes: data.observacoes ?? '' });
    } catch (err) {
      console.error(err);
      notifyError('Erro ao carregar lista.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id && typeof id === 'string') {
      carregarLista(id);
    }
  }, [id, carregarLista]);

  const getUserInfo = () => {
    const userInfo = updateProfile();
    const criadoPor = getUserID();
    const criadoPorNome = userInfo ? `${userInfo.nome ?? ''} ${userInfo.sobrenome ?? ''}`.trim() : '';
    return { criadoPor, criadoPorNome };
  };

  const handleMudarStatus = async (novoStatus: StatusLista) => {
    if (!lista || !id) return;
    const msgs: Partial<Record<StatusLista, string>> = {
      comprada: 'Marcar como comprada é definitivo. Confirmar?',
    };
    if (msgs[novoStatus] && !window.confirm(msgs[novoStatus])) return;
    try {
      setSaving(true);
      const { criadoPor } = getUserInfo();
      await S_listaCompras.updateStatus(id as string, novoStatus, criadoPor);
      await carregarLista(id as string);
      notifySuccess('Status atualizado!');
    } catch (err: unknown) {
      console.error(err);
      notifyError(err instanceof Error ? err.message : 'Erro ao atualizar status.');
    } finally {
      setSaving(false);
    }
  };

  const handleItensChange = (novosItens: T_ItemLista[]) => {
    setItensLocais(novosItens);
    const alterado = JSON.stringify(novosItens) !== JSON.stringify(lista?.itens ?? []);
    setItensAlterados(alterado);
  };

  const handleSalvarItens = async () => {
    if (!id) return;
    try {
      setSaving(true);
      const { criadoPor } = getUserInfo();
      await S_listaCompras.updateItens(id as string, itensLocais, criadoPor);
      await carregarLista(id as string);
      notifySuccess('Itens salvos!');
    } catch (err) {
      console.error(err);
      notifyError('Erro ao salvar itens.');
    } finally {
      setSaving(false);
    }
  };

  const handleSalvarInfo = async () => {
    if (!id) return;
    try {
      setSaving(true);
      const { criadoPor } = getUserInfo();
      await S_listaCompras.updateInfo(id as string, {
        titulo: formInfo.titulo,
        data: formInfo.data,
        observacoes: formInfo.observacoes,
      }, criadoPor);
      await carregarLista(id as string);
      setEditandoInfo(false);
      notifySuccess('Lista atualizada!');
    } catch (err) {
      console.error(err);
      notifyError('Erro ao atualizar lista.');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicar = async () => {
    if (!lista || !id) return;
    const novoTitulo = window.prompt('Título para a nova lista:', `Cópia — ${lista.titulo}`);
    if (!novoTitulo?.trim()) return;
    try {
      setSaving(true);
      const { criadoPor, criadoPorNome } = getUserInfo();
      const hoje = new Date().toISOString().split('T')[0];
      const result = await S_listaCompras.duplicar({ id: id as string, titulo: novoTitulo.trim(), data: hoje, criadoPor, criadoPorNome });
      notifySuccess('Lista duplicada!');
      router.push(`/portal/suprimentos/listas/${result.id}`);
    } catch (err) {
      console.error(err);
      notifyError('Erro ao duplicar lista.');
    } finally {
      setSaving(false);
    }
  };

  const handleExcluir = async () => {
    if (!lista || !id) return;
    if (!window.confirm(`Excluir a lista "${lista.titulo}"? Esta ação não pode ser desfeita.`)) return;
    try {
      setSaving(true);
      const { criadoPor } = getUserInfo();
      await S_listaCompras.excluir(id as string, criadoPor);
      notifySuccess('Lista excluída.');
      router.push('/portal/suprimentos/listas');
    } catch (err) {
      console.error(err);
      notifyError('Erro ao excluir lista.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PermissionWrapper href="/portal" groups={['65cd5232828b75d5308e3315']}>
        <PortalBase>
          <div className="col-span-full flex items-center justify-center py-20 text-gray-400 text-sm gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
            Carregando...
          </div>
        </PortalBase>
      </PermissionWrapper>
    );
  }

  if (!lista) {
    return (
      <PermissionWrapper href="/portal" groups={['65cd5232828b75d5308e3315']}>
        <PortalBase>
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <p>Lista não encontrada.</p>
            <button onClick={() => router.push('/portal/suprimentos/listas')} className="text-indigo-500 hover:underline text-sm">
              Voltar para listas
            </button>
          </div>
        </PortalBase>
      </PermissionWrapper>
    );
  }

  const tipoCfg = TIPO_LISTA_CONFIG[lista.tipo];
  const isComprada = lista.status === 'comprada';

  return (
    <PermissionWrapper href="/portal" groups={['65cd5232828b75d5308e3315']}>
      <PortalBase>
        <div className="col-span-full">
          <div className="p-4 space-y-5 max-w-4xl mx-auto">

            {/* Voltar */}
            <button
              onClick={() => router.push('/portal/suprimentos/listas')}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar para Listas
            </button>

            {/* Header card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              {editandoInfo ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Título</label>
                    <input
                      type="text"
                      value={formInfo.titulo}
                      onChange={(e) => setFormInfo((p) => ({ ...p, titulo: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Data prevista</label>
                    <input
                      type="date"
                      value={formInfo.data}
                      onChange={(e) => setFormInfo((p) => ({ ...p, data: e.target.value }))}
                      className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Observações</label>
                    <textarea
                      value={formInfo.observacoes}
                      onChange={(e) => setFormInfo((p) => ({ ...p, observacoes: e.target.value }))}
                      rows={2}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSalvarInfo} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                      {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button onClick={() => setEditandoInfo(false)} className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${tipoCfg.className}`}>
                        {tipoCfg.emoji} {tipoCfg.label}
                      </span>
                      <StatusBadgeLista status={lista.status} />
                      {lista.baseadaEm && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-600">
                          Baseada em modelo
                        </span>
                      )}
                    </div>
                    <h1 className="text-lg font-bold text-gray-800 break-words">{lista.titulo}</h1>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span>📅 {formatDateBR(lista.data)}</span>
                      <span>👤 {lista.criadoPorNome || 'Nutricionista'}</span>
                      <span>📋 {lista.itens.length} {lista.itens.length === 1 ? 'item' : 'itens'}</span>
                    </div>
                    {lista.observacoes && (
                      <p className="text-xs text-gray-500 bg-gray-50 rounded p-2 border-l-2 border-gray-300">
                        {lista.observacoes}
                      </p>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                    {!isComprada && (
                      <>
                        {lista.status === 'rascunho' && (
                          <button
                            onClick={() => handleMudarStatus('finalizada')}
                            disabled={saving}
                            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                          >
                            Finalizar lista
                          </button>
                        )}
                        {lista.status === 'finalizada' && (
                          <>
                            <button
                              onClick={() => handleMudarStatus('comprada')}
                              disabled={saving}
                              className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                            >
                              Marcar como comprada
                            </button>
                            <button
                              onClick={() => handleMudarStatus('rascunho')}
                              disabled={saving}
                              className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs rounded-lg transition-colors disabled:opacity-50"
                            >
                              Voltar p/ rascunho
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setEditandoInfo(true)}
                          disabled={saving}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded-lg transition-colors disabled:opacity-50"
                        >
                          Editar info
                        </button>
                      </>
                    )}
                    <button
                      onClick={handleDuplicar}
                      disabled={saving}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs rounded-lg transition-colors disabled:opacity-50"
                    >
                      Duplicar como modelo
                    </button>
                    <button
                      onClick={handleExcluir}
                      disabled={saving}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs rounded-lg transition-colors disabled:opacity-50"
                    >
                      Excluir lista
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Itens */}
            <div className="space-y-3">
              {itensAlterados && (
                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  <span>⚠️ Há alterações não salvas nos itens.</span>
                  <button
                    onClick={handleSalvarItens}
                    disabled={saving}
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Salvando...' : 'Salvar Itens'}
                  </button>
                </div>
              )}
              <TabelaItensLista
                itens={itensLocais}
                somenteLeitura={isComprada}
                podeMarcarComprado={lista.status === 'finalizada'}
                onItensChange={handleItensChange}
              />
            </div>

          </div>
        </div>
      </PortalBase>
    </PermissionWrapper>
  );
};

export default Detalhe;
