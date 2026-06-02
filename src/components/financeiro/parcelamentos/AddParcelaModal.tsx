import React, { useState } from 'react';
import MoneyInputM2 from '@/components/Formularios/MoneyInputM2';
import Button_M3 from '@/components/Formularios/Button_M3';
import { T_Parcelamento } from '@/types/T_financeiroParcelamentos';

interface Props {
  parcelamento: T_Parcelamento;
  onSave: (data: { valor: number; vencimento: string; numeroParcela: number; observacoes?: string }) => Promise<void>;
  onClose: () => void;
}

const hoje = () => new Date().toISOString().slice(0, 10);

const AddParcelaModal: React.FC<Props> = ({ parcelamento, onSave, onClose }) => {
  const proximaNumeroParcela = (parcelamento.parcelasJaPagas || 0) + (parcelamento.parcelasPagas || 0) + 1;

  const [valor, setValor] = useState(0);
  const [vencimento, setVencimento] = useState(hoje());
  const [numeroParcela, setNumeroParcela] = useState(proximaNumeroParcela);
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);

  const totalParcelas = parcelamento.numeroParcelas;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (valor <= 0 || !vencimento) return;
    setLoading(true);
    try {
      await onSave({
        valor,
        vencimento,
        numeroParcela,
        observacoes: observacoes || undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-1">Adicionar Parcela</h2>
          <p className="text-sm text-gray-500 mb-4">{parcelamento.descricao}</p>

          <div className="bg-gray-50 rounded p-3 mb-4 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Sistema:</span>
              <span className="font-medium capitalize">{parcelamento.sistemaAmortizacao}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Parcelas pagas (total):</span>
              <span className="font-medium">
                {(parcelamento.parcelasJaPagas || 0) + (parcelamento.parcelasPagas || 0)}
                {totalParcelas > 0 && ` / ${totalParcelas}`}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Número da Parcela</label>
              <input
                type="number"
                value={numeroParcela}
                onChange={(e) => setNumeroParcela(Number(e.target.value))}
                min="1"
                className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
              />
              {totalParcelas > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">de {totalParcelas} total</p>
              )}
            </div>

            <MoneyInputM2
              label="Valor da Parcela *"
              name="valor"
              value={valor}
              onChange={(v) => setValor(v)}
            />

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Vencimento *</label>
              <input
                type="date"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
                required
              />
              <p className="text-xs text-gray-400 mt-0.5">
                Informe o último dia útil do mês conforme o boleto da Receita Federal.
              </p>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Observações</label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={2}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
                placeholder="Ex: Boleto ref. maio/2025"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button_M3 label="Cancelar" onClick={onClose} bgColor="gray" type="button" />
              <Button_M3
                label={loading ? 'Salvando...' : 'Adicionar Parcela'}
                onClick={() => {}}
                type="submit"
                disabled={loading || valor <= 0}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddParcelaModal;
