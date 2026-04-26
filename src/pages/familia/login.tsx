import React, { useState } from 'react';
import type { GetServerSidePropsContext } from 'next';
import Image from 'next/image';
import LogoLar from '../../../public/images/lar felizidade logo transparente.png';
import { verifyFamiliaSession } from '@/utils/familiaSession';

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const session = verifyFamiliaSession(ctx.req as any);
  if (session) {
    return { redirect: { destination: '/familia', permanent: false } };
  }
  return { props: {} };
}

export default function FamiliaLoginPage() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!usuario.trim() || !senha) {
      setError('Preencha usuário e senha.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/familia/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: usuario.trim(), senha }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.message || 'Usuário ou senha incorretos.');
        return;
      }
      window.location.href = '/familia';
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const inputCls = 'w-full border-2 border-gray-200 rounded-2xl px-4 py-4 text-base focus:outline-none focus:border-rose-400 transition bg-gray-50 focus:bg-white';

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex flex-col items-center justify-center px-4 py-12">

      {/* Logo */}
      <div className="mb-8 text-center">
        <Image src={LogoLar} alt="Lar Felizidade" className="mx-auto h-24 w-auto drop-shadow-sm mb-4" />
        <h1 className="text-3xl font-bold text-gray-800">Portal da Família</h1>
        <p className="mt-2 text-lg text-gray-500">Lar Felizidade</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-sm px-8 py-10">
        <p className="text-center text-xl font-semibold text-gray-700 mb-1">Bem-vindo(a)</p>
        <p className="text-center text-base text-gray-400 mb-8">Entre com seus dados de acesso</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Usuário</label>
            <input
              type="text"
              value={usuario}
              onChange={e => { setUsuario(e.target.value); setError(''); }}
              placeholder="seu.usuario"
              className={inputCls}
              autoFocus
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Senha</label>
            <div className="relative">
              <input
                type={showSenha ? 'text' : 'password'}
                value={senha}
                onChange={e => { setSenha(e.target.value); setError(''); }}
                placeholder="••••••••"
                className={inputCls + ' pr-12'}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowSenha(v => !v)}
                className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showSenha ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-center text-sm text-red-500 font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-rose-500 hover:bg-rose-600 disabled:bg-gray-300 text-white text-lg font-bold rounded-2xl transition-colors shadow-sm mt-2"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Precisa de ajuda? Entre em contato com a equipe do Lar Felizidade.
        </p>
      </div>
    </div>
  );
}
