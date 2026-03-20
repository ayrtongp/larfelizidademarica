import React from 'react';
import DashboardCard from './DashboardCard';
import { T_DashboardResumo } from '@/types/T_financeiroDashboard';

interface Props {
  resumo: T_DashboardResumo;
}

const fmt = (v: number) =>
  v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00';

const DashboardCards: React.FC<Props> = ({ resumo }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <DashboardCard titulo="Saldo Total" valor={fmt(resumo.saldoTotal)} cor="azul" />
      <DashboardCard titulo="A Receber no Mês" valor={fmt(resumo.totalAReceberMes)} cor="verde" />
      <DashboardCard titulo="A Pagar no Mês" valor={fmt(resumo.totalAPagarMes)} cor="vermelho" />
      <DashboardCard titulo="Recebido no Mês" valor={fmt(resumo.totalRecebidoMes)} cor="verde" />
      <DashboardCard titulo="Pago no Mês" valor={fmt(resumo.totalPagoMes)} cor="vermelho" />
      <DashboardCard titulo="Inadimplência" valor={fmt(resumo.inadimplenciaMes)} cor="amarelo" />
      <DashboardCard
        titulo="Resultado do Mês"
        valor={fmt(resumo.resultadoMes)}
        cor={resumo.resultadoMes >= 0 ? 'verde' : 'vermelho'}
      />
    </div>
  );
};

export default DashboardCards;
