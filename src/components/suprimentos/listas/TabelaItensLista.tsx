import React, { useState } from 'react';
import { CATEGORIAS_ITEM, T_ItemLista, UNIDADES_ITEM } from '@/types/T_listaCompras';
import FormItem from './FormItem';
import { formatToBRL } from '@/utils/Functions';

interface Props {
  itens: T_ItemLista[];
  somenteLeitura: boolean;      // true quando comprada: bloqueia add/editar/remover
  podeMarcarComprado: boolean;  // true apenas quando finalizada: habilita checkbox
  onItensChange: (itens: T_ItemLista[]) => void;
}

const categoriaLabel = (val?: string) =>
  CATEGORIAS_ITEM.find((c) => c.value === val)?.label ?? '—';

const unidadeLabel = (val: string) =>
  UNIDADES_ITEM.find((u) => u.value === val)?.label ?? val;

const TabelaItensLista: React.FC<Props> = ({ itens, somenteLeitura, podeMarcarComprado, onItensChange }) => {
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<T_ItemLista | null>(null);

  const totalEstimado = itens.reduce((acc, i) => acc + (i.precoEstimado ?? 0) * i.quantidade, 0);
  const comprados = itens.filter((i) => i.comprado).length;

  const toggleComprado = (id: string) => {
    onItensChange(itens.map((i) => i._id === id ? { ...i, comprado: !i.comprado } : i));
  };

  const handleSaveItem = (item: T_ItemLista) => {
    if (editando) {
      onItensChange(itens.map((i) => i._id === item._id ? item : i));
    } else {
      onItensChange([...itens, item]);
    }
    setEditando(null);
    setShowForm(false);
  };

  const handleEditar = (item: T_ItemLista) => {
    setEditando(item);
    setShowForm(true);
  };

  const handleRemover = (id: string) => {
    if (!window.confirm('Remover este item da lista?')) return;
    onItensChange(itens.filter((i) => i._id !== id));
  };

  const handleCancelarForm = () => {
    setEditando(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-3">

      {/* Botão adicionar */}
      {!somenteLeitura && !showForm && (
        <button
          onClick={() => { setEditando(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
        >
          <span className="text-base">+</span>
          Adicionar Item
        </button>
      )}

      {/* Formulário inline */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            {editando ? 'Editar item' : 'Novo item'}
          </p>
          <FormItem item={editando ?? undefined} onSave={handleSaveItem} onCancel={handleCancelarForm} />
        </div>
      )}

      {/* Tabela */}
      {itens.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
          Nenhum item na lista. Adicione o primeiro item acima.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-200">
                <th className="w-10 px-3 py-3 text-center">✓</th>
                <th className="px-3 py-3 text-left">Item</th>
                <th className="px-3 py-3 text-left">Qtd</th>
                <th className="px-3 py-3 text-left">Categoria</th>
                <th className="px-3 py-3 text-left hidden md:table-cell">Obs</th>
                <th className="px-3 py-3 text-right hidden sm:table-cell">Preço Est.</th>
                {!somenteLeitura && <th className="px-3 py-3 text-center">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {itens.map((item) => (
                <tr
                  key={item._id}
                  className={`hover:bg-gray-50 transition-colors ${item.comprado ? 'opacity-60' : ''}`}
                >
                  <td className="px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={item.comprado}
                      onChange={() => toggleComprado(item._id)}
                      disabled={!podeMarcarComprado}
                      title={!podeMarcarComprado ? 'Disponível apenas na fase de compra (lista finalizada)' : undefined}
                      className={`w-4 h-4 rounded accent-green-500 ${podeMarcarComprado ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}`}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <span className={`font-medium text-gray-800 ${item.comprado ? 'line-through' : ''}`}>
                      {item.nome}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                    {item.quantidade} {unidadeLabel(item.unidade)}
                  </td>
                  <td className="px-3 py-3">
                    {item.categoria ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                        {categoriaLabel(item.categoria)}
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-3 text-gray-500 hidden md:table-cell max-w-[160px] truncate">
                    {item.observacao || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-600 hidden sm:table-cell whitespace-nowrap">
                    {item.precoEstimado != null
                      ? formatToBRL(item.precoEstimado * item.quantidade)
                      : <span className="text-gray-300">—</span>}
                  </td>
                  {!somenteLeitura && (
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditar(item)}
                          className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleRemover(item._id)}
                          className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                        >
                          Remover
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rodapé com totais */}
      {itens.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white rounded-lg border border-gray-100 shadow-sm text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span><strong className="text-gray-800">{itens.length}</strong> {itens.length === 1 ? 'item' : 'itens'}</span>
            <span>
              <strong className="text-green-600">{comprados}</strong> comprado{comprados !== 1 ? 's' : ''}
              {itens.length > 0 && (
                <span className="ml-2 text-xs text-gray-400">
                  ({Math.round((comprados / itens.length) * 100)}%)
                </span>
              )}
            </span>
          </div>
          {totalEstimado > 0 && (
            <span className="font-medium text-gray-700">
              Total est.: <strong className="text-indigo-600">{formatToBRL(totalEstimado)}</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TabelaItensLista;
