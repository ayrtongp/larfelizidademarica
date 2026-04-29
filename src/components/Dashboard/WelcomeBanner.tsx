import React, { useEffect, useMemo, useState } from 'react';
import { getUserDetails, saudacao } from '../../utils/Functions';
import { Versiculos } from '../../utils/versiculos';
import { FaCalendarAlt, FaQuoteLeft } from 'react-icons/fa';

interface MensagemInspiradora {
  verse: string;
  text: string;
}

function randomVersiculo(): MensagemInspiradora {
  const randomNumber = Math.floor(Math.random() * Versiculos.length);
  return Versiculos[randomNumber] as MensagemInspiradora;
}

const WelcomeBanner = () => {
  const [nome, setNome] = useState('');
  const [mensagem, setMensagem] = useState<MensagemInspiradora>(() => randomVersiculo());

  useEffect(() => {
    setMensagem(randomVersiculo());

    const userInfo = getUserDetails();
    if (userInfo && typeof userInfo === 'object' && 'nome' in userInfo) {
      setNome(String(userInfo.nome || '').trim());
    }
  }, []);

  const primeiroNome = nome.split(' ')[0] || 'equipe';
  const dataHoje = useMemo(() => (
    new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    })
  ), []);

  return (
    <section className="relative mb-6 overflow-hidden rounded-[32px] border border-sky-200/70 bg-gradient-to-br from-sky-100 via-white to-amber-50 p-6 shadow-sm sm:p-7">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_58%)]" />
      <div className="pointer-events-none absolute -left-12 top-10 h-32 w-32 rounded-full bg-white/50 blur-2xl" />

      <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1.2fr),360px] xl:items-end">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700 shadow-sm">
              Central do portal
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white shadow-sm">
              <FaCalendarAlt size={10} />
              {dataHoje}
            </span>
          </div>

          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {saudacao()}, {primeiroNome}.
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Aqui fica a leitura principal do dia: agenda da casa, avisos recentes e os atalhos que realmente destravam a rotina.
          </p>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Frase do dia
          </p>

          <div className="mt-4 flex gap-3">
            <div className="mt-1 rounded-2xl bg-amber-100 p-2 text-amber-700">
              <FaQuoteLeft size={14} />
            </div>

            <div>
              <p className="text-sm leading-6 text-slate-700 sm:text-[15px]">
                {mensagem.text}
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {mensagem.verse}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WelcomeBanner;
