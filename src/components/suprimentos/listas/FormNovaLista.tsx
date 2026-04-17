import React, { useState } from 'react';
import { TipoLista, TIPO_LISTA_CONFIG } from '@/types/T_listaCompras';
import Button_M3 from '@/components/Formularios/Button_M3';

interface FormData {
  tipo: TipoLista;
  titulo: string;
  data: string;
  observacoes: string;
}

interface Props {
  onSave: (data: FormData) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
  tipoInicial?: TipoLista;
  tituloInicial?: string;
}

const FormNovaLista: React.FC<Props> = ({ onSave, onCancel, saving, tipoInicial, tituloInicial }) => {
  const hoje = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState<FormData>({
    tipo: tipoInicial ?? 'mercado',
    titulo: tituloInicial ?? '',
    data: hoje,
    observacoes: '',
  });
  const [erro, setErro] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim()) { setErro('Informe um título para a lista.'); return; }
    if (!form.data) { setErro('Informe a data prevista.'); return; }
    setErro('');
    await onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Tipo */}
      <div>
        <p className="text-xs font-bold text-gray-700 mb-2">Tipo de lista</p>
        <div className="flex gap-3">
          {(['mercado', 'sacolao'] as TipoLista[]).map((t) => {
            const cfg = TIPO_LISTA_CONFIG[t];
            const ativo = form.tipo === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setForm((p) => ({ ...p, tipo: t }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors
                  ${ativo ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
              >
                <span>{cfg.emoji}</span>
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Título */}
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.titulo}
          onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
          maxLength={80}
          placeholder="Ex: Compras da semana"
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {/* Data prevista */}
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">
          Data prevista da compra <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={form.data}
          onChange={(e) => setForm((p) => ({ ...p, data: e.target.value }))}
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {/* Observações */}
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">Observações</label>
        <textarea
          value={form.observacoes}
          onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))}
          rows={3}
          placeholder="Instruções gerais, restrições alimentares..."
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
        />
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <div className="flex gap-3 pt-2">
        <Button_M3 label="Cancelar" bgColor="gray" type="button" onClick={onCancel} disabled={saving} />
        <Button_M3 label={saving ? 'Criando...' : 'Criar Lista'} bgColor="green" type="submit" onClick={() => {}} disabled={saving} />
      </div>
    </form>
  );
};

export default FormNovaLista;
