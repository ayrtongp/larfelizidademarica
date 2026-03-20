import React, { useEffect, useState } from 'react';
import { T_Rateio } from '@/types/T_financeiroRateios';
import { T_Movimentacao } from '@/types/T_financeiroMovimentacoes';
import S_financeiroMovimentacoes from '@/services/S_financeiroMovimentacoes';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

interface Props {
  movimentacao: T_Movimentacao | null;
  onClose: () => void;
}

export default function RateiosListModal({ movimentacao, onClose }: Props) {
  const [rateios, setRateios] = useState<T_Rateio[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!movimentacao?._id) return;
    setLoading(true);
    setErro('');
    S_financeiroMovimentacoes.getRateiosByMovimentacaoId(movimentacao._id)
      .then((data) => setRateios(data))
      .catch((err) => setErro(err.message || 'Erro ao carregar rateios.'))
      .finally(() => setLoading(false));
  }, [movimentacao]);

  if (!movimentacao) return null;

  const total = rateios.reduce((acc, r) => acc + (Number(r.valor) || 0), 0);
  const diferenca = Math.abs(total - movimentacao.valor);
  const totalOk = diferenca <= 0.001;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            Rateios da Movimentação
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
          >
            &times;
          </button>
        </div>

        <div className="px-6 py-2 bg-gray-50 border-b text-sm text-gray-600">
          <span className="font-medium">Histórico:</span> {movimentacao.historico} &mdash;{' '}
          <span className="font-medium">Valor total:</span>{' '}
          <span className="font-semibold text-gray-800">{formatCurrency(movimentacao.valor)}</span>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && <p className="text-center text-gray-500 py-4">Carregando rateios...</p>}
          {erro && <p className="text-center text-red-600 py-4">{erro}</p>}

          {!loading && !erro && rateios.length === 0 && (
            <p className="text-center text-gray-500 py-4">Nenhum rateio encontrado.</p>
          )}

          {!loading && !erro && rateios.length > 0 && (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rateios.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm text-gray-700">{r.categoriaId}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{r.descricao}</td>
                    <td className="px-3 py-2 text-sm text-gray-700 text-right">{formatCurrency(r.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && rateios.length > 0 && (
          <div className={`px-6 py-3 border-t text-sm font-semibold ${totalOk ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
            Total rateado: {formatCurrency(total)} / {formatCurrency(movimentacao.valor)}
            {!totalOk && <span className="ml-2">(diferença: {formatCurrency(diferenca)})</span>}
            {totalOk && <span className="ml-2">✓ Valores conferidos</span>}
          </div>
        )}

        <div className="px-6 py-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-medium text-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
