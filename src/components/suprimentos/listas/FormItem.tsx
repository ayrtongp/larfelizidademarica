import React, { useState } from 'react';
import { CategoriaItem, CATEGORIAS_ITEM, T_ItemLista, UnidadeItem, UNIDADES_ITEM } from '@/types/T_listaCompras';
import Button_M3 from '@/components/Formularios/Button_M3';

interface Props {
  item?: T_ItemLista;
  onSave: (item: T_ItemLista) => void;
  onCancel: () => void;
}

const emptyForm = (): Omit<T_ItemLista, '_id'> => ({
  nome: '',
  quantidade: 1,
  unidade: 'un' as UnidadeItem,
  categoria: undefined,
  observacao: '',
  comprado: false,
  precoEstimado: undefined,
});

const FormItem: React.FC<Props> = ({ item, onSave, onCancel }) => {
  const [form, setForm] = useState<Omit<T_ItemLista, '_id'>>(
    item ? { nome: item.nome, quantidade: item.quantidade, unidade: item.unidade, categoria: item.categoria, observacao: item.observacao, comprado: item.comprado, precoEstimado: item.precoEstimado }
         : emptyForm()
  );
  const [erro, setErro] = useState('');

  const set = (field: string, value: unknown) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) { setErro('Informe o nome do item.'); return; }
    if (!form.quantidade || form.quantidade <= 0) { setErro('Quantidade deve ser maior que zero.'); return; }
    setErro('');
    const id = item?._id || (typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2));
    onSave({ ...form, _id: id });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Nome */}
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">
          Nome do item <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.nome}
          onChange={(e) => set('nome', e.target.value)}
          placeholder="Ex: Cenoura, Frango, Leite..."
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          autoFocus
        />
      </div>

      {/* Quantidade + Unidade */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Quantidade <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.quantidade}
            onChange={(e) => set('quantidade', parseFloat(e.target.value) || 0)}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Unidade <span className="text-red-500">*</span>
          </label>
          <select
            value={form.unidade}
            onChange={(e) => set('unidade', e.target.value as UnidadeItem)}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 h-[38px]"
          >
            {UNIDADES_ITEM.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Categoria */}
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">Categoria</label>
        <select
          value={form.categoria ?? ''}
          onChange={(e) => set('categoria', e.target.value as CategoriaItem || undefined)}
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 h-[38px]"
        >
          <option value="">Sem categoria</option>
          {CATEGORIAS_ITEM.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Preço estimado */}
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">Preço estimado (R$)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={form.precoEstimado ?? ''}
          onChange={(e) => set('precoEstimado', e.target.value ? parseFloat(e.target.value) : undefined)}
          placeholder="0,00"
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {/* Observação */}
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">Observação</label>
        <textarea
          value={form.observacao ?? ''}
          onChange={(e) => set('observacao', e.target.value)}
          rows={2}
          placeholder="Ex: sem glúten, orgânico..."
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
        />
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <div className="flex gap-3 pt-2">
        <Button_M3 label="Cancelar" bgColor="gray" type="button" onClick={onCancel} />
        <Button_M3 label={item ? 'Salvar alterações' : 'Adicionar item'} bgColor="green" type="submit" onClick={() => {}} />
      </div>
    </form>
  );
};

export default FormItem;
