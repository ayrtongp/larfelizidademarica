import { notifyError, notifySuccess } from '@/utils/Functions'
import { getUserID } from '@/utils/Login'
import React, { useState } from 'react'

const EyeOpen = () => (
  <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
  </svg>
)

const EyeClosed = () => (
  <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' />
  </svg>
)

interface FieldProps {
  label: string
  name: string
  value: string
  show: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onToggle: () => void
  placeholder?: string
}

const PasswordField = ({ label, name, value, show, onChange, onToggle, placeholder }: FieldProps) => (
  <div>
    <label className='block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5'>
      {label}
    </label>
    <div className='relative'>
      <input
        type={show ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className='w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition bg-gray-50'
      />
      <button
        type='button'
        onClick={onToggle}
        className='absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition'
        tabIndex={-1}
      >
        {show ? <EyeClosed /> : <EyeOpen />}
      </button>
    </div>
  </div>
)

const Senhas = () => {
  const [form, setForm] = useState({ senhaAtual: '', novaSenha: '', confirmaSenha: '' })
  const [show, setShow] = useState({ atual: false, nova: false, confirma: false })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const toggle = (field: keyof typeof show) => {
    setShow((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const strength = (pass: string) => {
    if (!pass) return null
    if (pass.length < 6) return { level: 1, label: 'Muito fraca', color: 'bg-red-400' }
    if (pass.length < 8) return { level: 2, label: 'Fraca', color: 'bg-orange-400' }
    if (!/[0-9]/.test(pass) || !/[a-z]/.test(pass)) return { level: 3, label: 'Média', color: 'bg-yellow-400' }
    if (!/[A-Z]/.test(pass) && !/[^a-zA-Z0-9]/.test(pass)) return { level: 3, label: 'Média', color: 'bg-yellow-400' }
    return { level: 4, label: 'Forte', color: 'bg-green-500' }
  }

  const passStrength = strength(form.novaSenha)

  const handleSubmit = async () => {
    if (!form.senhaAtual || !form.novaSenha || !form.confirmaSenha) {
      return notifyError('Preencha todos os campos')
    }
    if (form.novaSenha !== form.confirmaSenha) {
      return notifyError('As senhas não coincidem')
    }
    if (form.novaSenha.length < 6) {
      return notifyError('A nova senha deve ter ao menos 6 caracteres')
    }

    try {
      setLoading(true)
      const res = await fetch(`/api/Controller/Usuario?tipo=alteraSenha&id=${getUserID()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPass: form.senhaAtual,
          newPass: form.novaSenha,
          repPass: form.confirmaSenha,
        }),
      })
      const data = await res.json()
      if (!res.ok) return notifyError(data.message || 'Erro ao alterar senha')
      notifySuccess('Senha alterada com sucesso!')
      setForm({ senhaAtual: '', novaSenha: '', confirmaSenha: '' })
    } catch {
      notifyError('Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='space-y-5 max-w-sm'>

      <PasswordField
        label='Senha atual'
        name='senhaAtual'
        value={form.senhaAtual}
        show={show.atual}
        onChange={handleChange}
        onToggle={() => toggle('atual')}
        placeholder='Digite sua senha atual'
      />

      <PasswordField
        label='Nova senha'
        name='novaSenha'
        value={form.novaSenha}
        show={show.nova}
        onChange={handleChange}
        onToggle={() => toggle('nova')}
        placeholder='Mínimo 6 caracteres'
      />

      {/* Strength meter */}
      {passStrength && (
        <div className='space-y-1'>
          <div className='flex gap-1'>
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className={`h-1 flex-1 rounded-full transition-colors ${n <= passStrength.level ? passStrength.color : 'bg-gray-200'}`}
              />
            ))}
          </div>
          <p className='text-xs text-gray-400'>{passStrength.label}</p>
        </div>
      )}

      <PasswordField
        label='Confirmar nova senha'
        name='confirmaSenha'
        value={form.confirmaSenha}
        show={show.confirma}
        onChange={handleChange}
        onToggle={() => toggle('confirma')}
        placeholder='Repita a nova senha'
      />

      {/* Match indicator */}
      {form.confirmaSenha && (
        <p className={`text-xs flex items-center gap-1 ${form.novaSenha === form.confirmaSenha ? 'text-green-600' : 'text-red-500'}`}>
          {form.novaSenha === form.confirmaSenha ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className='w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50'
      >
        {loading ? (
          <>
            <svg className='animate-spin h-4 w-4' viewBox='0 0 24 24' fill='none'>
              <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
              <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z' />
            </svg>
            Salvando...
          </>
        ) : 'Alterar senha'}
      </button>

    </div>
  )
}

export default Senhas
