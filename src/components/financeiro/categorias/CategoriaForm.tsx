import React, { useEffect, useState } from 'react';
import { T_Categoria } from '@/types/T_financeiroCategorias';
import Button_M3 from '@/components/Formularios/Button_M3';
import TextInputM2 from '@/components/Formularios/TextInputM2';

interface Props {
  onSave: (data: T_Categoria) => void;
  initialData?: T_Categoria;
  loading?: boolean;
}

const defaultForm: T_Categoria = {
  nome: '',
  tipo: 'despesa',
  categoriaPaiId: null,
  cor: '',
  ativo: true,
};

const CategoriaForm: React.FC<Props> = ({ onSave, initialData, loading = false }) => {
  const [form, setForm] = useState<T_Categoria>(defaultForm);

  useEffect(() => {
    if (initialData) {
      setForm({ ...defaultForm, ...initialData });
    } else {
      setForm(defaultForm);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextInputM2
        label="Nome da Categoria *"
        name="nome"
        value={form.nome}
        onChange={handleChange}
      />

      <div>
        <label className="block text-gray-700 text-left pl-1 text-sm font-bold mb-1" htmlFor="tipo">
          Tipo *
        </label>
        <select
          id="tipo"
          name="tipo"
          value={form.tipo}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          required
        >
          <option value="receita">Receita</option>
          <option value="despesa">Despesa</option>
        </select>
      </div>

      <div>
        <label className="block text-gray-700 text-left pl-1 text-sm font-bold mb-1" htmlFor="cor">
          Cor (opcional)
        </label>
        <div className="flex items-center gap-3">
          <input
            id="cor"
            type="color"
            name="cor"
            value={form.cor || '#6366f1'}
            onChange={handleChange}
            className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
          />
          <span className="text-sm text-gray-500">{form.cor || 'Nenhuma cor selecionada'}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <input
          id="ativo"
          type="checkbox"
          name="ativo"
          checked={form.ativo}
          onChange={handleCheckboxChange}
          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
          Categoria ativa
        </label>
      </div>

      <div className="flex justify-end pt-2">
        <Button_M3
          label={loading ? 'Salvando...' : 'Salvar'}
          onClick={() => {}}
          type="submit"
          disabled={loading}
        />
      </div>
    </form>
  );
};

export default CategoriaForm;
