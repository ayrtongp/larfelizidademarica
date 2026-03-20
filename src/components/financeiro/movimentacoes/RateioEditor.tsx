import React, { useEffect, useState } from 'react';
import MoneyInputM2 from '@/components/Formularios/MoneyInputM2';
import TextInputM2 from '@/components/Formularios/TextInputM2';
import PessoaCombobox, { PessoaItem } from '@/components/financeiro/shared/PessoaCombobox';

export interface RateioRow {
  categoriaId: string;
  descricao: string;
  valor: number;
  vinculadoId?: string;
  vinculadoTipo?: 'usuario' | 'residente';
}

interface Categoria {
  _id: string;
  nome: string;
}

interface Props {
  valor: number;
  rateios: RateioRow[];
  onChange: (rateios: RateioRow[]) => void;
  pessoas: PessoaItem[];
}

export default function RateioEditor({ valor, rateios, onChange, pessoas }: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    fetch('/api/Controller/C_financeiroCategorias?type=getAll')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setCategorias(Array.isArray(data) ? data : []))
      .catch(() => setCategorias([]));
  }, []);

  const total = rateios.reduce((acc, r) => acc + (Number(r.valor) || 0), 0);
  const diferenca = Math.abs(total - valor);
  const totalOk = diferenca <= 0.001;

  function addLinha() {
    onChange([...rateios, { categoriaId: '', descricao: '', valor: 0, vinculadoId: '', vinculadoTipo: undefined }]);
  }

  function removeLinha(index: number) {
    onChange(rateios.filter((_, i) => i !== index));
  }

  function updateLinha(index: number, field: keyof RateioRow, value: any) {
    const updated = rateios.map((r, i) => i === index ? { ...r, [field]: value } : r);
    onChange(updated);
  }

  function updatePessoa(index: number, id: string, tipo: 'usuario' | 'residente' | '') {
    const updated = rateios.map((r, i) =>
      i === index ? { ...r, vinculadoId: id || undefined, vinculadoTipo: (tipo || undefined) as 'usuario' | 'residente' | undefined } : r
    );
    onChange(updated);
  }

  return (
    <div className="border rounded-md p-4 bg-gray-50 space-y-3">
      <h4 className="text-sm font-semibold text-gray-700">Rateios</h4>

      {rateios.map((rateio, index) => (
        <div key={index} className="flex flex-col gap-2 border border-gray-200 rounded bg-white p-3">
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
            <div className="flex-1">
              <label className="block text-gray-700 text-sm font-bold mb-1">Categoria</label>
              <select
                value={rateio.categoriaId}
                onChange={(e) => updateLinha(index, 'categoriaId', e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Selecione...</option>
                {categorias.map((c) => (
                  <option key={c._id} value={c._id}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <TextInputM2
                label="Descrição"
                name={`rateio_descricao_${index}`}
                value={rateio.descricao}
                onChange={(e) => updateLinha(index, 'descricao', e.target.value)}
              />
            </div>

            <div className="w-40">
              <MoneyInputM2
                label="Valor"
                name={`rateio_valor_${index}`}
                value={rateio.valor}
                onChange={(v) => updateLinha(index, 'valor', v)}
              />
            </div>

            <button
              type="button"
              onClick={() => removeLinha(index)}
              className="text-red-500 hover:text-red-700 font-bold px-2 py-2 mt-1"
              title="Remover linha"
            >
              &times;
            </button>
          </div>

          {pessoas.length > 0 && (
            <div>
              <label className="block text-gray-700 text-xs font-bold mb-1">Vincular pessoa (opcional)</label>
              <PessoaCombobox
                pessoas={pessoas}
                value={rateio.vinculadoId ?? ''}
                onChange={(id, tipo) => updatePessoa(index, id, tipo)}
                placeholder="Pesquisar usuário ou residente..."
              />
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addLinha}
        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
      >
        + Adicionar linha
      </button>

      <div className={`text-sm font-semibold mt-2 ${totalOk ? 'text-green-600' : 'text-red-600'}`}>
        Total rateado: R$ {total.toFixed(2).replace('.', ',')} / R$ {valor.toFixed(2).replace('.', ',')}
        {!totalOk && (
          <span className="ml-2">(diferença: R$ {diferenca.toFixed(2).replace('.', ',')})</span>
        )}
        {totalOk && <span className="ml-2">✓</span>}
      </div>
    </div>
  );
}
