import React from 'react';
import { T_Movimentacao, TipoMovimento } from '@/types/T_financeiroMovimentacoes';

function formatDateBR(dateStr: string): string {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('T')[0].split('-');
  return `${day}/${month}/${year}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const TIPO_LABELS: Record<TipoMovimento, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  transferencia: 'Transferência',
  ajuste: 'Ajuste',
};

const TIPO_STYLES: Record<TipoMovimento, string> = {
  entrada: 'bg-green-100 text-green-800',
  saida: 'bg-red-100 text-red-800',
  transferencia: 'bg-blue-100 text-blue-800',
  ajuste: 'bg-gray-100 text-gray-800',
};

interface ContaNome {
  _id: string;
  nome: string;
}

interface Props {
  movimentacoes: T_Movimentacao[];
  contas?: ContaNome[];
  onVerRateios?: (movimentacao: T_Movimentacao) => void;
  onEditar?: (movimentacao: T_Movimentacao) => void;
}

export default function MovimentacoesTable({
  movimentacoes,
  contas = [],
  onVerRateios,
  onEditar,
}: Props) {
  function getNomeConta(id: string): string {
    const conta = contas.find((c) => c._id === id);
    return conta ? conta.nome : id;
  }

  if (movimentacoes.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        Nenhuma movimentação encontrada.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md shadow">
      <table className="min-w-full divide-y divide-gray-200 bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Histórico</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conta</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {movimentacoes.map((mov) => {
            const isEntrada = mov.tipoMovimento === 'entrada';
            const isSaida = mov.tipoMovimento === 'saida';
            const valorClass = isEntrada
              ? 'text-green-700 font-semibold'
              : isSaida
              ? 'text-red-700 font-semibold'
              : 'text-gray-700';
            const valorPrefix = isEntrada ? '+' : isSaida ? '-' : '';

            return (
              <tr key={mov._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                  {formatDateBR(mov.dataMovimento)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TIPO_STYLES[mov.tipoMovimento]}`}>
                    {TIPO_LABELS[mov.tipoMovimento]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                  {mov.historico}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {getNomeConta(mov.contaFinanceiraId)}
                </td>
                <td className={`px-4 py-3 text-sm text-right whitespace-nowrap ${valorClass}`}>
                  {valorPrefix}{formatCurrency(mov.valor)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => onEditar && onEditar(mov)}
                      className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
                    >
                      Editar
                    </button>

                    {mov.temRateio && (
                      <button
                        onClick={() => onVerRateios && onVerRateios(mov)}
                        className="text-xs px-2 py-1 rounded bg-yellow-50 text-yellow-700 hover:bg-yellow-100 font-medium"
                      >
                        Ver rateios
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
