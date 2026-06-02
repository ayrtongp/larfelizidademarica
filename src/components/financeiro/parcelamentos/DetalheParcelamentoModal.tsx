import React, { useState, useEffect, useCallback } from 'react';
import { T_Parcelamento } from '@/types/T_financeiroParcelamentos';
import { T_TituloFinanceiro } from '@/types/T_financeiroTitulos';
import S_financeiroParcelamentos from '@/services/S_financeiroParcelamentos';
import S_financeiroTitulos from '@/services/S_financeiroTitulos';
import BaixaParcelaModal from './BaixaParcelaModal';
import EditParcelaModal from './EditParcelaModal';

interface Props {
  parcelamento: T_Parcelamento;
  onClose: () => void;
}

const formatCurrency = (v: number) =>
  v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? '-';

const formatDate = (d?: string) => {
  if (!d) return '-';
  const [y, m, day] = d.slice(0, 10).split('-');
  return `${day}/${m}/${y}`;
};

const statusConfig: Record<string, { label: string; className: string }> = {
  aberto:    { label: 'Aberto',    className: 'bg-blue-100 text-blue-800' },
  parcial:   { label: 'Parcial',   className: 'bg-yellow-100 text-yellow-800' },
  liquidado: { label: 'Liquidado', className: 'bg-green-100 text-green-800' },
  vencido:   { label: 'Vencido',   className: 'bg-red-100 text-red-700' },
  cancelado: { label: 'Cancelado', className: 'bg-gray-100 text-gray-600' },
};

const DetalheParcelamentoModal: React.FC<Props> = ({ parcelamento, onClose }) => {
  const [parcelas, setParcelas] = useState<T_TituloFinanceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [parcelaBaixa, setParcelaBaixa] = useState<T_TituloFinanceiro | null>(null);
  const [parcelaEdit, setParcelaEdit] = useState<T_TituloFinanceiro | null>(null);

  const carregarParcelas = useCallback(async () => {
    if (!parcelamento._id) return;
    setLoading(true);
    try {
      const data = await S_financeiroParcelamentos.getParcelas(parcelamento._id);
      setParcelas(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [parcelamento._id]);

  useEffect(() => { carregarParcelas(); }, [carregarParcelas]);

  const handleBaixa = async (data: any) => {
    if (!parcelaBaixa?._id) return;
    await S_financeiroTitulos.baixar(parcelaBaixa._id, data);
    setParcelaBaixa(null);
    carregarParcelas();
  };

  const handleEditParcela = async (data: any) => {
    if (!parcelaEdit?._id) return;
    await S_financeiroTitulos.editarParcela(parcelaEdit._id, data);
    setParcelaEdit(null);
    carregarParcelas();
  };

  const totalPagas = (parcelamento.parcelasJaPagas || 0) + (parcelamento.parcelasPagas || 0);
  const totalAcordo = parcelamento.numeroParcelas || 0;
  const progresso = totalAcordo > 0 ? Math.round((totalPagas / totalAcordo) * 100) : null;

  const valorPago = parcelas.filter((p) => p.status === 'liquidado').reduce((acc, p) => acc + p.valorLiquidado, 0);
  const valorPendente = parcelas.filter((p) => p.status !== 'liquidado' && p.status !== 'cancelado').reduce((acc, p) => acc + p.saldo, 0);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-screen overflow-y-auto">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{parcelamento.descricao}</h2>
                <p className="text-sm text-gray-400 mt-0.5 capitalize">
                  {parcelamento.tipo === 'pagar' ? 'A Pagar' : 'A Receber'} · {parcelamento.sistemaAmortizacao}
                  {parcelamento.taxaJuros > 0 && ` · ${parcelamento.taxaJuros}% a.m.`}
                </p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded p-3 text-center">
                <p className="text-xs text-gray-500 mb-0.5">Valor Financiado</p>
                <p className="font-semibold text-gray-800 text-sm">{formatCurrency(parcelamento.valorFinanciado)}</p>
              </div>
              <div className="bg-green-50 rounded p-3 text-center">
                <p className="text-xs text-gray-500 mb-0.5">Pago no sistema</p>
                <p className="font-semibold text-green-700 text-sm">{formatCurrency(valorPago)}</p>
              </div>
              <div className="bg-blue-50 rounded p-3 text-center">
                <p className="text-xs text-gray-500 mb-0.5">Pendente</p>
                <p className="font-semibold text-blue-700 text-sm">{formatCurrency(valorPendente)}</p>
              </div>
            </div>

            {totalAcordo > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{totalPagas} de {totalAcordo} parcelas pagas</span>
                  <span>{progresso}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${progresso}%` }} />
                </div>
                {(parcelamento.parcelasJaPagas || 0) > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {parcelamento.parcelasJaPagas} antes do sistema + {parcelamento.parcelasPagas || 0} registradas aqui
                  </p>
                )}
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Parcelas ({parcelas.length})</h3>
              {loading ? (
                <div className="text-center py-6 text-gray-400 text-sm">Carregando...</div>
              ) : parcelas.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">Nenhuma parcela cadastrada ainda.</div>
              ) : (
                <div className="overflow-x-auto rounded border border-gray-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Vencimento</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Valor</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Pago</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Saldo</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parcelas.map((p) => {
                        const sc = statusConfig[p.status] ?? statusConfig.aberto;
                        const podeAgir = p.status !== 'liquidado' && p.status !== 'cancelado';
                        return (
                          <tr key={p._id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-600">
                              {p.numeroParcela ?? '-'}
                              {p.totalParcelas ? <span className="text-gray-400">/{p.totalParcelas}</span> : ''}
                            </td>
                            <td className="px-3 py-2 text-gray-700">{formatDate(p.vencimento)}</td>
                            <td className="px-3 py-2 text-right text-gray-800">{formatCurrency(p.valorOriginal)}</td>
                            <td className="px-3 py-2 text-right text-green-600">{formatCurrency(p.valorLiquidado)}</td>
                            <td className={`px-3 py-2 text-right font-medium ${p.saldo > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                              {formatCurrency(p.saldo)}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${sc.className}`}>
                                {sc.label}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              {podeAgir && (
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => setParcelaBaixa(p)}
                                    className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                                  >
                                    Pagar
                                  </button>
                                  <button
                                    onClick={() => setParcelaEdit(p)}
                                    className="text-xs bg-gray-400 hover:bg-gray-500 text-white px-2 py-1 rounded"
                                  >
                                    Editar
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-4">
              <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-medium">
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>

      {parcelaBaixa && (
        <BaixaParcelaModal
          parcela={parcelaBaixa}
          onSave={handleBaixa}
          onClose={() => setParcelaBaixa(null)}
        />
      )}

      {parcelaEdit && (
        <EditParcelaModal
          parcela={parcelaEdit}
          onSave={handleEditParcela}
          onClose={() => setParcelaEdit(null)}
        />
      )}
    </>
  );
};

export default DetalheParcelamentoModal;
