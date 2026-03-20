import React from 'react';
import { T_Recorrencia } from '@/types/T_financeiroRecorrencias';

interface Props {
  recorrencias: T_Recorrencia[];
  onEditar: (recorrencia: T_Recorrencia) => void;
  onToggleAtivo: (id: string) => void;
  onExcluir: (id: string) => void;
}

const formatCurrency = (v: number) =>
  v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? '-';

const formatDate = (d?: string) => {
  if (!d) return '-';
  const [y, m, day] = d.slice(0, 10).split('-');
  return `${day}/${m}/${y}`;
};

const RecorrenciasTable: React.FC<Props> = ({ recorrencias, onEditar, onToggleAtivo, onExcluir }) => {
  if (recorrencias.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        Nenhuma recorrência encontrada.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Descrição</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Valor</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Dia Venc.</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Início</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Fim</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Ativo</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {recorrencias.map((r) => (
            <tr key={r._id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm text-gray-700 font-medium">{r.descricaoPadrao}</td>
              <td className="px-4 py-3 text-sm">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${r.tipo === 'pagar' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {r.tipo === 'pagar' ? 'Pagar' : 'Receber'}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-700">{formatCurrency(r.valorPadrao)}</td>
              <td className="px-4 py-3 text-sm text-center text-gray-700">Dia {r.diaVencimento}</td>
              <td className="px-4 py-3 text-sm text-center text-gray-600">{formatDate(r.dataInicio)}</td>
              <td className="px-4 py-3 text-sm text-center text-gray-600">{formatDate(r.dataFim)}</td>
              <td className="px-4 py-3 text-center">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${r.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {r.ativo ? 'Sim' : 'Não'}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onEditar(r)}
                    className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onToggleAtivo(r._id!)}
                    className={`text-xs px-2 py-1 rounded text-white ${r.ativo ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}
                  >
                    {r.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Confirmar exclusão desta recorrência?')) {
                        onExcluir(r._id!);
                      }
                    }}
                    className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                  >
                    Excluir
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecorrenciasTable;
