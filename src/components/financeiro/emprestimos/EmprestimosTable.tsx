import React from 'react';
import { T_Emprestimo } from '@/types/T_financeiroEmprestimos';
import EmprestimoStatusBadge from './EmprestimoStatusBadge';

interface Props {
  emprestimos: T_Emprestimo[];
  onDevolver: (emprestimo: T_Emprestimo) => void;
  onCancelar: (id: string) => void;
}

const formatCurrency = (v: number) =>
  v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? '-';

const formatDate = (d?: string) => {
  if (!d) return '-';
  const [y, m, day] = d.slice(0, 10).split('-');
  return `${day}/${m}/${y}`;
};

const EmprestimosTable: React.FC<Props> = ({ emprestimos, onDevolver, onCancelar }) => {
  if (emprestimos.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        Nenhum empréstimo encontrado.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Data</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Descrição</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contraparte</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Valor Original</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Em Aberto</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {emprestimos.map((e) => (
            <tr key={e._id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm text-gray-700">{formatDate(e.dataEmprestimo)}</td>
              <td className="px-4 py-3 text-sm">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${e.tipo === 'concedido' ? 'bg-purple-100 text-purple-800' : 'bg-teal-100 text-teal-800'}`}>
                  {e.tipo === 'concedido' ? 'Concedido' : 'Recebido'}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">{e.descricao}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{e.contraparteNome || '-'}</td>
              <td className="px-4 py-3 text-sm text-right text-gray-700">{formatCurrency(e.valorOriginal)}</td>
              <td className="px-4 py-3 text-sm text-right font-medium text-red-600">{formatCurrency(e.valorEmAberto)}</td>
              <td className="px-4 py-3 text-center">
                <EmprestimoStatusBadge status={e.status} />
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  {e.status !== 'quitado' && e.status !== 'cancelado' && (
                    <button
                      onClick={() => onDevolver(e)}
                      className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                    >
                      Devolver
                    </button>
                  )}
                  {e.status !== 'cancelado' && e.status !== 'quitado' && (
                    <button
                      onClick={() => {
                        if (window.confirm('Confirmar cancelamento deste empréstimo?')) {
                          onCancelar(e._id!);
                        }
                      }}
                      className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmprestimosTable;
