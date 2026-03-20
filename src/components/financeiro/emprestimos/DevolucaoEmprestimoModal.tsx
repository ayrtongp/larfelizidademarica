import React, { useState, useEffect } from 'react';
import MoneyInputM2 from '@/components/Formularios/MoneyInputM2';
import Button_M3 from '@/components/Formularios/Button_M3';
import { T_Emprestimo } from '@/types/T_financeiroEmprestimos';

interface Conta {
  _id: string;
  nome: string;
}

interface Props {
  emprestimo: T_Emprestimo;
  onSave: (data: { valor: number; dataDevolucao: string; contaFinanceiraId: string; formaPagamento?: string; observacoes?: string }) => Promise<void>;
  onClose: () => void;
}

const hoje = () => new Date().toISOString().slice(0, 10);

const FORMAS_PAGAMENTO = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'cartao_debito', label: 'Cartão Débito' },
  { value: 'cartao_credito', label: 'Cartão Crédito' },
  { value: 'cheque', label: 'Cheque' },
];

const DevolucaoEmprestimoModal: React.FC<Props> = ({ emprestimo, onSave, onClose }) => {
  const [valor, setValor] = useState(emprestimo.valorEmAberto);
  const [dataDevolucao, setDataDevolucao] = useState(hoje());
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

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (valor <= 0 || !dataDevolucao || !contaFinanceiraId) return;
    setLoading(true);
    try {
      await onSave({ valor, dataDevolucao, contaFinanceiraId, formaPagamento: formaPagamento || undefined, observacoes: observacoes || undefined });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-1">Registrar Devolução</h2>
          <p className="text-sm text-gray-500 mb-4">{emprestimo.descricao}</p>

          <div className="bg-gray-50 rounded p-3 mb-4 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Tipo:</span>
              <span className="font-medium capitalize">{emprestimo.tipo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Valor Original:</span>
              <span className="font-medium">{formatCurrency(emprestimo.valorOriginal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Em Aberto:</span>
              <span className="font-semibold text-red-600">{formatCurrency(emprestimo.valorEmAberto)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <MoneyInputM2
              label="Valor da Devolução *"
              name="valor"
              value={valor}
              onChange={(v) => setValor(v)}
            />

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Data da Devolução *</label>
              <input
                type="date"
                value={dataDevolucao}
                onChange={(e) => setDataDevolucao(e.target.value)}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Conta Financeira *</label>
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
              <label className="block text-gray-700 text-sm font-bold mb-1">Forma de Pagamento</label>
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
              <Button_M3 label={loading ? 'Salvando...' : 'Confirmar Devolução'} onClick={() => {}} type="submit" disabled={loading} />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DevolucaoEmprestimoModal;
