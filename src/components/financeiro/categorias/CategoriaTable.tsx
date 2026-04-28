import React from 'react';
import { T_Categoria } from '@/types/T_financeiroCategorias';
import Badge from '@/components/UI/Badge';
import Button_M3 from '@/components/Formularios/Button_M3';

interface Props {
  categorias: T_Categoria[];
  onEdit: (cat: T_Categoria) => void;
  onToggleAtivo: (id: string) => void;
}

const CategoriaTable: React.FC<Props> = ({ categorias, onEdit, onToggleAtivo }) => {
  if (categorias.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        Nenhuma categoria cadastrada.
      </div>
    );
  }

  const mapaNomes: Record<string, string> = {};
  for (const c of categorias) if (c._id) mapaNomes[c._id] = c.nome;

  // Group: roots first sorted by tipo+nome, then children indented
  const roots = categorias.filter((c) => !c.categoriaPaiId).sort((a, b) =>
    a.tipo.localeCompare(b.tipo) || a.nome.localeCompare(b.nome, 'pt-BR')
  );
  const children = categorias.filter((c) => !!c.categoriaPaiId);

  const ordered: T_Categoria[] = [];
  for (const r of roots) {
    ordered.push(r);
    const filhos = children.filter((c) => c.categoriaPaiId === r._id).sort((a, b) =>
      a.nome.localeCompare(b.nome, 'pt-BR')
    );
    ordered.push(...filhos);
  }
  // Any children whose parent wasn't found
  const orphans = children.filter((c) => !roots.find((r) => r._id === c.categoriaPaiId));
  ordered.push(...orphans);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Nome
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Categoria Pai
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Tipo
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Cor
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {ordered.map((cat) => {
            const isChild = !!cat.categoriaPaiId;
            return (
              <tr key={cat._id} className={`hover:bg-gray-50 transition-colors ${isChild ? 'bg-gray-50/40' : ''}`}>
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                  {isChild && <span className="text-gray-300 mr-1.5 select-none">└</span>}
                  {cat.nome}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {cat.categoriaPaiId ? mapaNomes[cat.categoriaPaiId] ?? '—' : '—'}
                </td>
                <td className="px-4 py-3 text-sm">
                  <Badge
                    label={cat.tipo === 'receita' ? 'Receita' : 'Despesa'}
                    variant={cat.tipo === 'receita' ? 'success' : 'danger'}
                  />
                </td>
                <td className="px-4 py-3 text-sm">
                  {cat.cor ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full border border-gray-300"
                        style={{ backgroundColor: cat.cor }}
                      />
                      <span className="text-gray-500 text-xs">{cat.cor}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <Badge
                    label={cat.ativo ? 'Ativo' : 'Inativo'}
                    variant={cat.ativo ? 'success' : 'danger'}
                  />
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Button_M3
                      label="Editar"
                      onClick={() => onEdit(cat)}
                      type="button"
                    />
                    <Button_M3
                      label={cat.ativo ? 'Desativar' : 'Ativar'}
                      onClick={() => cat._id && onToggleAtivo(cat._id)}
                      bgColor={cat.ativo ? 'red' : 'green'}
                      type="button"
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CategoriaTable;
