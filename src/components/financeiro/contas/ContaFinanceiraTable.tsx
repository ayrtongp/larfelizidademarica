import React from 'react';
import { T_ContaFinanceira } from '@/types/T_financeiroContas';
import Badge from '@/components/UI/Badge';
import Button_M3 from '@/components/Formularios/Button_M3';

interface Props {
  contas: T_ContaFinanceira[];
  onEdit: (conta: T_ContaFinanceira) => void;
  onToggleAtivo: (id: string) => void;
}

const TIPO_LABEL: Record<T_ContaFinanceira['tipo'], string> = {
  banco: 'Banco',
  caixa: 'Caixa',
  aplicacao: 'Aplicação',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const ContaFinanceiraTable: React.FC<Props> = ({ contas, onEdit, onToggleAtivo }) => {
  if (contas.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        Nenhuma conta financeira cadastrada.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Nome
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Tipo
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Saldo Inicial
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {contas.map((conta) => (
            <tr key={conta._id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                {conta.nome}
                {conta.banco && (
                  <span className="block text-xs text-gray-400">{conta.banco}</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm">
                <Badge
                  label={TIPO_LABEL[conta.tipo]}
                  variant="info"
                />
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                {formatCurrency(conta.saldoInicial)}
              </td>
              <td className="px-4 py-3 text-sm">
                <Badge
                  label={conta.ativo ? 'Ativa' : 'Inativa'}
                  variant={conta.ativo ? 'success' : 'danger'}
                />
              </td>
              <td className="px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <Button_M3
                    label="Editar"
                    onClick={() => onEdit(conta)}
                    type="button"
                  />
                  <Button_M3
                    label={conta.ativo ? 'Desativar' : 'Ativar'}
                    onClick={() => conta._id && onToggleAtivo(conta._id)}
                    bgColor={conta.ativo ? 'red' : 'green'}
                    type="button"
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ContaFinanceiraTable;
