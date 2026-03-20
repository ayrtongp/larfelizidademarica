import React from 'react';
import { T_TituloFinanceiro } from '@/types/T_financeiroTitulos';
import TituloStatusBadge from './TituloStatusBadge';

interface Props {
  titulos: T_TituloFinanceiro[];
  onVerBaixas: (titulo: T_TituloFinanceiro) => void;
  onBaixar: (titulo: T_TituloFinanceiro) => void;
  onCancelar: (titulo: T_TituloFinanceiro) => void;
  onEditar: (titulo: T_TituloFinanceiro) => void;
}

function formatDateBR(dateStr?: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function formatCurrency(value?: number): string {
  if (value === undefined || value === null) return '-';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const TituloTable: React.FC<Props> = ({ titulos, onVerBaixas, onBaixar, onCancelar, onEditar }) => {
  if (titulos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum título encontrado.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto bg-white shadow rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Descrição</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Vencimento</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Valor Original</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Saldo</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Ações</th>
          </tr>
        </thead>
        <tbody>
          {titulos.map((titulo) => (
            <tr key={titulo._id} className="border-b last:border-0 hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-800">
                <div className="font-medium">{titulo.descricao}</div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">{formatDateBR(titulo.vencimento)}</td>
              <td className="px-4 py-3 text-sm text-gray-700 text-right">{formatCurrency(titulo.valorOriginal)}</td>
              <td className="px-4 py-3 text-sm text-gray-700 text-right font-medium">
                {formatCurrency(titulo.saldo)}
              </td>
              <td className="px-4 py-3 text-center">
                <TituloStatusBadge status={titulo.status} />
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <button
                    onClick={() => onVerBaixas(titulo)}
                    className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                    title="Ver histórico de baixas"
                  >
                    Baixas
                  </button>

                  {titulo.status !== 'liquidado' && titulo.status !== 'cancelado' && (
                    <button
                      onClick={() => onBaixar(titulo)}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                      title="Registrar baixa"
                    >
                      Baixar
                    </button>
                  )}

                  {titulo.status !== 'cancelado' && titulo.status !== 'liquidado' && (
                    <button
                      onClick={() => onEditar(titulo)}
                      className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                      title="Editar título"
                    >
                      Editar
                    </button>
                  )}

                  {titulo.status !== 'cancelado' && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Deseja cancelar o título "${titulo.descricao}"?`)) {
                          onCancelar(titulo);
                        }
                      }}
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      title="Cancelar título"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TituloTable;
