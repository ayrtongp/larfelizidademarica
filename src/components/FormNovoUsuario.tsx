import { notifyError, notifySuccess } from '@/utils/Functions'
import { getUserID } from '@/utils/Login'
import React, { useEffect, useState } from 'react'

const FormNovoUsuario = () => {
  const [categorias, setCategorias] = useState({ idosos: false, sinaisVitais: false, livroOcorrencias: false, insumos: false, residentes: false})
  const [formData, setFormData] = useState({
    nome: '', sobrenome: '', usuario: '', dataNascimento: '', senha: '',
    repetirSenha: '', funcao: '', registro: '', email: (Math.random() * 1000 + 1).toFixed(2), admin: 'N', ativo: 'N'
  })
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAtivo, setIsAtivo] = useState(false)

  const handleChangeForm = (event: any) => {
    setFormData((prevState) => ({
      ...prevState,
      [event.target.name]: event.target.value
    }));
  }

  const handleChangeCheckbox = (event: any) => {
    setCategorias({ ...categorias, [event.target.name]: event.target.checked, })
  }

  const handleChangeIsAdmin = (event: any) => {
    setIsAdmin(!isAdmin)
    setFormData((prevState) => ({ ...prevState, admin: event.target.checked ? 'S' : 'N' }));
  }

  const handleChangeIsAtivo = (event: any) => {
    setIsAtivo(!isAtivo)
    setFormData((prevState) => ({ ...prevState, ativo: event.target.checked ? 'S' : 'N' }));
  }

  const handleSubmit = async (event: any) => {
    event.preventDefault()

    if (formData.senha === formData.repetirSenha) {
      const res = await fetch("/api/Controller/UsuarioController", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        notifySuccess('Usuário Cadastrado')

        const userId = await data.userId
        const res2 = await fetch(`/api/Controller/CategoriaPermissaoController?tipo=register&tipo_permissao=portal_servicos&id=${userId}`, {
          method: "POST",
          body: JSON.stringify(categorias),
        });
        if (res2.ok) {
          notifySuccess('Categorias Cadastradas')

        }
      }
      else if (res.status === 400) {
        const { message } = await res.json()
        notifyError(message)
      }
    }
  };

  return (
    <div className="border rounded-sm p-1">
      <h2 className="text-2xl text-center font-bold mb-4">Novo Usuário</h2>
      <form onSubmit={handleSubmit} className="">
        
        {/* Campos de Texto */}
        <div className='grid grid-cols-1 sm:grid-cols-2'>
          <div className="col-span-1 mx-2">
            <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="nome">Nome</label>
            <input onChange={handleChangeForm} className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white" name="nome" type="text" placeholder="Insira o nome" />
          </div>
          <div className="col-span-1 mx-2">
            <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="sobrenome">Sobrenome</label>
            <input onChange={handleChangeForm} className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white" name="sobrenome" type="text" placeholder="Insira o sobrenome" />
          </div>
          <div className="col-span-1 mx-2">
            <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="funcao">Função</label>
            <input onChange={handleChangeForm} className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white" name="funcao" type="text" placeholder="Insira o cargo" />
          </div>
          <div className="col-span-1 mx-2">
            <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="registro">Núm. Registro</label>
            <input onChange={handleChangeForm} className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white" name="registro" type="text" placeholder="Núm. registro" />
          </div>
          <div className="col-span-1 mx-2">
            <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="usuario">Usuário</label>
            <input onChange={handleChangeForm} className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white" name="usuario" type="text" placeholder="Insira o username" />
          </div>
          <div className="col-span-1 mx-2">
            <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="dataNascimento">Data de Nascimento</label>
            <input onChange={handleChangeForm} className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white" name="dataNascimento" type="text" placeholder="dd/mm/aaaa" />
          </div>
          <div className="col-span-1 mx-2">
            <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="senha">Senha</label>
            <input onChange={handleChangeForm} className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white" name="senha" type="password" placeholder="Insira a senha" />
          </div>
          <div className="col-span-1 mx-2">
            <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="repetirSenha">Repita a senha</label>
            <input onChange={handleChangeForm} className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white" name="repetirSenha" type="password" placeholder="Confirme a senha" />
          </div>
        </div>

        <div className="w-full md:w-1/2 px-3 mb-2 md:mb-0">
          <span className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">Permissão Categorias</span>
          <div className="mt-2">
            <label className="ml-1 inline-flex items-center">
              <input type="checkbox" name='idosos' onChange={handleChangeCheckbox} checked={categorias.idosos} className="form-checkbox h-5 w-5 text-gray-600" />
              <span className="ml-2 text-gray-700">Idosos</span>
            </label>
            <label className="ml-1 inline-flex items-center">
              <input type="checkbox" name='residentes' onChange={handleChangeCheckbox} checked={categorias.residentes} className="form-checkbox h-5 w-5 text-gray-600" />
              <span className="ml-2 text-gray-700">Residentes</span>
            </label>
            <label className="ml-1 inline-flex items-center">
              <input type="checkbox" name='sinaisVitais' onChange={handleChangeCheckbox} checked={categorias.sinaisVitais} className="form-checkbox h-5 w-5 text-gray-600" />
              <span className="ml-2 text-gray-700">Sinais Vitais</span>
            </label>
            <label className="ml-1 inline-flex items-center">
              <input type="checkbox" name='livroOcorrencias' onChange={handleChangeCheckbox} checked={categorias.livroOcorrencias} className="form-checkbox h-5 w-5 text-gray-600" />
              <span className="ml-2 text-gray-700">Livro de Ocorrências</span>
            </label>
            <label className="ml-1 inline-flex items-center">
              <input type="checkbox" name='insumos' onChange={handleChangeCheckbox} checked={categorias.insumos} className="form-checkbox h-5 w-5 text-gray-600" />
              <span className="ml-2 text-gray-700">Insumos</span>
            </label>
          </div>
        </div>

        <div className="mt-3 w-full md:w-1/2 px-3 mb-2 md:mb-0">
          <span className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">Usuário Admin</span>
          <div className="mt-2">
            <label className="inline-flex items-center">
              <input type="radio" className="form-radio h-5 w-5 text-gray-600" name="admin" checked={isAdmin} onChange={handleChangeIsAdmin} value="sim" />
              <span className="ml-2 text-gray-700">Sim</span>
            </label>
            <label className="inline-flex items-center ml-6">
              <input type="radio" className="form-radio h-5 w-5 text-gray-600" name="admin" checked={!isAdmin} value="não" onChange={handleChangeIsAdmin} />
              <span className="ml-2 text-gray-700">Não</span>
            </label>
          </div>
        </div>

        <div className="mt-3 w-full md:w-1/2 px-3 mb-2 md:mb-0">
          <span className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">Usuário Ativo</span>
          <div className="mt-2">
            <label className="inline-flex items-center">
              <input type="radio" className="form-radio h-5 w-5 text-gray-600" name="ativo" checked={isAtivo} onChange={handleChangeIsAtivo} value="sim" />
              <span className="ml-2 text-gray-700">Sim</span>
            </label>
            <label className="inline-flex items-center ml-6">
              <input type="radio" className="form-radio h-5 w-5 text-gray-600" name="ativo" checked={!isAtivo} value="não" onChange={handleChangeIsAtivo} />
              <span className="ml-2 text-gray-700">Não</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-center m-2">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit">
            Cadastrar Usuário
          </button>

        </div>

      </form>
    </div>
  )
}

export default FormNovoUsuario