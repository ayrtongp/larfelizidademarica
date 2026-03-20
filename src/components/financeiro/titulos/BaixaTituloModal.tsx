import React, { useEffect, useState } from 'react';
import { T_TituloFinanceiro, T_BaixaTitulo } from '@/types/T_financeiroTitulos';
import Button_M3 from '@/components/Formularios/Button_M3';

interface ContaItem {
  _id: string;
  nome: string;
  ativo: boolean;
}

interface Props {
  titulo: T_TituloFinanceiro;
  onConfirmar: (baixaData: Omit<T_BaixaTitulo, '_id' | 'tituloId' | 'createdAt'>) => Promise<void>;
  onFechar: () => void;
  saving?: boolean;
}

const formaPagamentoOptions = [
  { value: '', label: 'Selecione...' },
  { value: 'pix', label: 'PIX' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'outro', label: 'Outro' },
];

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

const BaixaTituloModal: React.FC<Props> = ({ titulo, onConfirmar, onFechar, saving = false }) => {
  const [contas, setContas] = useState<ContaItem[]>([]);
  const [loadingContas, setLoadingContas] = useState(false);

  const [valor, setValor] = useState<number>(titulo.saldo);
  const [dataBaixa, setDataBaixa] = useState<string>(getTodayISO());
  const [contaFinanceiraId, setContaFinanceiraId] = useState<string>('');
  const [formaPagamento, setFormaPagamento] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [erro, setErro] = useState<string>('');

  useEffect(() => {
    const fetchContas = async () => {
      setLoadingContas(true);
      try {
        const res = await fetch('/api/Controller/C_financeiroContas?type=getAll');
        if (res.ok) {
          const data: ContaItem[] = await res.json();
          setContas(data.filter((c) => c.ativo));
        }
      } catch {
        // silencioso
      } finally {
        setLoadingContas(false);
      }
    };
    fetchContas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (valor <= 0) {
      setErro('O valor deve ser maior que zero.');
      return;
    }
    if (valor > titulo.saldo) {
      setErro(`O valor não pode ser maior que o saldo (${titulo.saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}).`);
      return;
    }
    if (!contaFinanceiraId) {
      setErro('Selecione uma conta financeira.');
      return;
    }
    if (!dataBaixa) {
      setErro('Informe a data da baixa.');
      return;
    }

    await onConfirmar({
      valor,
      dataBaixa,
      contaFinanceiraId,
      ...(formaPagamento && { formaPagamento }),
      ...(observacoes && { observacoes }),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Registrar Baixa</h2>
          <button
            onClick={onFechar}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Info do título */}
          <div className="bg-gray-50 rounded-md p-3 text-sm">
            <p className="text-gray-600"><span className="font-medium">Título:</span> {titulo.descricao}</p>
            <p className="text-gray-600">
              <span className="font-medium">Saldo atual:</span>{' '}
              <span className="font-bold text-green-700">
                {titulo.saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </p>
          </div>

          {/* Valor */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-1">Valor da Baixa *</label>
            <input
              type="number"
              value={valor}
              min={0.01}
              max={titulo.saldo}
              step="0.01"
              required
              onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          {/* Data da Baixa */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-1">Data da Baixa *</label>
            <input
              type="date"
              value={dataBaixa}
              required
              onChange={(e) => setDataBaixa(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          {/* Conta Financeira */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-1">Conta Financeira *</label>
            <select
              value={contaFinanceiraId}
              required
              onChange={(e) => setContaFinanceiraId(e.target.value)}
              disabled={loadingContas}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline cursor-pointer"
            >
              <option value="">
                {loadingContas ? 'Carregando...' : 'Selecione uma conta...'}
              </option>
              {contas.map((conta) => (
                <option key={conta._id} value={conta._id}>
                  {conta.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Forma de Pagamento */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-1">Forma de Pagamento</label>
            <select
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline cursor-pointer"
            >
              {formaPagamentoOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-1">Observações</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          {erro && (
            <p className="text-red-500 text-sm">{erro}</p>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button_M3
              label="Cancelar"
              onClick={onFechar}
              bgColor="gray"
              type="button"
            />
            <Button_M3
              label={saving ? 'Confirmando...' : 'Confirmar Baixa'}
              onClick={() => {}}
              bgColor="green"
              type="submit"
              disabled={saving}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default BaixaTituloModal;
