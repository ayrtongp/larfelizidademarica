import React, { useEffect, useState } from 'react';
import type { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import Image from 'next/image';
import LogoLar from '../../../public/images/lar felizidade logo transparente.png';
import { verifyFamiliaSession } from '@/utils/familiaSession';
import connect from '@/utils/Database';

// ── getServerSideProps ────────────────────────────────────────────────────────

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const session = verifyFamiliaSession(ctx.req as any);
  if (!session) {
    return { redirect: { destination: '/familia/login', permanent: false } };
  }

  const { db } = await connect();
  const vinculos = await db.collection('familiar_residente')
    .find({ usuario_id: session.userId, ativo: true })
    .toArray();

  if (vinculos.length === 0) {
    return { redirect: { destination: '/familia/sem-acesso', permanent: false } };
  }

  const idResidente = String(vinculos[0].residente_id);

  return {
    props: {
      nomeLogado:  session.nome,
      idResidente,
      residentes:  vinculos.map((v: any) => ({ id: String(v.residente_id), parentesco: v.parentesco })),
    },
  };
}

// ── Tipos locais ──────────────────────────────────────────────────────────────

interface Perfil {
  nome: string;
  apelido?: string;
  foto?: string | null;
  nascimento?: string;
  idade?: number | null;
}

interface Vital {
  code: string;
  label: string;
  valor: number;
  status: 'normal' | 'atencao' | 'critico';
}

interface Evento {
  titulo: string;
  data: string;
  horario?: string;
  observacao?: string;
}

interface Foto {
  _id: string;
  url: string;
}

interface ComunicadoItem {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
  lido: boolean;
}

interface Visita {
  _id: string;
  data: string;
  horario: string;
  descricao?: string;
}

interface Boletim {
  _id: string;
  titulo: string;
  conteudo: string;
  tipo: string;
  periodo: string;
  publicado_em?: string;
}

interface MensagemItem {
  _id: string;
  assunto: string;
  texto: string;
  status: string;
  resposta?: string;
  respondida_em?: string;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  normal:  { label: 'Normal',  bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  atencao: { label: 'Atenção', bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  critico: { label: 'Crítico', bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
};

function formatDateBR(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ── Componentes menores ───────────────────────────────────────────────────────

function CardSkeleton() {
  return <div className="bg-white rounded-3xl shadow p-6 animate-pulse h-32" />;
}

function SectionTitle({ children, badge }: { children: React.ReactNode; badge?: number }) {
  return (
    <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
      {children}
      {badge != null && badge > 0 && (
        <span className="bg-rose-500 text-white text-xs font-bold rounded-full px-2 py-0.5 leading-tight">
          {badge}
        </span>
      )}
    </h2>
  );
}

function LightboxModal({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <img
        src={src}
        alt="Foto ampliada"
        className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-3xl font-bold leading-none p-2"
        aria-label="Fechar"
      >
        &times;
      </button>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function FamiliaPage({
  nomeLogado,
  idResidente,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [perfil,   setPerfil]   = useState<Perfil | null>(null);
  const [vitais,   setVitais]   = useState<Vital[] | null>(null);
  const [eventos,  setEventos]  = useState<Evento[] | null>(null);
  const [fotos,    setFotos]    = useState<Foto[] | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const [comunicados,        setComunicados]        = useState<ComunicadoItem[] | null>(null);
  const [visitas,            setVisitas]            = useState<Visita[] | null>(null);
  const [boletins,           setBoletins]           = useState<Boletim[] | null>(null);
  const [mensagens,          setMensagens]          = useState<MensagemItem[] | null>(null);
  const [expandedComunicado, setExpandedComunicado] = useState<string | null>(null);
  const [msgForm,            setMsgForm]            = useState({ assunto: '', texto: '' });
  const [msgSending,         setMsgSending]         = useState(false);

  const base = `/api/Controller/C_familiaPortal?residente_id=${idResidente}`;

  useEffect(() => {
    Promise.all([
      fetch(`${base}&type=perfil`).then(r => r.json()).then(d => setPerfil(d)),
      fetch(`${base}&type=vitals`).then(r => r.json()).then(d => setVitais(d.vitais ?? [])),
      fetch(`${base}&type=eventos`).then(r => r.json()).then(d => setEventos(d.eventos ?? [])),
      fetch(`${base}&type=fotos`).then(r => r.json()).then(d => setFotos(d.fotos ?? [])),
      fetch(`${base}&type=comunicados`).then(r => r.json()).then(d => setComunicados(d.comunicados ?? [])),
      fetch(`${base}&type=visitas`).then(r => r.json()).then(d => setVisitas(d.visitas ?? [])),
      fetch(`${base}&type=boletins`).then(r => r.json()).then(d => setBoletins(d.boletins ?? [])),
      fetch(`${base}&type=mensagens`).then(r => r.json()).then(d => setMensagens(d.mensagens ?? [])),
    ]).catch(console.error);
  }, [idResidente]);

  async function handleLogout() {
    setLogoutLoading(true);
    await fetch('/api/familia/auth', { method: 'DELETE' });
    window.location.href = '/familia/login';
  }

  async function handleExpandComunicado(id: string, jaLido: boolean) {
    setExpandedComunicado(prev => (prev === id ? null : id));
    if (!jaLido) {
      await fetch(`${base}&type=marcarLido`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comunicado_id: id }),
      });
      setComunicados(prev =>
        prev ? prev.map(c => (c._id === id ? { ...c, lido: true } : c)) : prev
      );
    }
  }

  async function handleNovaMensagem(e: React.FormEvent) {
    e.preventDefault();
    if (!msgForm.assunto.trim() || !msgForm.texto.trim()) return;
    setMsgSending(true);
    const res = await fetch(`${base}&type=novaMensagem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msgForm),
    });
    if (res.ok) {
      setMsgForm({ assunto: '', texto: '' });
      const updated = await fetch(`${base}&type=mensagens`).then(r => r.json());
      setMensagens(updated.mensagens ?? []);
    }
    setMsgSending(false);
  }

  const naoLidos = comunicados ? comunicados.filter(c => !c.lido).length : 0;
  const primeiroNome = nomeLogado.split(' ')[0];

  return (
    <div className="min-h-screen bg-rose-50">

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src={LogoLar} alt="Lar Felizidade" className="h-10 w-auto" />
            <span className="text-base font-semibold text-gray-700 hidden sm:inline">Portal da Família</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-base text-gray-500 hidden sm:inline">Olá, {primeiroNome}</span>
            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-base font-semibold rounded-xl transition-colors"
            >
              {logoutLoading ? 'Saindo...' : 'Sair'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8 pb-16">

        {/* Saudação mobile */}
        <p className="text-lg text-gray-500 sm:hidden">Olá, {primeiroNome}</p>

        {/* ── Perfil ──────────────────────────────────────────────────────── */}
        <section>
          <SectionTitle>Seu familiar</SectionTitle>
          {!perfil ? <CardSkeleton /> : (
            <div className="bg-white rounded-3xl shadow p-6 flex items-center gap-6">
              <div className="shrink-0">
                {perfil.foto ? (
                  <img
                    src={perfil.foto}
                    alt={perfil.nome}
                    className="w-24 h-24 rounded-full object-cover border-4 border-rose-100"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-rose-100 flex items-center justify-center text-rose-400 text-4xl font-bold select-none">
                    {perfil.nome.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-2xl font-bold text-gray-800 leading-tight">{perfil.nome}</h3>
                {perfil.apelido && (
                  <p className="text-lg text-gray-500 mt-0.5">&quot;{perfil.apelido}&quot;</p>
                )}
                {perfil.idade !== undefined && perfil.idade !== null && (
                  <p className="text-base text-gray-400 mt-1">{perfil.idade} anos</p>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ── Saúde ───────────────────────────────────────────────────────── */}
        <section>
          <SectionTitle>Como está a saúde</SectionTitle>
          {!vitais ? <CardSkeleton /> : vitais.length === 0 ? (
            <div className="bg-white rounded-3xl shadow p-6 text-center text-gray-400 text-lg">
              Nenhum registro de saúde disponível ainda.
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow p-6 space-y-3">
              {vitais.map(v => {
                const cfg = STATUS_CONFIG[v.status];
                return (
                  <div
                    key={v.code}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl ${cfg.bg}`}
                  >
                    <span className="text-lg font-medium text-gray-700">{v.label}</span>
                    <span className={`flex items-center gap-2 text-lg font-bold ${cfg.text}`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
              <p className="text-sm text-gray-400 pt-1 text-center">
                Atualizado com base nas últimas medições registradas pela equipe.
              </p>
            </div>
          )}
        </section>

        {/* ── Comunicados ─────────────────────────────────────────────────── */}
        <section>
          <SectionTitle badge={naoLidos}>Comunicados</SectionTitle>
          {!comunicados ? <CardSkeleton /> : comunicados.length === 0 ? (
            <div className="bg-white rounded-3xl shadow p-6 text-center text-gray-400 text-lg">
              Nenhum comunicado publicado ainda.
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow divide-y divide-gray-100">
              {comunicados.map(c => (
                <div key={c._id}>
                  <button
                    onClick={() => handleExpandComunicado(c._id, c.lido)}
                    className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${c.lido ? 'bg-green-400' : 'bg-rose-500'}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-base leading-snug ${c.lido ? 'text-gray-600 font-normal' : 'text-gray-800 font-semibold'}`}>
                        {c.title}
                      </p>
                      <p className="text-sm text-gray-400 mt-0.5">{formatDateBR(c.createdAt)}</p>
                    </div>
                    <span className="text-gray-300 text-lg shrink-0 mt-0.5">
                      {expandedComunicado === c._id ? '▲' : '▼'}
                    </span>
                  </button>
                  {expandedComunicado === c._id && (
                    <div className="px-5 pb-4 text-base text-gray-600 whitespace-pre-line bg-gray-50">
                      {c.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Próximas visitas ─────────────────────────────────────────────── */}
        <section>
          <SectionTitle>Próximas visitas</SectionTitle>
          {!visitas ? <CardSkeleton /> : visitas.length === 0 ? (
            <div className="bg-white rounded-3xl shadow p-6 text-center text-gray-400 text-lg">
              Nenhuma visita agendada.
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow p-6 space-y-3">
              {visitas.map(v => (
                <div key={v._id} className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-2xl">🗓️</span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-800">
                      {v.data.split('-').reverse().join('/')} às {v.horario}
                    </p>
                    {v.descricao && <p className="text-base text-gray-400">{v.descricao}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Datas Importantes ───────────────────────────────────────────── */}
        <section>
          <SectionTitle>Próximas datas e agendamentos</SectionTitle>
          {!eventos ? <CardSkeleton /> : eventos.length === 0 ? (
            <div className="bg-white rounded-3xl shadow p-6 text-center text-gray-400 text-lg">
              Nenhuma data próxima cadastrada.
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow p-6 space-y-3">
              {eventos.map((ev, i) => (
                <div key={i} className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                    <span className="text-2xl">📅</span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-800">{ev.titulo}</p>
                    <p className="text-base text-gray-400">
                      {ev.data}
                      {ev.horario ? ` às ${ev.horario}` : ''}
                    </p>
                    {ev.observacao && <p className="text-sm text-gray-400">{ev.observacao}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Boletins ────────────────────────────────────────────────────── */}
        <section>
          <SectionTitle>Boletins da equipe</SectionTitle>
          {!boletins ? <CardSkeleton /> : boletins.length === 0 ? (
            <div className="bg-white rounded-3xl shadow p-6 text-center text-gray-400 text-lg">
              Nenhum boletim publicado ainda.
            </div>
          ) : (
            <div className="space-y-4">
              {boletins.map(b => (
                <div key={b._id} className="bg-white rounded-3xl shadow p-6">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="text-lg font-bold text-gray-800">{b.titulo}</p>
                      <p className="text-sm text-gray-400">{b.periodo}</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-semibold shrink-0">
                      {b.tipo === 'semanal' ? 'Semanal' : 'Mensal'}
                    </span>
                  </div>
                  <p className="text-base text-gray-600 whitespace-pre-line">{b.conteudo}</p>
                  {b.publicado_em && (
                    <p className="text-xs text-gray-300 mt-3 text-right">
                      Publicado em {formatDateBR(b.publicado_em)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Fotos ───────────────────────────────────────────────────────── */}
        <section>
          <SectionTitle>Fotos recentes</SectionTitle>
          {!fotos ? <CardSkeleton /> : fotos.length === 0 ? (
            <div className="bg-white rounded-3xl shadow p-6 text-center text-gray-400 text-lg">
              Nenhuma foto disponível por enquanto.
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow p-6">
              <div className="grid grid-cols-3 gap-3">
                {fotos.map(f => (
                  <button
                    key={f._id}
                    onClick={() => setLightbox(f.url)}
                    className="aspect-square rounded-2xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-rose-400"
                  >
                    <img
                      src={f.url}
                      alt="Foto do residente"
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── Mensagens ───────────────────────────────────────────────────── */}
        <section>
          <SectionTitle>Fale com a equipe</SectionTitle>
          <div className="bg-white rounded-3xl shadow p-6 space-y-5">
            <form onSubmit={handleNovaMensagem} className="space-y-3">
              <input
                type="text"
                placeholder="Assunto"
                value={msgForm.assunto}
                onChange={e => setMsgForm(prev => ({ ...prev, assunto: e.target.value }))}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-rose-300"
                maxLength={100}
              />
              <textarea
                placeholder="Sua mensagem..."
                value={msgForm.texto}
                onChange={e => setMsgForm(prev => ({ ...prev, texto: e.target.value }))}
                rows={3}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                maxLength={1000}
              />
              <button
                type="submit"
                disabled={msgSending || !msgForm.assunto.trim() || !msgForm.texto.trim()}
                className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-semibold py-3 rounded-2xl transition-colors text-base"
              >
                {msgSending ? 'Enviando...' : 'Enviar mensagem'}
              </button>
            </form>

            {mensagens && mensagens.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <p className="text-sm text-gray-400 font-semibold uppercase tracking-wide">Mensagens enviadas</p>
                {mensagens.map(m => (
                  <div key={m._id} className="rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 flex items-center justify-between gap-2">
                      <p className="text-base font-semibold text-gray-700">{m.assunto}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                        m.status === 'respondida' ? 'bg-green-100 text-green-600' :
                        m.status === 'lida'       ? 'bg-blue-100 text-blue-500'  :
                                                    'bg-yellow-100 text-yellow-600'
                      }`}>
                        {m.status === 'respondida' ? 'Respondida' : m.status === 'lida' ? 'Lida' : 'Enviada'}
                      </span>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-base text-gray-600 whitespace-pre-line">{m.texto}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDateBR(m.createdAt)}</p>
                    </div>
                    {m.resposta && (
                      <div className="px-4 py-3 bg-green-50 border-t border-green-100">
                        <p className="text-xs font-semibold text-green-600 mb-1">Resposta da equipe</p>
                        <p className="text-base text-gray-700 whitespace-pre-line">{m.resposta}</p>
                        {m.respondida_em && (
                          <p className="text-xs text-gray-400 mt-1">{formatDateBR(m.respondida_em)}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </main>

      {lightbox && <LightboxModal src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}
