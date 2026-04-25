import React, { useRef, useState, KeyboardEvent, ChangeEvent } from 'react';
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

const PIN_LENGTH = 6;

export default function FamiliaLoginPage() {
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function focusAt(i: number) {
    inputs.current[i]?.focus();
  }

  function handleChange(i: number, e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    setError('');
    if (val && i < PIN_LENGTH - 1) focusAt(i + 1);
  }

  function handleKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      const next = [...digits];
      next[i - 1] = '';
      setDigits(next);
      focusAt(i - 1);
    }
    if (e.key === 'ArrowLeft' && i > 0) focusAt(i - 1);
    if (e.key === 'ArrowRight' && i < PIN_LENGTH - 1) focusAt(i + 1);
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(PIN_LENGTH).fill('');
    pasted.split('').forEach((c, idx) => { next[idx] = c; });
    setDigits(next);
    focusAt(Math.min(pasted.length, PIN_LENGTH - 1));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pin = digits.join('');
    if (pin.length !== PIN_LENGTH) {
      setError('Digite todos os 6 dígitos do seu PIN.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/familia/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.message || 'PIN incorreto. Tente novamente.');
        setDigits(Array(PIN_LENGTH).fill(''));
        focusAt(0);
        return;
      }
      window.location.href = '/familia';
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const allFilled = digits.every(d => d !== '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex flex-col items-center justify-center px-4 py-12">

      {/* Logo */}
      <div className="mb-8 text-center">
        <Image
          src={LogoLar}
          alt="Lar Felizidade"
          className="mx-auto h-24 w-auto drop-shadow-sm mb-4"
        />
        <h1 className="text-3xl font-bold text-gray-800">Portal da Família</h1>
        <p className="mt-2 text-lg text-gray-500">Lar Felizidade</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-sm px-8 py-10">
        <p className="text-center text-xl font-semibold text-gray-700 mb-2">
          Digite seu PIN
        </p>
        <p className="text-center text-base text-gray-400 mb-8">
          Código de 6 números fornecido pela equipe
        </p>

        <form onSubmit={handleSubmit}>
          {/* Células do PIN */}
          <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={d}
                onChange={e => handleChange(i, e)}
                onKeyDown={e => handleKeyDown(i, e)}
                onFocus={e => e.target.select()}
                className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all outline-none
                  ${d ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-gray-300 bg-gray-50 text-gray-700'}
                  focus:border-rose-500 focus:bg-rose-50`}
                autoFocus={i === 0}
                disabled={loading}
                aria-label={`Dígito ${i + 1}`}
              />
            ))}
          </div>

          {/* Erro */}
          {error && (
            <p className="text-center text-base text-red-500 mb-4 font-medium">{error}</p>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={!allFilled || loading}
            className="w-full py-4 bg-rose-500 hover:bg-rose-600 disabled:bg-gray-300 text-white text-lg font-bold rounded-2xl transition-colors shadow-sm"
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
