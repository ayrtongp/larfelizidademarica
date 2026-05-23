import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import LogoLar from '../../../public/images/lar felizidade logo transparente.png';

export default function RecuperarAcessoPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const res = await fetch('/api/Controller/C_resetSenha?type=solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const json = await res.json();
        setErro(json.message || 'Erro ao enviar email.');
        return;
      }
      setEnviado(true);
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Image className="mx-auto h-28 w-auto drop-shadow-sm" alt="Lar Felizidade Logo" src={LogoLar} />
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-800">Recuperar acesso</h2>
        <p className="mt-1 text-center text-sm text-gray-500">
          Informe o email cadastrado para receber seu usuário e um link de redefinição de senha.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-lg sm:rounded-2xl border border-gray-100">

          {enviado ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-700 font-medium">Email enviado!</p>
              <p className="text-sm text-gray-500">
                Se o email <strong>{email}</strong> estiver cadastrado, você receberá as instruções em breve. Verifique também a caixa de spam.
              </p>
              <Link href="/portal/login" className="block text-sm text-indigo-600 hover:underline mt-2">
                Voltar para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email cadastrado
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                  placeholder="seu@email.com"
                />
              </div>

              {erro && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar instruções'}
              </button>

              <p className="text-center text-sm text-gray-500">
                Lembrou?{' '}
                <Link href="/portal/login" className="text-indigo-600 hover:underline font-medium">
                  Voltar para o login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
