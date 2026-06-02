import React from 'react';
import { T_Parcelamento, SistemaAmortizacao } from '@/types/T_financeiroParcelamentos';
import ParcelamentoStatusBadge from './ParcelamentoStatusBadge';

interface Props {
  parcelamentos: T_Parcelamento[];
  onVerDetalhes: (p: T_Parcelamento) => void;
  onAddParcela: (p: T_Parcelamento) => void;
  onEditar: (p: T_Parcelamento) => void;
  onCancelar: (id: string) => void;
}

const formatCurrency = (v: number) =>
  v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? '-';

const formatDate = (d?: string) => {
  if (!d) return '-';
  const [y, m, day] = d.slice(0, 10).split('-');
  return `${day}/${m}/${y}`;
};

const labelSistema: Record<SistemaAmortizacao, string> = {
  fixo:    'Fixo',
  price:   'Price',
  sac:     'SAC',
  variavel: 'Variável',
};

const ParcelamentosTable: React.FC<Props> = ({ parcelamentos, onVerDetalhes, onAddParcela, onEditar, onCancelar }) => {
  if (parcelamentos.length === 0) {
    return <div className="text-center text-gray-400 py-8">Nenhum parcelamento encontrado.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Descrição</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sistema</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Valor Financiado</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Valor Total</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Parcelas</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">1º Pagamento</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {parcelamentos.map((p) => {
            const totalPagas = (p.parcelasPagas || 0) + (p.parcelasJaPagas || 0);
            const total = p.numeroParcelas > 0 ? p.numeroParcelas : '?';
            return (
              <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-800 font-medium max-w-xs truncate" title={p.descricao}>
                  {p.descricao}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${p.tipo === 'receber' ? 'bg-teal-100 text-teal-800' : 'bg-red-100 text-red-700'}`}>
                    {p.tipo === 'receber' ? 'Receber' : 'Pagar'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {labelSistema[p.sistemaAmortizacao]}
                  {p.taxaJuros > 0 && <span className="text-gray-400 ml-1 text-xs">{p.taxaJuros}% a.m.</span>}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-700">{formatCurrency(p.valorFinanciado)}</td>
                <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">
                  {p.valorTotal > 0 ? formatCurrency(p.valorTotal) : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-center text-gray-700">
                  <span className="font-medium">{totalPagas}</span>
                  <span className="text-gray-400">/{total}</span>
                  {(p.parcelasJaPagas || 0) > 0 && (
                    <span className="block text-xs text-gray-400">{p.parcelasJaPagas} antes</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-center text-gray-600">{formatDate(p.primeiroPagamento)}</td>
                <td className="px-4 py-3 text-center">
                  <ParcelamentoStatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1 flex-wrap">
                    <button
                      onClick={() => onVerDetalhes(p)}
                      className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded"
                    >
                      Detalhes
                    </button>
                    {p.status !== 'cancelado' && (
                      <button
                        onClick={() => onEditar(p)}
                        className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded"
                      >
                        Editar
                      </button>
                    )}
                    {p.status === 'ativo' && (
                      <button
                        onClick={() => onAddParcela(p)}
                        className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded"
                      >
                        + Parcela
                      </button>
                    )}
                    {p.status === 'ativo' && (
                      <button
                        onClick={() => {
                          if (window.confirm('Cancelar este parcelamento? As parcelas pendentes serão canceladas.')) {
                            onCancelar(p._id!);
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ParcelamentosTable;
