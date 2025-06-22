import { useState } from "react";
import LogoLar from '../../../public/images/lar felizidade logo transparente.png'
import Image from "next/image";
import { toast } from "react-toastify";
import axios from "axios";
import { useRouter } from "next/router";
import CheckToken from "@/components/CheckToken";
import { notifyError, notifySuccess } from "@/utils/Functions";
import GruposUsuario_getGruposUsuario from "@/actions/GruposUsuario_getGruposUsuario";

const LoginPage = () => {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (senha.length < 6) { notifyError('A senha deve conter no mínimo 6 caracteres') }
    else if (!senha) { notifyError('Digite uma senha!') }
    else if (!usuario) { notifyError('Digite um usuário') }
    else {
      try {
        const response = await axios.post('/api/Controller/LoginController', { usuario, senha });
        const { token, userInfo } = await response.data;
        const grupos = await GruposUsuario_getGruposUsuario(userInfo.id)
        const mapGroupsId = grupos.map((grupo: any) => grupo.id_grupo)
        localStorage.setItem('token', token);
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        localStorage.setItem('sopurg', JSON.stringify(mapGroupsId));
        if (response.status === 200) {
          router.push('/portal').then(() => {
            notifySuccess('Logado com sucesso!')
          })
        }
      } catch (error) {
        notifyError('Falha ao realizar o login, contate um administrador')
      }
    }
  };

  return (
    <div className="min-h-screen bg-purple-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Image className="mx-auto h-28 w-auto" alt="Lar Felizidade Logo" src={LogoLar} />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Logar na sua conta</h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="usuario" className="block text-sm font-medium text-gray-700">Usuario</label>
              <div className="mt-1">
                <input id="login_usuario" name="usuario" type="text" required value={usuario} onChange={(e) => setUsuario(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" />
              </div>
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700">Senha</label>
              <div className="mt-1">
                <input id="login_senha" name="senha" type="password" required value={senha} onChange={(e) => setSenha(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" />
              </div>
            </div>

            {/* <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Forgot your senha?
                </a>
              </div>
            </div> */}

            <div className="text-center">
              <button type="submit" className="inline-flex items-center justify-center px-6 py-3 border 
              border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 
              hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Entrar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage