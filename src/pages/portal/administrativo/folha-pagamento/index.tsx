import React, { useCallback, useEffect, useState } from 'react';
import PortalBase from '@/components/Portal/PortalBase';
import PermissionWrapper from '@/components/PermissionWrapper';
import { useHasGroup } from '@/hooks/useHasGroup';
import { useRouter } from 'next/router';
import S_folhaPagamento from '@/services/S_folhaPagamento';
import FolhaPagamentoForm from '@/components/rh/FolhaPagamentoForm';
import { T_FolhaPagamento, T_FolhaPagamentoItem } from '@/types/T_folhaPagamento';
import { notifyError, notifySuccess } from '@/utils/Functions';
import { getUserID } from '@/utils/Login';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function FolhaPagamentoPage() {
  const { hasGroup: isRH } = useHasGroup('rh');
  const router = useRouter();
  const anoAtual = new Date().getFullYear();
  const [filtroAno, setFiltroAno] = useState(anoAtual);
  const [folhas, setFolhas] = useState<Omit<T_FolhaPagamento, 'itens'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [novaFolhaAberta, setNovaFolhaAberta] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const all = await S_folhaPagamento.getAll();
      setFolhas(all.filter(f => f.periodo.ano === filtroAno));
    } catch {
      notifyError('Erro ao carregar folhas de pagamento.');
    } finally {
      setLoading(false);
    }
  }, [filtroAno]);

  useEffect(() => { carregar(); }, [carregar]);

  const handleCriar = async (periodo: { mes: number; ano: number }, itens: T_FolhaPagamentoItem[]) => {
    setErroForm('');
    setSalvando(true);
    try {
      const userId = getUserID() ?? '';
      await S_folhaPagamento.criar({ periodo, itens, createdBy: userId });
      notifySuccess('Folha de pagamento criada!');
      setNovaFolhaAberta(false);
      await carregar();
    } catch (err: any) {
      setErroForm(err?.message || 'Erro ao criar folha.');
    } finally {
      setSalvando(false);
    }
  };

  const handleRemover = async (id: string) => {
    if (!confirm('Remover esta folha de pagamento?')) return;
    try {
      await S_folhaPagamento.remover(id);
      notifySuccess('Folha removida.');
      await carregar();
    } catch {
      notifyError('Erro ao remover folha.');
    }
  };

  const anos = Array.from({ length: 5 }, (_, i) => anoAtual - i);

  return (
    <PermissionWrapper href="/portal" groups={['rh']}>
      <PortalBase>
        <div className="col-span-full">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h1 className="text-2xl font-bold text-gray-800">Folha de Pagamento</h1>
            <div className="flex items-center gap-2">
              <select
                value={filtroAno}
                onChange={e => setFiltroAno(Number(e.target.value))}
                className="border rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {anos.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              {isRH && (
                <button
                  onClick={() => { setErroForm(''); setNovaFolhaAberta(true); }}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
                >
                  + Nova Folha
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400">Carregando...</div>
          ) : folhas.length === 0 ? (
            <div className="text-center py-16 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Nenhuma folha de pagamento cadastrada para {filtroAno}.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Período</th>
                    <th className="px-5 py-3 text-right font-medium hidden sm:table-cell">Total Bruto</th>
                    <th className="px-5 py-3 text-right font-medium hidden sm:table-cell">Descontos</th>
                    <th className="px-5 py-3 text-right font-medium">Líquido</th>
                    <th className="px-5 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {folhas
                    .sort((a, b) => b.periodo.mes - a.periodo.mes)
                    .map(folha => (
                      <tr key={folha._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/portal/administrativo/folha-pagamento/${folha._id}`)}>
                        <td className="px-5 py-3.5 font-medium text-gray-800">
                          {MESES[folha.periodo.mes - 1]}/{folha.periodo.ano}
                          {folha.cloudURL && (
                            <span className="ml-2 text-xs text-indigo-500 font-normal">📎 arquivo</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right text-gray-600 hidden sm:table-cell">
                          {formatCurrency(folha.totalBruto)}
                        </td>
                        <td className="px-5 py-3.5 text-right text-red-500 hidden sm:table-cell">
                          {formatCurrency(folha.totalDescontos)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-green-700">
                          {formatCurrency(folha.totalLiquido)}
                        </td>
                        <td className="px-5 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => router.push(`/portal/administrativo/folha-pagamento/${folha._id}`)}
                              className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                            >
                              Ver
                            </button>
                            {isRH && (
                              <button
                                onClick={() => handleRemover(folha._id!)}
                                className="text-red-400 hover:text-red-600 text-xs font-medium"
                              >
                                Excluir
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {novaFolhaAberta && (
          <FolhaPagamentoForm
            onSalvar={handleCriar}
            onFechar={() => setNovaFolhaAberta(false)}
            salvando={salvando}
            erro={erroForm}
          />
        )}
      </PortalBase>
    </PermissionWrapper>
  );
}
