import { useState } from "react";
import LogoLar from '../../../public/images/lar felizidade logo transparente.png'
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/router";
import { notifyError, notifySuccess } from "@/utils/Functions";
import GruposUsuario_getGruposUsuario from "@/actions/GruposUsuario_getGruposUsuario";

const LoginPage = () => {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometriaLoading, setBiometriaLoading] = useState(false);
  const router = useRouter();

  const finalizarLogin = async (token: string, userInfo: any) => {
    const grupos = await GruposUsuario_getGruposUsuario(userInfo.id);
    const mapGroupsId = grupos.map((grupo: any) => grupo.id_grupo);
    localStorage.setItem('token', token);
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    localStorage.setItem('sopurg', JSON.stringify(mapGroupsId));
    router.push('/portal').then(() => {
      notifySuccess('Logado com sucesso!');
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return notifyError('Digite um usuário');
    if (senha.length < 6) return notifyError('A senha deve conter no mínimo 6 caracteres');

    try {
      setLoading(true);
      const response = await axios.post('/api/Controller/LoginController', { usuario, senha });
      const { token, userInfo } = response.data;
      await finalizarLogin(token, userInfo);
    } catch {
      notifyError('Falha ao realizar o login, contate um administrador');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometria = async () => {
    if (!usuario) return notifyError('Digite o nome de usuário antes de usar biometria');

    try {
      setBiometriaLoading(true);

      // 1. Get authentication options
      const initRes = await fetch('/api/Controller/C_biometria?tipo=autenticar-inicio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario }),
      });
      if (!initRes.ok) {
        const err = await initRes.json();
        throw new Error(err.message);
      }
      const { options, userId } = await initRes.json();

      // 2. Trigger browser biometric prompt
      const { startAuthentication } = await import('@simplewebauthn/browser');
      const authResponse = await startAuthentication({ optionsJSON: options });

      // 3. Verify with server and get token
      const finalRes = await fetch('/api/Controller/C_biometria?tipo=autenticar-finalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, response: authResponse }),
      });
      if (!finalRes.ok) {
        const err = await finalRes.json();
        throw new Error(err.message);
      }
      const { token, userInfo } = await finalRes.json();
      await finalizarLogin(token, userInfo);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        notifyError('Biometria cancelada ou não autorizada.');
      } else {
        notifyError(err.message || 'Falha na autenticação biométrica');
      }
    } finally {
      setBiometriaLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Image className="mx-auto h-28 w-auto drop-shadow-sm" alt="Lar Felizidade Logo" src={LogoLar} />
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-800">Bem-vindo de volta</h2>
        <p className="mt-1 text-center text-sm text-gray-500">Acesse o portal do Lar Felizidade</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-lg sm:rounded-2xl border border-gray-100">
          <form className="space-y-5" onSubmit={handleSubmit}>

            {/* Usuário */}
            <div>
              <label htmlFor="login_usuario" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Usuário
              </label>
              <input
                id="login_usuario"
                name="usuario"
                type="text"
                required
                autoComplete="username"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                placeholder="Digite seu usuário"
              />
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="login_senha" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  id="login_senha"
                  name="senha"
                  type={showSenha ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showSenha ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Entrar */}
            <button
              type="submit"
              disabled={loading || biometriaLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  Entrando...
                </>
              ) : 'Entrar'}
            </button>

            {/* Divisor */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-gray-400">ou</span>
              </div>
            </div>

            {/* Biometria */}
            <button
              type="button"
              onClick={handleBiometria}
              disabled={loading || biometriaLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 shadow-sm transition disabled:opacity-50"
            >
              {biometriaLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  Aguardando biometria...
                </>
              ) : (
                <>
                  <span className="text-base">🔐</span>
                  Entrar com biometria
                </>
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
