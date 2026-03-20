import React, { useEffect, useState } from 'react';
import { T_ContaFinanceira, ModeloImportacao } from '@/types/T_financeiroContas';
import Button_M3 from '@/components/Formularios/Button_M3';
import TextInputM2 from '@/components/Formularios/TextInputM2';
import MoneyInputM2 from '@/components/Formularios/MoneyInputM2';

const MODELOS_IMPORTACAO: { value: ModeloImportacao; label: string }[] = [
  { value: '', label: 'Nenhum (manual)' },
  { value: 'inter_pj', label: 'Banco Inter PJ' },
];

interface Props {
  onSave: (data: T_ContaFinanceira) => void;
  initialData?: T_ContaFinanceira;
  loading?: boolean;
}

const defaultForm: T_ContaFinanceira = {
  nome: '',
  tipo: 'caixa',
  banco: '',
  saldoInicial: 0,
  ativo: true,
  modeloImportacao: '',
  observacoes: '',
};

const ContaFinanceiraForm: React.FC<Props> = ({ onSave, initialData, loading = false }) => {
  const [form, setForm] = useState<T_ContaFinanceira>(defaultForm);

  useEffect(() => {
    if (initialData) {
      setForm({ ...defaultForm, ...initialData });
    } else {
      setForm(defaultForm);
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMoneyChange = (value: number) => {
    setForm((prev) => ({ ...prev, saldoInicial: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextInputM2
        label="Nome da Conta *"
        name="nome"
        value={form.nome}
        onChange={handleChange}
      />

      <div>
        <label className="block text-gray-700 text-left pl-1 text-sm font-bold mb-1" htmlFor="tipo">
          Tipo *
        </label>
        <select
          id="tipo"
          name="tipo"
          value={form.tipo}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          required
        >
          <option value="caixa">Caixa</option>
          <option value="banco">Banco</option>
          <option value="aplicacao">Aplicação</option>
        </select>
      </div>

      {form.tipo === 'banco' && (
        <TextInputM2
          label="Nome do Banco"
          name="banco"
          value={form.banco ?? ''}
          onChange={handleChange}
        />
      )}

      <div>
        <label className="block text-gray-700 text-left pl-1 text-sm font-bold mb-1" htmlFor="modeloImportacao">
          Modelo de Importação de Extrato
        </label>
        <select
          id="modeloImportacao"
          name="modeloImportacao"
          value={form.modeloImportacao ?? ''}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          {MODELOS_IMPORTACAO.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">Define o formato usado para importar extratos em lote nesta conta.</p>
      </div>

      <MoneyInputM2
        label="Saldo Inicial *"
        name="saldoInicial"
        value={form.saldoInicial}
        onChange={handleMoneyChange}
        required
      />

      <div>
        <label className="block text-gray-700 text-left pl-1 text-sm font-bold mb-1" htmlFor="observacoes">
          Observações (opcional)
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          value={form.observacoes ?? ''}
          onChange={handleChange}
          rows={3}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-none"
        />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <input
          id="ativo"
          type="checkbox"
          name="ativo"
          checked={form.ativo}
          onChange={handleCheckboxChange}
          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
          Conta ativa
        </label>
      </div>

      <div className="flex justify-end pt-2">
        <Button_M3
          label={loading ? 'Salvando...' : 'Salvar'}
          onClick={() => {}}
          type="submit"
          disabled={loading}
        />
      </div>
    </form>
  );
};

export default ContaFinanceiraForm;
