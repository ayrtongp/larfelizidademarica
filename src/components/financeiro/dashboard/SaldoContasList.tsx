import React from 'react';
import { T_SaldoConta } from '@/types/T_financeiroDashboard';

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const TIPO_LABELS: Record<string, string> = {
  banco: 'Banco',
  caixa: 'Caixa',
  aplicacao: 'Aplicação',
};

interface Props {
  contas: T_SaldoConta[];
}

export default function SaldoContasList({ contas }: Props) {
  if (contas.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">Nenhuma conta ativa encontrada.</p>;
  }

  const totalAtual   = contas.reduce((acc, c) => acc + c.saldoAtual,   0);
  const totalInicial = contas.reduce((acc, c) => acc + c.saldoInicial, 0);

  return (
    <div className="divide-y divide-gray-100">
      {contas.map((conta) => (
        <div key={conta._id} className="flex items-center justify-between py-3 px-1">
          <div>
            <p className="text-sm font-medium text-gray-800">{conta.nome}</p>
            <p className="text-xs text-gray-400">
              {TIPO_LABELS[conta.tipo] ?? conta.tipo}
              {conta.banco ? ` · ${conta.banco}` : ''}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-bold ${conta.saldoAtual >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {fmt(conta.saldoAtual)}
            </p>
            <p className="text-xs text-gray-400">inicial: {fmt(conta.saldoInicial)}</p>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between pt-3 px-1">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total</p>
        <div className="text-right">
          <p className={`text-sm font-bold ${totalAtual >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {fmt(totalAtual)}
          </p>
          <p className="text-xs text-gray-400">inicial: {fmt(totalInicial)}</p>
        </div>
      </div>
    </div>
  );
}
