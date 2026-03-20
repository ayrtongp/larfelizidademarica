import React, { useEffect, useState } from 'react';
import { T_TituloFinanceiro } from '@/types/T_financeiroTitulos';
import TextInputM2 from '@/components/Formularios/TextInputM2';
import Date_M3 from '@/components/Formularios/Date_M3';
import Button_M3 from '@/components/Formularios/Button_M3';

interface CategoriaItem {
  _id: string;
  nome: string;
  tipo: string;
}

interface ContaItem {
  _id: string;
  nome: string;
  ativo: boolean;
}

interface Props {
  tipo: 'receber' | 'pagar';
  titulo?: T_TituloFinanceiro;
  onSave: (data: Partial<T_TituloFinanceiro>) => Promise<void>;
  onCancel: () => void;
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

const TituloForm: React.FC<Props> = ({ tipo, titulo, onSave, onCancel, saving = false }) => {
  const isEditing = !!titulo?._id;

  const [form, setForm] = useState<Partial<T_TituloFinanceiro>>({
    tipo,
    descricao: titulo?.descricao ?? '',
    categoriaId: titulo?.categoriaId ?? '',
    vencimento: titulo?.vencimento ?? '',
    competencia: titulo?.competencia ?? '',
    valorOriginal: titulo?.valorOriginal ?? 0,
    descontos: titulo?.descontos ?? 0,
    juros: titulo?.juros ?? 0,
    multa: titulo?.multa ?? 0,
    observacoes: titulo?.observacoes ?? '',
  });

  const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);

  useEffect(() => {
    const fetchCategorias = async () => {
      setLoadingCategorias(true);
      try {
        const res = await fetch(`/api/Controller/C_financeiroCategorias?type=getAll`);
        if (res.ok) {
          const data: CategoriaItem[] = await res.json();
          setCategorias(data.filter((c) => c.tipo === tipo || c.tipo === 'ambos'));
        }
      } catch {
        // silencioso
      } finally {
        setLoadingCategorias(false);
      }
    };
    fetchCategorias();
  }, [tipo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMoneyChange = (name: string, value: string) => {
    const numVal = parseFloat(value.replace(',', '.')) || 0;
    setForm((prev) => ({ ...prev, [name]: numVal }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tipo */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-1">Tipo</label>
          <input
            type="text"
            value={tipo === 'receber' ? 'A Receber' : 'A Pagar'}
            disabled
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-500 bg-gray-100 leading-tight"
          />
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-1">Categoria *</label>
          <select
            name="categoriaId"
            value={form.categoriaId}
            onChange={handleChange}
            required
            disabled={loadingCategorias}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline cursor-pointer"
          >
            <option value="">Selecione uma categoria...</option>
            {categorias.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Descrição */}
      <TextInputM2
        label="Descrição *"
        name="descricao"
        value={form.descricao ?? ''}
        onChange={handleChange}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vencimento */}
        <Date_M3
          name="vencimento"
          label="Vencimento *"
          value={form.vencimento ?? ''}
          onChange={handleChange}
          disabled={false}
        />

        {/* Competência */}
        <Date_M3
          name="competencia"
          label="Competência (opcional)"
          value={form.competencia ?? ''}
          onChange={handleChange}
          disabled={false}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Valor Original */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-1">Valor Original *</label>
          <input
            type="number"
            name="valorOriginal"
            value={form.valorOriginal ?? 0}
            min={0}
            step="0.01"
            required
            onChange={(e) => handleMoneyChange('valorOriginal', e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        {/* Descontos */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-1">Descontos</label>
          <input
            type="number"
            name="descontos"
            value={form.descontos ?? 0}
            min={0}
            step="0.01"
            onChange={(e) => handleMoneyChange('descontos', e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Juros */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-1">Juros</label>
          <input
            type="number"
            name="juros"
            value={form.juros ?? 0}
            min={0}
            step="0.01"
            onChange={(e) => handleMoneyChange('juros', e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        {/* Multa */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-1">Multa</label>
          <input
            type="number"
            name="multa"
            value={form.multa ?? 0}
            min={0}
            step="0.01"
            onChange={(e) => handleMoneyChange('multa', e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
      </div>

      {/* Observações */}
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1">Observações</label>
        <textarea
          name="observacoes"
          value={form.observacoes ?? ''}
          onChange={handleChange}
          rows={3}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button_M3
          label="Cancelar"
          onClick={onCancel}
          bgColor="gray"
          type="button"
        />
        <Button_M3
          label={saving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Título'}
          onClick={() => {}}
          bgColor="green"
          type="submit"
          disabled={saving}
        />
      </div>
    </form>
  );
};

export default TituloForm;
