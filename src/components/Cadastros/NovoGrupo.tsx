import { notifyError, notifySuccess } from "@/utils/Functions";
import { useState } from "react";

const NovoGrupo = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ cod_grupo: '', nome_grupo: '', descricao: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.cod_grupo.trim() || !formData.nome_grupo.trim()) {
      notifyError('Código e nome do grupo são obrigatórios.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/Controller/Grupos?type=new`, {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ cod_grupo: '', nome_grupo: '', descricao: '' });
        notifySuccess('Grupo criado com sucesso!');
      } else {
        notifyError('Erro ao criar grupo.');
      }
    } catch (error) {
      console.error(error);
      notifyError('Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500';
  const labelClass = 'block text-xs text-gray-600 mb-1 font-medium';

  return (
    <div className='space-y-5'>
      <p className='text-sm text-gray-500'>
        Grupos controlam quais módulos e funcionalidades cada usuário pode acessar no sistema.
      </p>

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div>
            <label className={labelClass}>Código do Grupo *</label>
            <input
              name='cod_grupo'
              type='text'
              value={formData.cod_grupo}
              onChange={handleChange}
              className={inputClass}
              placeholder='Ex: financeiro, rh, admin'
            />
            <p className='text-xs text-gray-400 mt-1'>Identificador único em minúsculas, sem espaços.</p>
          </div>
          <div>
            <label className={labelClass}>Nome do Grupo *</label>
            <input
              name='nome_grupo'
              type='text'
              value={formData.nome_grupo}
              onChange={handleChange}
              className={inputClass}
              placeholder='Ex: Financeiro'
            />
          </div>
          <div className='sm:col-span-2'>
            <label className={labelClass}>Descrição</label>
            <input
              name='descricao'
              type='text'
              value={formData.descricao}
              onChange={handleChange}
              className={inputClass}
              placeholder='Descreva as permissões deste grupo'
            />
          </div>
        </div>

        <div className='pt-1'>
          <button type='submit' disabled={loading}
            className='bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2 px-5 rounded text-sm transition-colors'>
            {loading ? 'Criando...' : 'Criar Grupo'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NovoGrupo;
