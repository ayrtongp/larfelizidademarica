import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import LogoLar from '../../../public/images/lar felizidade logo transparente.png';

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const { token } = router.query;

  const [tokenValido, setTokenValido] = useState<boolean | null>(null);
  const [tokenErro, setTokenErro] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`/api/Controller/C_resetSenha?type=validar&token=${token}`)
      .then((r) => r.json())
      .then((json) => {
        setTokenValido(json.valid);
        if (!json.valid) setTokenErro(json.message || 'Link inválido.');
      })
      .catch(() => { setTokenValido(false); setTokenErro('Erro ao validar link.'); });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (novaSenha.length < 6) return setErro('A senha deve ter no mínimo 6 caracteres.');
    if (novaSenha !== confirmar) return setErro('As senhas não coincidem.');

    setLoading(true);
    try {
      const res = await fetch('/api/Controller/C_resetSenha?type=redefinir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, novaSenha }),
      });
      const json = await res.json();
      if (!res.ok) return setErro(json.message || 'Erro ao redefinir senha.');
      setSucesso(true);
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
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-800">Redefinir senha</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-lg sm:rounded-2xl border border-gray-100">

          {tokenValido === null && (
            <p className="text-sm text-gray-400 text-center">Verificando link...</p>
          )}

          {tokenValido === false && (
            <div className="text-center space-y-4">
              <p className="text-sm text-red-600 font-medium">{tokenErro}</p>
              <Link href="/portal/recuperar-acesso" className="text-sm text-indigo-600 hover:underline">
                Solicitar novo link
              </Link>
            </div>
          )}

          {tokenValido === true && sucesso && (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-700 font-medium">Senha redefinida com sucesso!</p>
              <Link href="/portal/login" className="block text-sm text-indigo-600 hover:underline">
                Ir para o login
              </Link>
            </div>
          )}

          {tokenValido === true && !sucesso && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nova senha</label>
                <div className="relative">
                  <input
                    type={showSenha ? 'text' : 'password'}
                    required
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button type="button" onClick={() => setShowSenha((v) => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600" tabIndex={-1}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {showSenha
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                      }
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirmar senha</label>
                <input
                  type={showSenha ? 'text' : 'password'}
                  required
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                  placeholder="Repita a nova senha"
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
                {loading ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
