import React from 'react'

interface Props {
  userInfo: any
}

const Field = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className='text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1'>{label}</p>
    <p className='text-sm text-gray-800 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100'>
      {value || <span className='text-gray-300 italic'>—</span>}
    </p>
  </div>
)

const Preferencias = ({ userInfo }: Props) => {
  const generoLabel =
    userInfo.genero === 'masculino' ? 'Masculino'
    : userInfo.genero === 'feminino' ? 'Feminino'
    : undefined

  return (
    <div className='space-y-6'>

      {/* Dados pessoais */}
      <div>
        <p className='text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3'>Dados pessoais</p>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <Field label='Nome' value={userInfo.nome} />
          <Field label='Sobrenome' value={userInfo.sobrenome} />
          <Field label='Gênero' value={generoLabel} />
          <Field label='Usuário' value={userInfo.usuario} />
        </div>
      </div>

      {/* Contato */}
      <div>
        <p className='text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3'>Contato</p>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <Field label='E-mail' value={userInfo.email} />
          <Field label='Celular' value={userInfo.celular} />
        </div>
      </div>

      {/* Cargo */}
      <div>
        <p className='text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3'>Vínculo</p>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <Field label='Função' value={userInfo.funcao} />
          <Field label='Núm. Registro' value={userInfo.registro} />
        </div>
      </div>

      {/* Grupos */}
      {userInfo.grupos?.length > 0 && (
        <div>
          <p className='text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3'>Grupos de acesso</p>
          <div className='flex flex-wrap gap-2'>
            {userInfo.grupos.map((g: any) => (
              <span
                key={g.cod_grupo}
                className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100'
              >
                {g.nome_grupo}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Note */}
      <p className='text-xs text-gray-400 flex items-center gap-1.5'>
        <span>ℹ️</span>
        Para alterar seus dados cadastrais, entre em contato com o RH.
      </p>

    </div>
  )
}

export default Preferencias
