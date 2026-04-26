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

  // Busca vínculos ativos do familiar para descobrir seus residentes
  const { db } = await connect();
  const vinculos = await db.collection('familiar_residente')
    .find({ usuario_id: session.userId, ativo: true })
    .toArray();

  if (vinculos.length === 0) {
    // Conta existe mas não tem nenhum residente vinculado
    return { redirect: { destination: '/familia/sem-acesso', permanent: false } };
  }

  // Por enquanto usa o primeiro residente — futuramente UI de seleção
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
}

interface Foto {
  _id: string;
  url: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  normal:  { label: 'Normal',  bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  atencao: { label: 'Atenção', bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  critico: { label: 'Crítico', bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
};

// ── Componentes menores ───────────────────────────────────────────────────────

function CardSkeleton() {
  return <div className="bg-white rounded-3xl shadow p-6 animate-pulse h-32" />;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold text-gray-700 mb-4">{children}</h2>;
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

  useEffect(() => {
    const base = `/api/Controller/C_familiaPortal?residente_id=${idResidente}`;
    Promise.all([
      fetch(`${base}&type=perfil`).then(r => r.json()).then(d => setPerfil(d)),
      fetch(`${base}&type=vitals`).then(r => r.json()).then(d => setVitais(d.vitais ?? [])),
      fetch(`${base}&type=eventos`).then(r => r.json()).then(d => setEventos(d.eventos ?? [])),
      fetch(`${base}&type=fotos`).then(r => r.json()).then(d => setFotos(d.fotos ?? [])),
    ]).catch(console.error);
  }, [idResidente]);

  async function handleLogout() {
    setLogoutLoading(true);
    await fetch('/api/familia/auth', { method: 'DELETE' });
    window.location.href = '/familia/login';
  }

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

        {/* ── Card: Perfil ────────────────────────────────────────────────── */}
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

        {/* ── Card: Saúde ──────────────────────────────────────────────────── */}
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

        {/* ── Card: Datas Importantes ──────────────────────────────────────── */}
        <section>
          <SectionTitle>Próximas datas</SectionTitle>
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
                    <p className="text-base text-gray-400">{ev.data}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Card: Fotos ──────────────────────────────────────────────────── */}
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

      </main>

      {lightbox && <LightboxModal src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}
