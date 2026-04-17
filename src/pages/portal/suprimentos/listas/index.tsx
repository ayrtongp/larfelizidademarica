import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import PortalBase from '@/components/Portal/PortalBase';
import PermissionWrapper from '@/components/PermissionWrapper';
import CardLista from '@/components/suprimentos/listas/CardLista';
import FormNovaLista from '@/components/suprimentos/listas/FormNovaLista';
import ModalAjudaListas from '@/components/suprimentos/listas/ModalAjudaListas';
import S_listaCompras from '@/services/S_listaCompras';
import { StatusLista, T_ListaCompras, TipoLista } from '@/types/T_listaCompras';
import { getUserID, updateProfile } from '@/utils/Login';
import { notifyError, notifySuccess } from '@/utils/Functions';

const TABS: { tipo: TipoLista; emoji: string; label: string }[] = [
  { tipo: 'mercado', emoji: '🛒', label: 'Mercado' },
  { tipo: 'sacolao', emoji: '🥬', label: 'Sacolão' },
];

const STATUS_FILTROS: { value: StatusLista | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'finalizada', label: 'Finalizada' },
  { value: 'comprada', label: 'Comprada' },
];

const Index = () => {
  const router = useRouter();
  const [tipoAtivo, setTipoAtivo] = useState<TipoLista>('mercado');
  const [filtroStatus, setFiltroStatus] = useState<StatusLista | ''>('');
  const [filtroFrom, setFiltroFrom] = useState('');
  const [filtroTo, setFiltroTo] = useState('');
  const [listas, setListas] = useState<T_ListaCompras[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modelo, setModelo] = useState<T_ListaCompras | null>(null);
  const [showAjuda, setShowAjuda] = useState(false);

  const fetchListas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await S_listaCompras.getAll({
        tipo: tipoAtivo,
        status: filtroStatus || undefined,
        from: filtroFrom || undefined,
        to: filtroTo || undefined,
      });
      setListas(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error(err);
      notifyError('Erro ao carregar listas.');
    } finally {
      setLoading(false);
    }
  }, [tipoAtivo, filtroStatus, filtroFrom, filtroTo]);

  useEffect(() => {
    fetchListas();
  }, [fetchListas]);

  const handleAbrirNova = () => {
    setModelo(null);
    setShowModal(true);
  };

  const handleUsarComoModelo = (lista: T_ListaCompras) => {
    setModelo(lista);
    setShowModal(true);
  };

  const handleSalvar = async (formData: { tipo: TipoLista; titulo: string; data: string; observacoes: string }) => {
    try {
      setSaving(true);
      const userInfo = updateProfile();
      const criadoPor = getUserID();
      const criadoPorNome = userInfo ? `${userInfo.nome ?? ''} ${userInfo.sobrenome ?? ''}`.trim() : '';

      let id: string;
      if (modelo) {
        const result = await S_listaCompras.duplicar({
          id: modelo._id!,
          titulo: formData.titulo,
          data: formData.data,
          criadoPor,
          criadoPorNome,
        });
        id = result.id;
        notifySuccess('Lista criada a partir do modelo!');
      } else {
        const result = await S_listaCompras.criar({ ...formData, criadoPor, criadoPorNome });
        id = result.id;
        notifySuccess('Lista criada com sucesso!');
      }

      setShowModal(false);
      setModelo(null);
      router.push(`/portal/suprimentos/listas/${id}`);
    } catch (err: unknown) {
      console.error(err);
      notifyError('Erro ao criar lista.');
    } finally {
      setSaving(false);
    }
  };

  const listasFiltradas = useMemo(() => listas, [listas]);

  return (
    <PermissionWrapper href="/portal" groups={['65cd5232828b75d5308e3315']}>
      <PortalBase>
        <div className="col-span-full">
          <div className="p-4 space-y-5">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-800">Listas de Compras</h1>
                <p className="text-sm text-gray-500 mt-0.5">Gerenciamento de listas de mercado e sacolão</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAjuda(true)}
                  title="Como usar"
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 text-sm font-medium rounded-lg transition-colors border border-gray-200"
                >
                  <span className="font-bold text-indigo-500">?</span>
                  Ajuda
                </button>
                <button
                  onClick={handleAbrirNova}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                >
                  <span className="text-base">+</span>
                  Nova Lista
                </button>
              </div>
            </div>

            {/* Tabs Mercado / Sacolão */}
            <div className="flex border-b border-gray-200">
              {TABS.map((tab) => (
                <button
                  key={tab.tipo}
                  onClick={() => setTipoAtivo(tab.tipo)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors
                    ${tipoAtivo === tab.tipo
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  <span>{tab.emoji}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-end gap-3 bg-white rounded-lg border border-gray-100 shadow-sm p-3">
              {/* Status pills */}
              <div className="flex flex-wrap gap-1.5">
                {STATUS_FILTROS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFiltroStatus(f.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                      ${filtroStatus === f.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              {/* Data de */}
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span>De:</span>
                <input
                  type="date"
                  value={filtroFrom}
                  onChange={(e) => setFiltroFrom(e.target.value)}
                  className="border rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                />
              </div>
              {/* Data até */}
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span>Até:</span>
                <input
                  type="date"
                  value={filtroTo}
                  onChange={(e) => setFiltroTo(e.target.value)}
                  className="border rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                />
              </div>
              {(filtroFrom || filtroTo || filtroStatus) && (
                <button
                  onClick={() => { setFiltroFrom(''); setFiltroTo(''); setFiltroStatus(''); }}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  Limpar filtros
                </button>
              )}
            </div>

            {/* Conteúdo */}
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
                Carregando listas...
              </div>
            ) : listasFiltradas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-sm gap-3">
                <span className="text-4xl">{tipoAtivo === 'mercado' ? '🛒' : '🥬'}</span>
                <p>Nenhuma lista encontrada.</p>
                <button
                  onClick={handleAbrirNova}
                  className="text-indigo-500 hover:text-indigo-700 underline text-xs"
                >
                  Criar a primeira lista
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {listasFiltradas.map((lista) => (
                  <CardLista
                    key={lista._id}
                    lista={lista}
                    onUsarComoModelo={handleUsarComoModelo}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal ajuda */}
        {showAjuda && <ModalAjudaListas onClose={() => setShowAjuda(false)} />}

        {/* Modal nova lista */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-gray-800">
                  {modelo ? `Usar "${modelo.titulo}" como modelo` : 'Nova Lista de Compras'}
                </h2>
                <button
                  onClick={() => { setShowModal(false); setModelo(null); }}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                >
                  ×
                </button>
              </div>
              {modelo && (
                <div className="mb-4 p-3 bg-purple-50 border border-purple-100 rounded-lg text-xs text-purple-700">
                  Os itens da lista original serão copiados. Você poderá editá-los depois.
                </div>
              )}
              <FormNovaLista
                tipoInicial={modelo?.tipo ?? tipoAtivo}
                tituloInicial={modelo ? `Cópia — ${modelo.titulo}` : ''}
                onSave={handleSalvar}
                onCancel={() => { setShowModal(false); setModelo(null); }}
                saving={saving}
              />
            </div>
          </div>
        )}

      </PortalBase>
    </PermissionWrapper>
  );
};

export default Index;
