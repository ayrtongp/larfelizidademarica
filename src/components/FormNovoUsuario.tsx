import { notifyError, notifySuccess } from '@/utils/Functions'
import React, { useEffect, useState } from 'react'

interface Grupo {
  _id: string;
  cod_grupo: string;
  nome_grupo: string;
}

const CATEGORIAS_OPTIONS = [
  { name: 'idosos',           label: 'Idosos' },
  { name: 'residentes',       label: 'Residentes' },
  { name: 'sinaisVitais',     label: 'Sinais Vitais' },
  { name: 'livroOcorrencias', label: 'Livro de Ocorrências' },
  { name: 'insumos',          label: 'Insumos' },
]

const FormNovoUsuario = () => {
  const [formData, setFormData] = useState({
    nome: '', sobrenome: '', cpf: '', dataNascimento: '', telefone: '',
    funcao: '', registro: '',
    usuario: '', senha: '', repetirSenha: '',
    admin: 'N', ativo: 'S',
  })
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAtivo, setIsAtivo] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categorias, setCategorias] = useState({
    idosos: false, residentes: false, sinaisVitais: false, livroOcorrencias: false, insumos: false,
  })
  const [gruposDisponiveis, setGruposDisponiveis] = useState<Grupo[]>([])
  const [gruposSelecionados, setGruposSelecionados] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/Controller/Grupos?type=getAll')
      .then(r => r.json())
      .then((data: Grupo[]) => setGruposDisponiveis(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleToggleAdmin = () => {
    const novo = !isAdmin
    setIsAdmin(novo)
    setFormData(prev => ({ ...prev, admin: novo ? 'S' : 'N' }))
  }

  const handleToggleAtivo = () => {
    const novo = !isAtivo
    setIsAtivo(novo)
    setFormData(prev => ({ ...prev, ativo: novo ? 'S' : 'N' }))
  }

  const handleChangeCategoria = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCategorias(prev => ({ ...prev, [e.target.name]: e.target.checked }))
  }

  const handleToggleGrupo = (id: string) => {
    setGruposSelecionados(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome.trim() || !formData.sobrenome.trim()) {
      notifyError('Nome e sobrenome são obrigatórios.')
      return
    }
    if (!formData.cpf.trim()) {
      notifyError('CPF é obrigatório.')
      return
    }
    if (!formData.dataNascimento) {
      notifyError('Data de nascimento é obrigatória.')
      return
    }
    if (!formData.telefone.trim()) {
      notifyError('Telefone é obrigatório.')
      return
    }
    if (!formData.usuario.trim()) {
      notifyError('Usuário (login) é obrigatório.')
      return
    }
    if (!formData.senha.trim()) {
      notifyError('Senha é obrigatória.')
      return
    }
    if (formData.senha !== formData.repetirSenha) {
      notifyError('As senhas não coincidem.')
      return
    }

    try {
      setSaving(true)

      const res = await fetch('/api/Controller/Usuario', {
        method: 'POST',
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const { message } = await res.json()
        notifyError(message || 'Erro ao cadastrar usuário.')
        return
      }

      const { userId } = await res.json()
      notifySuccess('Usuário cadastrado com sucesso!')

      // Permissões de categoria (usuario_permissao)
      await fetch(`/api/Controller/CategoriaPermissaoController?tipo=register&tipo_permissao=portal_servicos&id=${userId}`, {
        method: 'POST',
        body: JSON.stringify(categorias),
      })

      // Grupos de permissão (grupos_usuario)
      await Promise.allSettled(
        gruposSelecionados.map(id_grupo =>
          fetch('/api/Controller/GruposUsuario?type=new', {
            method: 'POST',
            body: JSON.stringify({ id_usuario: userId, id_grupo }),
          })
        )
      )

      if (gruposSelecionados.length > 0) notifySuccess('Grupos atribuídos!')

      // Reset
      setFormData({
        nome: '', sobrenome: '', cpf: '', dataNascimento: '', telefone: '',
        funcao: '', registro: '',
        usuario: '', senha: '', repetirSenha: '',
        admin: 'N', ativo: 'S',
      })
      setIsAdmin(false)
      setIsAtivo(true)
      setCategorias({ idosos: false, residentes: false, sinaisVitais: false, livroOcorrencias: false, insumos: false })
      setGruposSelecionados([])
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 bg-white'
  const labelClass = 'block text-xs text-gray-600 mb-1 font-medium'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Dados Pessoais */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Dados Pessoais</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Nome *</label>
            <input name="nome" type="text" value={formData.nome} onChange={handleChange}
              className={inputClass} placeholder="Primeiro nome" />
          </div>
          <div>
            <label className={labelClass}>Sobrenome *</label>
            <input name="sobrenome" type="text" value={formData.sobrenome} onChange={handleChange}
              className={inputClass} placeholder="Sobrenome" />
          </div>
          <div>
            <label className={labelClass}>CPF *</label>
            <input name="cpf" type="text" value={formData.cpf} onChange={handleChange}
              className={inputClass} placeholder="000.000.000-00" />
          </div>
          <div>
            <label className={labelClass}>Data de Nascimento *</label>
            <input name="dataNascimento" type="date" value={formData.dataNascimento} onChange={handleChange}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Telefone *</label>
            <input name="telefone" type="text" value={formData.telefone} onChange={handleChange}
              className={inputClass} placeholder="(00) 00000-0000" />
          </div>
          <div>
            <label className={labelClass}>Função / Cargo</label>
            <input name="funcao" type="text" value={formData.funcao} onChange={handleChange}
              className={inputClass} placeholder="Ex: Enfermeiro(a)" />
          </div>
          <div>
            <label className={labelClass}>Nº Registro Profissional</label>
            <input name="registro" type="text" value={formData.registro} onChange={handleChange}
              className={inputClass} placeholder="Ex: COREN-RJ 000000" />
          </div>
        </div>
      </div>

      <hr />

      {/* Dados de Acesso */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Dados de Acesso</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={labelClass}>Usuário (login) *</label>
            <input name="usuario" type="text" value={formData.usuario} onChange={handleChange}
              className={inputClass} placeholder="nome.sobrenome" />
          </div>
          <div>
            <label className={labelClass}>Senha *</label>
            <input name="senha" type="password" value={formData.senha} onChange={handleChange}
              className={inputClass} placeholder="••••••••" />
          </div>
          <div>
            <label className={labelClass}>Confirmar Senha *</label>
            <input name="repetirSenha" type="password" value={formData.repetirSenha} onChange={handleChange}
              className={inputClass} placeholder="••••••••" />
          </div>
        </div>
      </div>

      <hr />

      {/* Permissões de Categoria */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Permissões de Categoria</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {CATEGORIAS_OPTIONS.map(opt => (
            <label key={opt.name} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name={opt.name}
                checked={(categorias as any)[opt.name]}
                onChange={handleChangeCategoria}
                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <hr />

      {/* Grupos de Permissão */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Grupos de Permissão</p>
        {gruposDisponiveis.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Nenhum grupo cadastrado.</p>
        ) : (
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {gruposDisponiveis.map(g => (
              <label key={g._id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gruposSelecionados.includes(g._id)}
                  onChange={() => handleToggleGrupo(g._id)}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">{g.nome_grupo}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <hr />

      {/* Toggles */}
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700 font-medium">Usuário Admin</span>
          <button type="button" onClick={handleToggleAdmin}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAdmin ? 'bg-indigo-600' : 'bg-gray-200'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAdmin ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className={`text-xs font-semibold ${isAdmin ? 'text-indigo-600' : 'text-gray-400'}`}>{isAdmin ? 'Sim' : 'Não'}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700 font-medium">Conta Ativa</span>
          <button type="button" onClick={handleToggleAtivo}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAtivo ? 'bg-green-500' : 'bg-gray-200'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAtivo ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className={`text-xs font-semibold ${isAtivo ? 'text-green-600' : 'text-gray-400'}`}>{isAtivo ? 'Sim' : 'Não'}</span>
        </div>
      </div>

      <div className="pt-2">
        <button type="submit" disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2 px-6 rounded focus:outline-none transition-colors text-sm">
          {saving ? 'Cadastrando...' : 'Cadastrar Usuário'}
        </button>
      </div>

    </form>
  )
}

export default FormNovoUsuario
