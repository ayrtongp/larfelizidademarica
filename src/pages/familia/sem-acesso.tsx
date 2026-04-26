import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import LogoLar from '../../../public/images/lar felizidade logo transparente.png';

export default function SemAcessoPage() {
  return (
    <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center px-4 text-center">
      <Image src={LogoLar} alt="Lar Felizidade" className="h-20 w-auto mb-6 drop-shadow-sm" />
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Sem acesso</h1>
      <p className="text-gray-500 text-base max-w-sm mb-6">
        Sua conta não possui nenhum residente vinculado. Entre em contato com a equipe do Lar Felizidade para solicitar o acesso.
      </p>
      <Link
        href="/familia/login"
        className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-2xl transition-colors"
      >
        Voltar ao login
      </Link>
    </div>
  );
}
