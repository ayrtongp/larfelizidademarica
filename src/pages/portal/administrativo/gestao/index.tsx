import React, { useEffect, useState } from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';
import PortalBase from '@/components/Portal/PortalBase';
import { ADMINISTRATIVO_GROUP_ID } from '@/constants/accessGroups';
import { FaClipboardList, FaHeartbeat, FaMoneyCheckAlt, FaCalendarCheck, FaNotesMedical, FaExclamationTriangle, FaBandAid, FaUserClock, FaBoxes, FaTimes } from 'react-icons/fa';

// ── Tipos ──────────────────────────────────────────

interface IdosoAlerta {
  _id: string;
  nome: string;
  apelido?: string;
  foto_base64?: string;
  foto_cdn?: string;
  ultimaAnotacao?: string | null;
  ultimoRegistro?: string | null;
}

interface DadosIdoso24h {
  total: number;
  totalAtivos: number;
  idosos: IdosoAlerta[];
}

interface FuncionarioAlerta {
  _id: string;
  nome: string;
  cargo: string;
  foto_base64?: string | null;
  foto_cdn?: string | null;
  faltam: number;
  mesesFaltando: string[];
}

interface DadosContracheque {
  total: number;
  totalAtivos: number;
  funcionarios: FuncionarioAlerta[];
}

interface EstoqueBaixoItem {
  nome: string;
  categoria: string;
  saldo: number;
  minimo: number;
}

interface DadosEstoqueBaixo {
  total: number;
  totalInsumos: number;
  itens: EstoqueBaixoItem[];
}

interface UsuarioSemLogin {
  _id: string;
  nome: string;
  funcao: string;
  email: string;
  foto: string | null;
  lastLogin: string | null;
}

interface DadosSemLogin {
  total: number;
  totalAtivos: number;
  usuarios: UsuarioSemLogin[];
}

interface FeridaItem {
  _id: string;
  nome: string;
  regiaoCorpo: string;
  tipo: string;
  status: string;
  dataLesao: string;
  dias: number;
  ultimaAtualizacao: string | null;
}

interface DadosFeridas {
  totalAbertas: number;
  atrasadas: number;
  emDia: number;
  listaAtrasadas: FeridaItem[];
  listaEmDia: FeridaItem[];
}

interface AlertaEvacuacao {
  _id: string;
  nome: string;
  apelido?: string;
  foto_base64?: string;
  foto_cdn?: string;
  consecutivos: number;
  registros: string[];
}

interface DadosEvacuacao {
  total: number;
  totalAtivos: number;
  alertas: AlertaEvacuacao[];
}

interface IdosoEvolucao {
  _id: string;
  nome: string;
  apelido?: string;
  foto_base64?: string;
  foto_cdn?: string;
  ultimaEvolucao: string | null;
}

interface DadosEvolucao {
  totalPendentes: number;
  totalAtivos: number;
  totalAreas: number;
  porArea: Record<string, IdosoEvolucao[]>;
}

// ── Helpers ────────────────────────────────────────

function formatarTempo(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Nunca registrado';
  const data = new Date(dateStr);
  if (isNaN(data.getTime())) return 'Data inválida';
  const diffMs = Date.now() - data.getTime();
  const horas = Math.floor(diffMs / (1000 * 60 * 60));
  const dias = Math.floor(horas / 24);
  if (dias > 0) return `há ${dias}d ${horas % 24}h`;
  return `há ${horas}h`;
}

function corCard(total: number) {
  if (total === 0) return { border: 'border-green-300 bg-green-50', num: 'text-green-600' };
  if (total <= 3) return { border: 'border-yellow-300 bg-yellow-50', num: 'text-yellow-700' };
  return { border: 'border-red-300 bg-red-50', num: 'text-red-600' };
}

// ── Modal genérico ─────────────────────────────────

function Modal({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">{titulo}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Card compacto (só número, clica para abrir modal) ──

function CardGestao({ titulo, subtitulo, icone, total, totalLabel, loading, erro, onClick }: {
  titulo: string;
  subtitulo: string;
  icone: React.ReactNode;
  total: number | null;
  totalLabel: string;
  loading: boolean;
  erro: boolean;
  onClick: () => void;
}) {
  const cores = total !== null ? corCard(total) : { border: 'border-gray-200', num: 'text-gray-400' };
  const clicavel = total !== null && total > 0;

  return (
    <button
      type="button"
      onClick={clicavel ? onClick : undefined}
      className={`rounded-xl border shadow-sm p-5 text-left w-full transition-transform ${cores.border} ${clicavel ? 'hover:scale-[1.02] cursor-pointer' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
          {icone}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">{titulo}</p>
          <p className="text-xs text-gray-400">{subtitulo}</p>
        </div>
      </div>
      <div className="mt-3">
        {loading ? (
          <p className="text-sm text-gray-400">Carregando...</p>
        ) : erro ? (
          <p className="text-sm text-red-400">Erro ao carregar</p>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${cores.num}`}>{total}</span>
            <span className="text-sm text-gray-400">{totalLabel}</span>
          </div>
        )}
      </div>
    </button>
  );
}

// ── Lista de idosos para modal ─────────────────────

function ListaIdosos({ idosos, campoData }: { idosos: IdosoAlerta[]; campoData: 'ultimaAnotacao' | 'ultimoRegistro' }) {
  return (
    <>
      {idosos.map(idoso => {
        const foto = idoso.foto_cdn || idoso.foto_base64;
        const dataVal = idoso[campoData];
        return (
          <div key={idoso._id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
            {foto ? (
              <img src={foto} className="w-9 h-9 rounded-full object-cover shrink-0" alt={idoso.nome} />
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                {(idoso.apelido || idoso.nome).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800 truncate">{idoso.apelido || idoso.nome}</p>
              <p className="text-xs text-gray-400">{idoso.nome}</p>
            </div>
            <span className={`text-xs font-medium shrink-0 ${dataVal ? 'text-yellow-600' : 'text-red-500'}`}>
              {formatarTempo(dataVal)}
            </span>
          </div>
        );
      })}
    </>
  );
}

// ── Lista de funcionários para modal ───────────────

function ListaFuncionarios({ funcionarios }: { funcionarios: FuncionarioAlerta[] }) {
  return (
    <>
      {funcionarios.map(f => {
        const foto = f.foto_cdn || f.foto_base64;
        return (
        <div key={f._id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
          {foto ? (
            <img src={foto} className="w-9 h-9 rounded-full object-cover shrink-0" alt={f.nome} />
          ) : (
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
              {f.nome.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-800 truncate">{f.nome}</p>
            <p className="text-xs text-gray-400">{f.cargo}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs font-semibold text-red-500">{f.faltam} pendente{f.faltam > 1 ? 's' : ''}</span>
            <p className="text-xs text-gray-400 mt-0.5">{f.mesesFaltando.join(', ')}</p>
          </div>
        </div>
        );
      })}
    </>
  );
}

// ── Lista de evoluções por área para modal ─────────

function ListaEvolucoes({ dados }: { dados: DadosEvolucao }) {
  const areas = Object.keys(dados.porArea).sort();
  return (
    <>
      {areas.map(area => (
        <div key={area}>
          <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{area}</span>
            <span className="ml-2 text-xs text-gray-400">{dados.porArea[area].length} idoso{dados.porArea[area].length !== 1 ? 's' : ''}</span>
          </div>
          {dados.porArea[area].map((idoso: any, i: number) => {
            const foto = idoso.foto_cdn || idoso.foto_base64;
            return (
              <div key={`${area}_${i}`} className="flex items-center gap-3 px-5 py-2.5 border-b border-gray-50 last:border-0">
                {foto ? (
                  <img src={foto} className="w-8 h-8 rounded-full object-cover shrink-0" alt={idoso.nome} />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {(idoso.apelido || idoso.nome).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{idoso.apelido || idoso.nome}</p>
                  <p className="text-xs text-gray-400">Última: {idoso.ultimaEvolucao ?? '—'}</p>
                </div>
                <span className="text-xs font-bold text-red-500 shrink-0">
                  {idoso.daysSince}d
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

// ── Lista de evacuação para modal ──────────────────

function ListaEvacuacao({ alertas }: { alertas: AlertaEvacuacao[] }) {
  return (
    <>
      {alertas.map(a => {
        const foto = a.foto_cdn || a.foto_base64;
        return (
          <div key={a._id} className="px-5 py-3 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-3">
              {foto ? (
                <img src={foto} className="w-9 h-9 rounded-full object-cover shrink-0" alt={a.nome} />
              ) : (
                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                  {(a.apelido || a.nome).charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{a.apelido || a.nome}</p>
                <p className="text-xs text-gray-400">{a.nome}</p>
              </div>
              <span className="text-xs font-bold text-red-600 shrink-0">{a.consecutivos} registros</span>
            </div>
            <div className="mt-1.5 ml-12 flex flex-wrap gap-1.5">
              {a.registros.slice(0, 6).map((r, i) => (
                <span key={i} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{r}</span>
              ))}
              {a.registros.length > 6 && (
                <span className="text-xs text-gray-400">+{a.registros.length - 6} mais</span>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

// ── Lista de feridas para modal ────────────────────

function fmtDataLesao(s: string) {
  if (!s) return '—';
  const [a, m, d] = s.split('-');
  return d && m && a ? `${d}/${m}/${a}` : s;
}

function ListaFeridas({ dados }: { dados: DadosFeridas }) {
  return (
    <>
      {dados.listaAtrasadas.length > 0 && (
        <div>
          <div className="px-5 py-2.5 bg-red-50 border-b border-red-200">
            <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Sem atualização (&gt; 7 dias)</span>
            <span className="ml-2 text-xs text-red-400">{dados.listaAtrasadas.length}</span>
          </div>
          {dados.listaAtrasadas.map(f => (
            <div key={f._id} className="px-5 py-3 border-b border-gray-50 last:border-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-800">{f.nome}</p>
                <span className="text-xs font-bold text-red-500">{f.dias}d</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                <span>{f.regiaoCorpo}</span>
                <span>— {f.tipo}</span>
                <span>| Status: {f.status}</span>
                <span>| Início: {fmtDataLesao(f.dataLesao)}</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {f.ultimaAtualizacao ? `Última atualização: ${f.ultimaAtualizacao}` : 'Nunca atualizada'}
              </p>
            </div>
          ))}
        </div>
      )}
      {dados.listaEmDia.length > 0 && (
        <div>
          <div className="px-5 py-2.5 bg-green-50 border-b border-green-200">
            <span className="text-xs font-bold text-green-600 uppercase tracking-wide">Em dia</span>
            <span className="ml-2 text-xs text-green-400">{dados.listaEmDia.length}</span>
          </div>
          {dados.listaEmDia.map(f => (
            <div key={f._id} className="px-5 py-2.5 border-b border-gray-50 last:border-0 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">{f.nome} — {f.regiaoCorpo}</p>
                <p className="text-xs text-gray-400">{f.tipo} | {f.status}</p>
              </div>
              <span className="text-xs text-green-600 font-medium">{f.dias}d</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Página ─────────────────────────────────────────

// ── Lista de usuários sem login para modal ─────────

function ListaUsuariosSemLogin({ usuarios }: { usuarios: UsuarioSemLogin[] }) {
  return (
    <>
      {usuarios.map(u => (
        <div key={u._id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
          {u.foto ? (
            <img src={u.foto} className="w-9 h-9 rounded-full object-cover shrink-0" alt={u.nome} />
          ) : (
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
              {u.nome.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{u.nome}</p>
            <p className="text-xs text-gray-400">{u.funcao}</p>
          </div>
          <span className={`text-xs font-medium shrink-0 ${u.lastLogin ? 'text-yellow-600' : 'text-red-500'}`}>
            {u.lastLogin ? formatarTempo(u.lastLogin) : 'Nunca logou'}
          </span>
        </div>
      ))}
    </>
  );
}

// ── Lista de estoque baixo para modal ──────────────

function ListaEstoqueBaixo({ itens }: { itens: EstoqueBaixoItem[] }) {
  return (
    <>
      {itens.map((item, i) => (
        <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-0">
          <div>
            <p className="text-sm font-medium text-gray-800">{item.nome}</p>
            <p className="text-xs text-gray-400">{item.categoria}</p>
          </div>
          <div className="text-right">
            <span className={`text-sm font-bold ${item.saldo <= 0 ? 'text-red-600' : 'text-yellow-600'}`}>{item.saldo}</span>
            <p className="text-xs text-gray-400">mín. {item.minimo}</p>
          </div>
        </div>
      ))}
    </>
  );
}

type ModalAberto = null | 'anotacao' | 'sinais' | 'contracheque' | 'folhaPonto' | 'evolucao' | 'evacuacao' | 'feridas' | 'login' | 'estoque';

export default function Gestao() {
  const [dadosAnotacao, setDadosAnotacao] = useState<DadosIdoso24h | null>(null);
  const [dadosSinais, setDadosSinais] = useState<DadosIdoso24h | null>(null);
  const [dadosContracheque, setDadosContracheque] = useState<DadosContracheque | null>(null);
  const [dadosEvolucao, setDadosEvolucao] = useState<DadosEvolucao | null>(null);
  const [dadosEvacuacao, setDadosEvacuacao] = useState<DadosEvacuacao | null>(null);
  const [dadosFeridas, setDadosFeridas] = useState<DadosFeridas | null>(null);
  const [dadosFolhaPonto, setDadosFolhaPonto] = useState<DadosContracheque | null>(null);
  const [dadosLogin, setDadosLogin] = useState<DadosSemLogin | null>(null);
  const [dadosEstoque, setDadosEstoque] = useState<DadosEstoqueBaixo | null>(null);
  const [loadingAnot, setLoadingAnot] = useState(true);
  const [loadingSinais, setLoadingSinais] = useState(true);
  const [loadingCC, setLoadingCC] = useState(true);
  const [loadingEvo, setLoadingEvo] = useState(true);
  const [loadingEvac, setLoadingEvac] = useState(true);
  const [loadingFP, setLoadingFP] = useState(true);
  const [loadingFeridas, setLoadingFeridas] = useState(true);
  const [loadingLogin, setLoadingLogin] = useState(true);
  const [loadingEstoque, setLoadingEstoque] = useState(true);
  const [modal, setModal] = useState<ModalAberto>(null);

  useEffect(() => {
    fetch('/api/Controller/C_gestao?type=semAnotacao24h')
      .then(r => r.ok ? r.json() : null)
      .then(setDadosAnotacao)
      .catch(() => {})
      .finally(() => setLoadingAnot(false));

    fetch('/api/Controller/C_gestao?type=semSinaisVitais24h')
      .then(r => r.ok ? r.json() : null)
      .then(setDadosSinais)
      .catch(() => {})
      .finally(() => setLoadingSinais(false));

    fetch('/api/Controller/C_gestao?type=semContracheque')
      .then(r => r.ok ? r.json() : null)
      .then(setDadosContracheque)
      .catch(() => {})
      .finally(() => setLoadingCC(false));

    fetch('/api/Controller/C_gestao?type=semFolhaPonto')
      .then(r => r.ok ? r.json() : null)
      .then(setDadosFolhaPonto)
      .catch(() => {})
      .finally(() => setLoadingFP(false));

    fetch('/api/Controller/C_gestao?type=evolucaoAtrasada')
      .then(r => r.ok ? r.json() : null)
      .then(setDadosEvolucao)
      .catch(() => {})
      .finally(() => setLoadingEvo(false));

    fetch('/api/Controller/C_gestao?type=evacuacaoAusente')
      .then(r => r.ok ? r.json() : null)
      .then(setDadosEvacuacao)
      .catch(() => {})
      .finally(() => setLoadingEvac(false));

    fetch('/api/Controller/C_gestao?type=feridasAbertas')
      .then(r => r.ok ? r.json() : null)
      .then(setDadosFeridas)
      .catch(() => {})
      .finally(() => setLoadingFeridas(false));

    fetch('/api/Controller/C_gestao?type=semLogin3d')
      .then(r => r.ok ? r.json() : null)
      .then(setDadosLogin)
      .catch(() => {})
      .finally(() => setLoadingLogin(false));

    fetch('/api/Controller/C_gestao?type=estoqueBaixo')
      .then(r => r.ok ? r.json() : null)
      .then(setDadosEstoque)
      .catch(() => {})
      .finally(() => setLoadingEstoque(false));
  }, []);

  return (
    <PermissionWrapper href="/portal" groups={[ADMINISTRATIVO_GROUP_ID]}>
      <PortalBase>
        <div className="col-span-full space-y-5">

          <div>
            <h1 className="text-lg font-bold text-slate-700">Gestão</h1>
            <p className="text-xs text-gray-400">Indicadores rápidos para acompanhamento operacional</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            <CardGestao
              titulo="Sem anotação enfermagem"
              subtitulo="Últimas 24 horas"
              icone={<FaClipboardList className="text-indigo-500" />}
              total={dadosAnotacao?.total ?? null}
              totalLabel={`de ${dadosAnotacao?.totalAtivos ?? '—'} ativos`}
              loading={loadingAnot}
              erro={!loadingAnot && !dadosAnotacao}
              onClick={() => setModal('anotacao')}
            />

            <CardGestao
              titulo="Sem sinais vitais"
              subtitulo="Últimas 24 horas"
              icone={<FaHeartbeat className="text-red-500" />}
              total={dadosSinais?.total ?? null}
              totalLabel={`de ${dadosSinais?.totalAtivos ?? '—'} ativos`}
              loading={loadingSinais}
              erro={!loadingSinais && !dadosSinais}
              onClick={() => setModal('sinais')}
            />

            <CardGestao
              titulo="Contracheque pendente"
              subtitulo="Funcionários CLT sem contracheque"
              icone={<FaMoneyCheckAlt className="text-emerald-500" />}
              total={dadosContracheque?.total ?? null}
              totalLabel={`de ${dadosContracheque?.totalAtivos ?? '—'} ativos`}
              loading={loadingCC}
              erro={!loadingCC && !dadosContracheque}
              onClick={() => setModal('contracheque')}
            />

            <CardGestao
              titulo="Folha de ponto pendente"
              subtitulo="Funcionários CLT sem folha de ponto"
              icone={<FaCalendarCheck className="text-teal-500" />}
              total={dadosFolhaPonto?.total ?? null}
              totalLabel={`de ${dadosFolhaPonto?.totalAtivos ?? '—'} ativos`}
              loading={loadingFP}
              erro={!loadingFP && !dadosFolhaPonto}
              onClick={() => setModal('folhaPonto')}
            />

            <CardGestao
              titulo="Evolução atrasada"
              subtitulo="Sem evolução há mais de 7 dias"
              icone={<FaNotesMedical className="text-orange-500" />}
              total={dadosEvolucao?.totalPendentes ?? null}
              totalLabel={`em ${dadosEvolucao?.totalAreas ?? '—'} área${(dadosEvolucao?.totalAreas ?? 0) !== 1 ? 's' : ''}`}
              loading={loadingEvo}
              erro={!loadingEvo && !dadosEvolucao}
              onClick={() => setModal('evolucao')}
            />

            <CardGestao
              titulo="Evacuação ausente"
              subtitulo="4+ registros consecutivos sem eliminação"
              icone={<FaExclamationTriangle className="text-amber-500" />}
              total={dadosEvacuacao?.total ?? null}
              totalLabel={`de ${dadosEvacuacao?.totalAtivos ?? '—'} ativos`}
              loading={loadingEvac}
              erro={!loadingEvac && !dadosEvacuacao}
              onClick={() => setModal('evacuacao')}
            />

            <CardGestao
              titulo="Sem login recente"
              subtitulo="Usuários ativos sem acesso há 3+ dias"
              icone={<FaUserClock className="text-slate-500" />}
              total={dadosLogin?.total ?? null}
              totalLabel={`de ${dadosLogin?.totalAtivos ?? '—'} ativos`}
              loading={loadingLogin}
              erro={!loadingLogin && !dadosLogin}
              onClick={() => setModal('login')}
            />

            <CardGestao
              titulo="Estoque baixo"
              subtitulo="Insumos abaixo do mínimo"
              icone={<FaBoxes className="text-indigo-500" />}
              total={dadosEstoque?.total ?? null}
              totalLabel={`de ${dadosEstoque?.totalInsumos ?? '—'} insumos`}
              loading={loadingEstoque}
              erro={!loadingEstoque && !dadosEstoque}
              onClick={() => setModal('estoque')}
            />

            <CardGestao
              titulo="Feridas abertas"
              subtitulo="Monitoramento de lesões ativas"
              icone={<FaBandAid className="text-rose-500" />}
              total={dadosFeridas?.atrasadas ?? null}
              totalLabel={`atrasada${(dadosFeridas?.atrasadas ?? 0) !== 1 ? 's' : ''} de ${dadosFeridas?.totalAbertas ?? '—'} aberta${(dadosFeridas?.totalAbertas ?? 0) !== 1 ? 's' : ''}`}
              loading={loadingFeridas}
              erro={!loadingFeridas && !dadosFeridas}
              onClick={() => setModal('feridas')}
            />

          </div>
        </div>

        {/* Modais */}
        {modal === 'anotacao' && dadosAnotacao && (
          <Modal titulo={`Sem anotação enfermagem — ${dadosAnotacao.total} idoso${dadosAnotacao.total !== 1 ? 's' : ''}`} onClose={() => setModal(null)}>
            <ListaIdosos idosos={dadosAnotacao.idosos} campoData="ultimaAnotacao" />
          </Modal>
        )}

        {modal === 'sinais' && dadosSinais && (
          <Modal titulo={`Sem sinais vitais — ${dadosSinais.total} idoso${dadosSinais.total !== 1 ? 's' : ''}`} onClose={() => setModal(null)}>
            <ListaIdosos idosos={dadosSinais.idosos} campoData="ultimoRegistro" />
          </Modal>
        )}

        {modal === 'contracheque' && dadosContracheque && (
          <Modal titulo={`Contracheque pendente — ${dadosContracheque.total} funcionário${dadosContracheque.total !== 1 ? 's' : ''}`} onClose={() => setModal(null)}>
            <ListaFuncionarios funcionarios={dadosContracheque.funcionarios} />
          </Modal>
        )}

        {modal === 'folhaPonto' && dadosFolhaPonto && (
          <Modal titulo={`Folha de ponto pendente — ${dadosFolhaPonto.total} funcionário${dadosFolhaPonto.total !== 1 ? 's' : ''}`} onClose={() => setModal(null)}>
            <ListaFuncionarios funcionarios={dadosFolhaPonto.funcionarios} />
          </Modal>
        )}

        {modal === 'evolucao' && dadosEvolucao && (
          <Modal titulo={`Evolução atrasada — ${dadosEvolucao.totalAreas} área${dadosEvolucao.totalAreas !== 1 ? 's' : ''} com pendência`} onClose={() => setModal(null)}>
            <ListaEvolucoes dados={dadosEvolucao} />
          </Modal>
        )}

        {modal === 'evacuacao' && dadosEvacuacao && (
          <Modal titulo={`Evacuação ausente — ${dadosEvacuacao.total} idoso${dadosEvacuacao.total !== 1 ? 's' : ''}`} onClose={() => setModal(null)}>
            <ListaEvacuacao alertas={dadosEvacuacao.alertas} />
          </Modal>
        )}

        {modal === 'estoque' && dadosEstoque && (
          <Modal titulo={`Estoque baixo — ${dadosEstoque.total} insumo${dadosEstoque.total !== 1 ? 's' : ''}`} onClose={() => setModal(null)}>
            <ListaEstoqueBaixo itens={dadosEstoque.itens} />
          </Modal>
        )}

        {modal === 'login' && dadosLogin && (
          <Modal titulo={`Sem login recente — ${dadosLogin.total} usuário${dadosLogin.total !== 1 ? 's' : ''}`} onClose={() => setModal(null)}>
            <ListaUsuariosSemLogin usuarios={dadosLogin.usuarios} />
          </Modal>
        )}

        {modal === 'feridas' && dadosFeridas && (
          <Modal titulo={`Feridas abertas — ${dadosFeridas.totalAbertas} lesão${dadosFeridas.totalAbertas !== 1 ? 'ões' : ''}`} onClose={() => setModal(null)}>
            <ListaFeridas dados={dadosFeridas} />
          </Modal>
        )}

      </PortalBase>
    </PermissionWrapper>
  );
}
