import React, { useState } from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';
import PortalBase from '@/components/Portal/PortalBase';
import { useHasGroup } from '@/hooks/useHasGroup';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import Modalpadrao from '@/components/ModalPadrao';
import FormNovaSessao from '@/components/saude/FormNovaSessao';
import TabelaSessoes from '@/components/saude/TabelaSessoes';
import PainelHoje from '@/components/saude/PainelHoje';

type Tab = 'hoje' | 'historico';

function NavArrow({ dir, onClick }: { dir: 'left' | 'right'; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
      {dir === 'left' ? '‹' : '›'}
    </button>
  );
}

function formatDateBR(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  const dt = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  return dt.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function MedicoesPage() {
  const { hasGroup: hasMedicina,    loading: l1 } = useHasGroup('medicina');
  const { hasGroup: hasEnfermagem,  loading: l2 } = useHasGroup('equipe_enfermagem');
  const { hasGroup: hasCoordenacao, loading: l3 } = useHasGroup('coordenacao');
  const isAdmin = useIsAdmin();

  const loading   = l1 || l2 || l3;
  const temAcesso = hasMedicina || hasEnfermagem || hasCoordenacao || isAdmin;

  const [activeTab, setActiveTab]   = useState<Tab>('hoje');
  const [showForm, setShowForm]     = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [panelDate, setPanelDate]   = useState(() => new Date().toISOString().slice(0, 10));

  const handleSuccess = () => {
    setShowForm(false);
    setRefreshKey(k => k + 1);
  };

  const prevDay = () => {
    const d = new Date(panelDate + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    setPanelDate(d.toISOString().slice(0, 10));
  };

  const nextDay = () => {
    const today = new Date().toISOString().slice(0, 10);
    if (panelDate >= today) return;
    const d = new Date(panelDate + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    setPanelDate(d.toISOString().slice(0, 10));
  };

  const isToday = panelDate === new Date().toISOString().slice(0, 10);

  return (
    <PermissionWrapper href="/portal">
      <PortalBase>
        <div className="col-span-full w-full p-4 sm:p-6 space-y-5 max-w-6xl mx-auto">

          {loading ? (
            <p className="text-sm text-gray-400 py-8 text-center">Verificando permissões...</p>
          ) : !temAcesso ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">🔒</p>
              <p className="text-base font-medium text-gray-600">Acesso restrito</p>
              <p className="text-sm mt-1">Você não tem permissão para acessar o módulo de Medições.</p>
            </div>
          ) : (
            <>
              {/* ── Header ─────────────────────────────────────── */}
              <div className="flex items-start sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-2xl">❤️</span> Medições
                  </h1>
                  <p className="text-xs text-gray-400 mt-0.5">Registro clínico de medições dos residentes</p>
                </div>
                <button onClick={() => setShowForm(true)}
                  className="shrink-0 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 px-4 sm:px-5 rounded-xl shadow-sm shadow-indigo-200 transition-colors">
                  <span className="text-base leading-none">+</span>
                  Nova Sessão
                </button>
              </div>

              {/* ── Abas ───────────────────────────────────────── */}
              <div className="flex gap-1 border-b border-gray-200 pb-0">
                {([
                  { key: 'hoje',      label: 'Painel do Dia' },
                  { key: 'historico', label: 'Histórico'     },
                ] as { key: Tab; label: string }[]).map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
                      ${activeTab === tab.key
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ── Aba: Painel do Dia ─────────────────────────── */}
              {activeTab === 'hoje' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <NavArrow dir="left" onClick={prevDay} />
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-700 capitalize">
                        {formatDateBR(panelDate)}
                      </p>
                      {isToday && (
                        <span className="text-xs bg-indigo-100 text-indigo-600 font-semibold px-2 py-0.5 rounded-full">Hoje</span>
                      )}
                    </div>
                    <NavArrow dir="right" onClick={nextDay} />
                    {!isToday && (
                      <button onClick={() => setPanelDate(new Date().toISOString().slice(0, 10))}
                        className="text-xs text-indigo-500 hover:underline ml-2">
                        Voltar para hoje
                      </button>
                    )}
                  </div>
                  <PainelHoje date={panelDate} refreshKey={refreshKey} />
                </div>
              )}

              {/* ── Aba: Histórico ─────────────────────────────── */}
              {activeTab === 'historico' && (
                <TabelaSessoes refreshKey={refreshKey} />
              )}

              {/* ── Modal Nova Sessão ──────────────────────────── */}
              <Modalpadrao isOpen={showForm} onClose={() => setShowForm(false)}>
                <FormNovaSessao onSuccess={handleSuccess} onCancel={() => setShowForm(false)} />
              </Modalpadrao>
            </>
          )}
        </div>
      </PortalBase>
    </PermissionWrapper>
  );
}
