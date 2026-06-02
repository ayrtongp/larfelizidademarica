import React, { useState, useEffect } from 'react';
import MoneyInputM2 from '@/components/Formularios/MoneyInputM2';
import Button_M3 from '@/components/Formularios/Button_M3';
import { T_TituloFinanceiro } from '@/types/T_financeiroTitulos';

interface Conta {
  _id: string;
  nome: string;
}

interface Props {
  parcela: T_TituloFinanceiro;
  onSave: (data: { valor: number; dataBaixa: string; contaFinanceiraId: string; formaPagamento?: string; observacoes?: string }) => Promise<void>;
  onClose: () => void;
}

const hoje = () => new Date().toISOString().slice(0, 10);

const FORMAS_PAGAMENTO = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'cheque', label: 'Cheque' },
];

const formatCurrency = (v: number) =>
  v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? '-';

const formatDate = (d?: string) => {
  if (!d) return '-';
  const [y, m, day] = d.slice(0, 10).split('-');
  return `${day}/${m}/${y}`;
};

const BaixaParcelaModal: React.FC<Props> = ({ parcela, onSave, onClose }) => {
  const [valor, setValor] = useState(parcela.saldo);
  const [dataBaixa, setDataBaixa] = useState(hoje());
  const [contaFinanceiraId, setContaFinanceiraId] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/Controller/C_financeiroContas?type=getAll&ativo=true')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setContas(data); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (valor <= 0 || !dataBaixa || !contaFinanceiraId) return;
    setLoading(true);
    try {
      await onSave({ valor, dataBaixa, contaFinanceiraId, formaPagamento: formaPagamento || undefined, observacoes: observacoes || undefined });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-1">Registrar Pagamento</h2>
          <p className="text-sm text-gray-500 mb-4">{parcela.descricao}</p>

          <div className="bg-gray-50 rounded p-3 mb-4 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Vencimento</span>
              <span className="font-medium">{formatDate(parcela.vencimento)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Valor original</span>
              <span className="font-medium">{formatCurrency(parcela.valorOriginal)}</span>
            </div>
            {parcela.valorLiquidado > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Já pago</span>
                <span className="font-medium text-green-600">{formatCurrency(parcela.valorLiquidado)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
              <span className="text-gray-600 font-medium">Saldo em aberto</span>
              <span className="font-semibold text-red-600">{formatCurrency(parcela.saldo)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <MoneyInputM2
              label="Valor do pagamento *"
              name="valor"
              value={valor}
              onChange={(v) => setValor(v)}
            />

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Data do pagamento *</label>
              <input
                type="date"
                value={dataBaixa}
                onChange={(e) => setDataBaixa(e.target.value)}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Conta financeira *</label>
              <select
                value={contaFinanceiraId}
                onChange={(e) => setContaFinanceiraId(e.target.value)}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
                required
              >
                <option value="">Selecione uma conta</option>
                {contas.map((c) => (
                  <option key={c._id} value={c._id}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Forma de pagamento</label>
              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
              >
                <option value="">Selecione</option>
                {FORMAS_PAGAMENTO.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Observações</label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={2}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button_M3 label="Cancelar" onClick={onClose} bgColor="gray" type="button" />
              <Button_M3
                label={loading ? 'Salvando...' : 'Confirmar Pagamento'}
                onClick={() => {}}
                type="submit"
                disabled={loading || valor <= 0 || !contaFinanceiraId}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BaixaParcelaModal;
