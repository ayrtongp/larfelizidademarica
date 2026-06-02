import React, { useState } from 'react';
import MoneyInputM2 from '@/components/Formularios/MoneyInputM2';
import Button_M3 from '@/components/Formularios/Button_M3';
import { T_TituloFinanceiro } from '@/types/T_financeiroTitulos';

interface Props {
  parcela: T_TituloFinanceiro;
  onSave: (data: { valorOriginal?: number; vencimento?: string; observacoes?: string }) => Promise<void>;
  onClose: () => void;
}

const EditParcelaModal: React.FC<Props> = ({ parcela, onSave, onClose }) => {
  const [valorOriginal, setValorOriginal] = useState(parcela.valorOriginal);
  const [vencimento, setVencimento] = useState(parcela.vencimento);
  const [observacoes, setObservacoes] = useState(parcela.observacoes ?? '');
  const [loading, setLoading] = useState(false);

  const podeEditarValor = parcela.valorLiquidado === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vencimento) return;
    setLoading(true);
    try {
      await onSave({
        ...(podeEditarValor && { valorOriginal }),
        vencimento,
        observacoes,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-1">Editar Parcela</h2>
          <p className="text-sm text-gray-500 mb-4">{parcela.descricao}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {podeEditarValor ? (
              <MoneyInputM2
                label="Valor *"
                name="valorOriginal"
                value={valorOriginal}
                onChange={(v) => setValorOriginal(v)}
                required
              />
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-700">
                Valor não pode ser alterado pois já há pagamento registrado nesta parcela.
              </div>
            )}

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Vencimento *</label>
              <input
                type="date"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
                required
              />
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
                label={loading ? 'Salvando...' : 'Salvar'}
                onClick={() => {}}
                type="submit"
                disabled={loading}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditParcelaModal;
