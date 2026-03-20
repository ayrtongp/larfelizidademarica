import React, { useEffect, useState } from 'react';
import { T_TituloFinanceiro, T_BaixaTitulo } from '@/types/T_financeiroTitulos';
import S_financeiroTitulos from '@/services/S_financeiroTitulos';

interface Props {
  titulo: T_TituloFinanceiro;
  onFechar: () => void;
}

const FORMA_PAGAMENTO_LABEL: Record<string, string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  transferencia: 'Transferência',
  boleto: 'Boleto',
  cartao: 'Cartão',
  cheque: 'Cheque',
  outro: 'Outro',
};

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

const BaixasListModal: React.FC<Props> = ({ titulo, onFechar }) => {
  const [baixas, setBaixas] = useState<T_BaixaTitulo[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!titulo._id) return;
    const fetchBaixas = async () => {
      setLoading(true);
      setErro('');
      try {
        const data = await S_financeiroTitulos.getBaixasByTituloId(titulo._id!);
        setBaixas(data);
      } catch {
        setErro('Erro ao carregar o histórico de baixas.');
      } finally {
        setLoading(false);
      }
    };
    fetchBaixas();
  }, [titulo._id]);

  const totalBaixado = baixas.reduce((acc, b) => acc + b.valor, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Histórico de Baixas</h2>
            <p className="text-sm text-gray-500">{titulo.descricao}</p>
          </div>
          <button
            onClick={onFechar}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && <p className="text-gray-500 text-center py-4">Carregando...</p>}
          {erro && <p className="text-red-500 text-center py-4">{erro}</p>}

          {!loading && !erro && baixas.length === 0 && (
            <p className="text-gray-500 text-center py-4">Nenhuma baixa registrada.</p>
          )}

          {!loading && !erro && baixas.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700">Data</th>
                    <th className="px-3 py-2 text-right text-sm font-semibold text-gray-700">Valor</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700">Forma Pgto.</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700">Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {baixas.map((baixa, idx) => (
                    <tr key={baixa._id ?? idx} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-700">{formatDateBR(baixa.dataBaixa)}</td>
                      <td className="px-3 py-2 text-sm text-gray-700 text-right font-medium">
                        {formatCurrency(baixa.valor)}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {baixa.formaPagamento ? FORMA_PAGAMENTO_LABEL[baixa.formaPagamento] ?? baixa.formaPagamento : '-'}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-600">{baixa.observacoes ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-3 py-2 text-sm font-semibold text-gray-700">Total</td>
                    <td className="px-3 py-2 text-sm font-bold text-gray-800 text-right">
                      {formatCurrency(totalBaixado)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onFechar}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default BaixasListModal;
