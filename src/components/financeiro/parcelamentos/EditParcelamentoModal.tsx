import React, { useState, useEffect } from 'react';
import TextInputM2 from '@/components/Formularios/TextInputM2';
import Button_M3 from '@/components/Formularios/Button_M3';
import { T_Parcelamento } from '@/types/T_financeiroParcelamentos';

interface Categoria {
  _id: string;
  nome: string;
  tipo: string;
}

interface Props {
  parcelamento: T_Parcelamento;
  onSave: (data: { descricao: string; categoriaId: string; numeroParcelas: number; observacoes: string }) => Promise<void>;
  onClose: () => void;
}

const EditParcelamentoModal: React.FC<Props> = ({ parcelamento, onSave, onClose }) => {
  const [descricao, setDescricao] = useState(parcelamento.descricao);
  const [categoriaId, setCategoriaId] = useState(parcelamento.categoriaId);
  const [numeroParcelas, setNumeroParcelas] = useState(parcelamento.numeroParcelas);
  const [observacoes, setObservacoes] = useState(parcelamento.observacoes ?? '');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/Controller/C_financeiroCategorias?type=getAll')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCategorias(data); })
      .catch(() => {});
  }, []);

  const categoriasFiltradas = categorias.filter((c) =>
    parcelamento.tipo === 'pagar' ? c.tipo === 'despesa' : c.tipo === 'receita'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || !categoriaId) return;
    setLoading(true);
    try {
      await onSave({ descricao, categoriaId, numeroParcelas, observacoes });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Editar Parcelamento</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <TextInputM2
              label="Descrição *"
              name="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Categoria *</label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
                required
              >
                <option value="">Selecione uma categoria</option>
                {categoriasFiltradas.map((c) => (
                  <option key={c._id} value={c._id}>{c.nome}</option>
                ))}
              </select>
            </div>

            {parcelamento.sistemaAmortizacao === 'variavel' && (
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-1">Total de parcelas do acordo</label>
                <input
                  type="number"
                  value={numeroParcelas}
                  onChange={(e) => setNumeroParcelas(Number(e.target.value))}
                  min="0"
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
                  placeholder="0 = desconhecido"
                />
              </div>
            )}

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Observações</label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
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

export default EditParcelamentoModal;
