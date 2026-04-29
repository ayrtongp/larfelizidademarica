import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PermissionWrapper from '@/components/PermissionWrapper';
import Sidebar from '../../components/Sidebar/Sidebar';
import PortalHeader from '@/components/PortalHeader';
import WelcomeBanner from '@/components/Dashboard/WelcomeBanner';
import EvolucaoResidente from '@/components/Dashboard/EvolucaoResidente';
import CalendarioM1 from '@/components/Diversos/CalendarioM1';
import { Residentes_GET_getAniversarios } from '@/actions/Residentes';
import { formatDateBR } from '@/utils/Functions';
import { DatasImportantes_GET_getAll } from '@/actions/DatasImportante';
import { datasImportantesToEventos } from '@/types/T_datasImportantes';
import { useHasAnyGroup } from '@/hooks/useHasAnyGroup';
import { useHasGroup } from '@/hooks/useHasGroup';
import { ADMINISTRATIVO_GROUP_ID } from '@/constants/accessGroups';
import S_agendaGeral from '@/services/S_agendaGeral';
import { agendaGeralToEventosCalendario } from '@/types/T_agendaGeral';
import { getUserID } from '@/utils/Login';

type DashboardEventCategory = 'agenda' | 'aniversario' | 'data_importante' | 'outro';

interface DashboardEvent {
  data: string;
  titulo: string;
  horario?: string;
  observacao?: string;
  categoria?: DashboardEventCategory;
}

interface TaskSummary {
  pendentes: number;
  venceHoje: number;
  vencidas: number;
}

interface ComunicadoResumo {
  _id: string;
  title: string;
  description?: string;
  createdAt?: string;
  isRead?: boolean;
}

function parseDashboardEventDate(evento: DashboardEvent): Date | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(String(evento.data || ''))) return null;
  const [day, month, year] = evento.data.split('/').map(Number);
  const [hour, minute] = String(evento.horario || '00:00').split(':').map(Number);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day, hour || 0, minute || 0, 0, 0);
}

const CATEGORIA_LABEL: Record<DashboardEventCategory, string> = {
  agenda: 'Agenda',
  aniversario: 'Aniversário',
  data_importante: 'Data importante',
  outro: 'Evento',
};

const CATEGORIA_CLASS: Record<DashboardEventCategory, string> = {
  agenda: 'bg-sky-100 text-sky-700',
  aniversario: 'bg-amber-100 text-amber-700',
  data_importante: 'bg-violet-100 text-violet-700',
  outro: 'bg-slate-100 text-slate-700',
};

function truncateText(text: string, size: number) {
  return text.length <= size ? text : `${text.slice(0, size).trim()}...`;
}

function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [homeLoading, setHomeLoading] = useState(true);
  const [eventos, setEventos] = useState<DashboardEvent[]>([]);
  const [taskSummary, setTaskSummary] = useState<TaskSummary>({ pendentes: 0, venceHoje: 0, vencidas: 0 });
  const [comunicados, setComunicados] = useState<ComunicadoResumo[]>([]);

  const { hasGroup: hasAgendaAccess, loading: loadingAgendaAccess } = useHasAnyGroup([ADMINISTRATIVO_GROUP_ID, 'rh', 'coordenacao']);
  const { hasGroup: hasCoordenacao } = useHasGroup('coordenacao');
  const { hasGroup: hasMedicina } = useHasGroup('medicina');
  const { hasGroup: hasEnfermagem } = useHasGroup('equipe_enfermagem');

  const showResidentOverview = hasCoordenacao || hasMedicina || hasEnfermagem;

  async function getBirths(): Promise<DashboardEvent[]> {
    const res = await Residentes_GET_getAniversarios();
    const anoAtual = new Date().getFullYear();
    return res
      .filter((item: any) => item.data_nascimento)
      .map((item: any) => {
        const formatted = formatDateBR(item.data_nascimento);
        if (!formatted) return null;
        const [dia, mes] = formatted.split('/');
        if (!dia || !mes) return null;
        return { data: `${dia}/${mes}/${anoAtual}`, titulo: item.apelido || item.nome || 'Residente', observacao: 'Aniversário de residente', categoria: 'aniversario' as const };
      })
      .filter(Boolean) as DashboardEvent[];
  }

  async function getDatasImportantes(): Promise<DashboardEvent[]> {
    const res = await DatasImportantes_GET_getAll();
    return datasImportantesToEventos(res);
  }

  async function getAgendaGeral(): Promise<DashboardEvent[]> {
    const hoje = new Date().toISOString().split('T')[0];
    const res = await S_agendaGeral.getAll({ status: 'agendado', from: hoje });
    return agendaGeralToEventosCalendario(res);
  }

  async function getTaskSummary(): Promise<TaskSummary> {
    const userId = getUserID();
    if (!userId) return { pendentes: 0, venceHoje: 0, vencidas: 0 };
    const [countRes, alertsRes] = await Promise.all([
      fetch(`/api/Controller/C_tarefas?type=countPendentes&userId=${userId}`),
      fetch(`/api/Controller/C_tarefas?type=alertas&userId=${userId}`),
    ]);
    const countJson = countRes.ok ? await countRes.json() : { count: 0 };
    const alertsJson = alertsRes.ok ? await alertsRes.json() : { alertas: [] };
    const hoje = new Date().toISOString().split('T')[0];
    const alertas = Array.isArray(alertsJson.alertas) ? alertsJson.alertas : [];
    return {
      pendentes: Number(countJson.count || 0),
      venceHoje: alertas.filter((item: any) => item.prazo === hoje).length,
      vencidas: alertas.filter((item: any) => item.prazo < hoje).length,
    };
  }

  async function getRecentComunicados(): Promise<ComunicadoResumo[]> {
    const userId = getUserID();
    const res = await fetch('/api/Controller/Comunicados?type=getAll');
    if (!res.ok) return [];
    const json = await res.json();
    const docs = Array.isArray(json) ? json : [];
    return docs.slice(0, 4).map((item: any) => ({
      _id: String(item._id),
      title: item.title || 'Comunicado',
      description: item.description || '',
      createdAt: item.createdAt || '',
      isRead: Array.isArray(item.readers) ? item.readers.some((r: any) => r.userId === userId) : false,
    }));
  }

  useEffect(() => {
    if (loadingAgendaAccess) return;
    let active = true;
    (async () => {
      try {
        setHomeLoading(true);
        const [births, datas, agenda, tasks, latestComunicados] = await Promise.all([
          getBirths(), getDatasImportantes(),
          hasAgendaAccess ? getAgendaGeral() : Promise.resolve([]),
          getTaskSummary(), getRecentComunicados(),
        ]);
        if (!active) return;
        setEventos([...births, ...datas, ...agenda]);
        setTaskSummary(tasks);
        setComunicados(latestComunicados);
      } finally {
        if (active) setHomeLoading(false);
      }
    })();
    return () => { active = false; };
  }, [hasAgendaAccess, loadingAgendaAccess]);

  const eventosOrdenados = useMemo(() =>
    [...eventos].sort((a, b) => {
      const da = parseDashboardEventDate(a);
      const db = parseDashboardEventDate(b);
      return da && db ? da.getTime() - db.getTime() : 0;
    }), [eventos]);

  const hoje = useMemo(() => new Date(), []);
  const inicioHoje = useMemo(() => new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()), [hoje]);

  const proximosEventos = useMemo(() =>
    eventosOrdenados
      .filter((e) => { const d = parseDashboardEventDate(e); return d ? d.getTime() >= inicioHoje.getTime() : false; })
      .slice(0, 5),
    [eventosOrdenados, inicioHoje]);

  const recentComunicados = useMemo(() => comunicados.slice(0, 3), [comunicados]);

  return (
    <PermissionWrapper href="/portal">
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <PortalHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

          <main className="flex-1">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">

              <WelcomeBanner />

              {/* Tarefas */}
              <div>
                <h2 className="text-sm font-bold text-gray-700 mb-3">Minhas tarefas</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium mb-1">Pendentes</p>
                  <p className="text-3xl font-bold text-gray-800">{homeLoading ? '—' : taskSummary.pendentes}</p>
                </div>
                <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium mb-1">Vencem hoje</p>
                  <p className="text-3xl font-bold text-amber-600">{homeLoading ? '—' : taskSummary.venceHoje}</p>
                </div>
                <div className="bg-white rounded-xl border border-red-200 p-4 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium mb-1">Atrasadas</p>
                  <p className="text-3xl font-bold text-red-500">{homeLoading ? '—' : taskSummary.vencidas}</p>
                </div>
              </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),320px]">

                {/* Próximos eventos */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <h2 className="text-sm font-bold text-gray-700 mb-4">Próximos eventos</h2>
                  {homeLoading ? (
                    <p className="text-sm text-gray-400">Carregando...</p>
                  ) : proximosEventos.length === 0 ? (
                    <p className="text-sm text-gray-400">Nenhum evento próximo.</p>
                  ) : (
                    <div className="space-y-2">
                      {proximosEventos.map((evento, i) => (
                        <div
                          key={`${evento.data}-${i}`}
                          className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50"
                        >
                          <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORIA_CLASS[evento.categoria ?? 'outro']}`}>
                            {CATEGORIA_LABEL[evento.categoria ?? 'outro']}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{evento.titulo}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {evento.data}{evento.horario ? ` às ${evento.horario}` : ''}
                            </p>
                            {evento.observacao && (
                              <p className="text-xs text-gray-400 mt-0.5">{truncateText(evento.observacao, 80)}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Comunicados */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-gray-700">Comunicados</h2>
                    <Link href="/portal/comunicados" className="text-xs text-indigo-600 hover:underline">
                      Ver todos
                    </Link>
                  </div>
                  {homeLoading ? (
                    <p className="text-sm text-gray-400">Carregando...</p>
                  ) : recentComunicados.length === 0 ? (
                    <p className="text-sm text-gray-400">Nenhum comunicado recente.</p>
                  ) : (
                    <div className="space-y-2">
                      {recentComunicados.map((item) => (
                        <Link
                          key={item._id}
                          href={`/portal/comunicados/${item._id}`}
                          className="block p-3 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.isRead ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-600'}`}>
                              {item.isRead ? 'Lido' : 'Novo'}
                            </span>
                            {item.createdAt && (
                              <span className="text-xs text-gray-400">{formatDateBR(item.createdAt)}</span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-800">{item.title}</p>
                          {item.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{truncateText(item.description, 80)}</p>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Calendário */}
              <CalendarioM1 eventos={eventosOrdenados} />

              {/* Evoluções */}
              {showResidentOverview && (
                <div>
                  <h2 className="text-sm font-bold text-gray-700 mb-4">Últimas evoluções dos residentes</h2>
                  <EvolucaoResidente />
                </div>
              )}

            </div>
          </main>
        </div>
      </div>
    </PermissionWrapper>
  );
}

export default HomePage;
