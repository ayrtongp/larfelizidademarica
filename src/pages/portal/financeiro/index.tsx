import React, { useEffect, useState, useCallback } from 'react';
import PortalBase from '@/components/Portal/PortalBase';
import DashboardCards from '@/components/financeiro/dashboard/DashboardCards';
import ProximosVencimentosList from '@/components/financeiro/dashboard/ProximosVencimentosList';
import VencidosList from '@/components/financeiro/dashboard/VencidosList';
import SaldoContasList from '@/components/financeiro/dashboard/SaldoContasList';
import GraficoEvolucaoMensal from '@/components/financeiro/dashboard/GraficoEvolucaoMensal';
import GraficoSaldoContas from '@/components/financeiro/dashboard/GraficoSaldoContas';
import { S_financeiroDashboard } from '@/services/S_financeiroDashboard';
import { T_DashboardResumo, T_TituloVencimento, T_SaldoConta, T_EvolucaoMensal } from '@/types/T_financeiroDashboard';

export default function FinanceiroDashboard() {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());

  const [resumo, setResumo] = useState<T_DashboardResumo | null>(null);
  const [proximosVencimentos, setProximosVencimentos] = useState<T_TituloVencimento[]>([]);
  const [vencidos, setVencidos] = useState<T_TituloVencimento[]>([]);
  const [saldoContas, setSaldoContas] = useState<T_SaldoConta[]>([]);
  const [evolucao, setEvolucao] = useState<T_EvolucaoMensal[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [r, pv, v, sc, ev] = await Promise.all([
        S_financeiroDashboard.getResumo(mes, ano),
        S_financeiroDashboard.getProximosVencimentos(),
        S_financeiroDashboard.getVencidos(),
        S_financeiroDashboard.getSaldoContas(),
        S_financeiroDashboard.getEvolucaoMensal(6),
      ]);
      setResumo(r);
      setProximosVencimentos(pv);
      setVencidos(v);
      setSaldoContas(sc);
      setEvolucao(ev);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [mes, ano]);

  useEffect(() => { carregar(); }, [carregar]);

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  const anos = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <PortalBase>
      <div className="col-span-full w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Financeiro</h1>
          <div className="flex items-center gap-3">
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="shadow border rounded py-1.5 px-3 text-gray-700 text-sm focus:outline-none"
            >
              {meses.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
              className="shadow border rounded py-1.5 px-3 text-gray-700 text-sm focus:outline-none"
            >
              {anos.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Carregando dados...</div>
        ) : (
          <>
            {resumo && (
              <div className="mb-6">
                <DashboardCards resumo={resumo} />
              </div>
            )}

            {evolucao.length > 0 && (
              <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                  <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                    Recebido vs Pago
                  </h2>
                  <GraficoEvolucaoMensal dados={evolucao} />
                </div>
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                  <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                    Saldo Total das Contas
                  </h2>
                  <GraficoSaldoContas
                    evolucao={evolucao}
                    totalAtual={saldoContas.reduce((acc, c) => acc + c.saldoAtual, 0)}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                  Saldo por Conta
                </h2>
                <SaldoContasList contas={saldoContas} />
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                  Próximos Vencimentos (7 dias)
                </h2>
                <ProximosVencimentosList titulos={proximosVencimentos} />
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                  Títulos Vencidos
                </h2>
                <VencidosList titulos={vencidos} />
              </div>
            </div>
          </>
        )}
      </div>
    </PortalBase>
  );
}
