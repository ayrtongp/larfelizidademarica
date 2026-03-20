import React, { useState, useEffect } from 'react';
import TextInputM2 from '@/components/Formularios/TextInputM2';
import MoneyInputM2 from '@/components/Formularios/MoneyInputM2';
import Button_M3 from '@/components/Formularios/Button_M3';
import { T_Recorrencia } from '@/types/T_financeiroRecorrencias';

interface Categoria {
  _id: string;
  nome: string;
  tipo: string;
}

interface Props {
  recorrencia?: T_Recorrencia | null;
  onSave: (data: Partial<T_Recorrencia>) => Promise<void>;
  onCancel: () => void;
}

const RecorrenciaForm: React.FC<Props> = ({ recorrencia, onSave, onCancel }) => {
  const [tipo, setTipo] = useState<'pagar' | 'receber'>(recorrencia?.tipo || 'pagar');
  const [descricaoPadrao, setDescricaoPadrao] = useState(recorrencia?.descricaoPadrao || '');
  const [categoriaId, setCategoriaId] = useState(recorrencia?.categoriaId || '');
  const [valorPadrao, setValorPadrao] = useState(recorrencia?.valorPadrao || 0);
  const [diaVencimento, setDiaVencimento] = useState(recorrencia?.diaVencimento || 1);
  const [dataInicio, setDataInicio] = useState(recorrencia?.dataInicio || '');
  const [dataFim, setDataFim] = useState(recorrencia?.dataFim || '');
  const [ativo, setAtivo] = useState(recorrencia?.ativo !== undefined ? recorrencia.ativo : true);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/Controller/C_financeiroCategorias?type=getAll')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCategorias(data); })
      .catch(() => {});
  }, []);

  const categoriasFiltradas = categorias.filter((c) =>
    tipo === 'pagar' ? c.tipo === 'despesa' : c.tipo === 'receita'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricaoPadrao || !categoriaId || valorPadrao <= 0 || !diaVencimento || !dataInicio) return;
    setLoading(true);
    try {
      await onSave({
        tipo,
        descricaoPadrao,
        categoriaId,
        valorPadrao,
        diaVencimento,
        frequencia: 'mensal',
        dataInicio,
        dataFim: dataFim || undefined,
        ativo,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1">Tipo</label>
        <select
          value={tipo}
          onChange={(e) => { setTipo(e.target.value as 'pagar' | 'receber'); setCategoriaId(''); }}
          className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
        >
          <option value="pagar">Pagar</option>
          <option value="receber">Receber</option>
        </select>
      </div>

      <TextInputM2
        label="Descrição Padrão *"
        name="descricaoPadrao"
        value={descricaoPadrao}
        onChange={(e) => setDescricaoPadrao(e.target.value)}
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

      <MoneyInputM2
        label="Valor Padrão *"
        name="valorPadrao"
        value={valorPadrao}
        onChange={(v) => setValorPadrao(v)}
      />

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1">Dia de Vencimento * (1-28)</label>
        <input
          type="number"
          min={1}
          max={28}
          value={diaVencimento}
          onChange={(e) => setDiaVencimento(Number(e.target.value))}
          className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1">Data de Início *</label>
        <input
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1">Data de Fim (opcional)</label>
        <input
          type="date"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="ativo"
          checked={ativo}
          onChange={(e) => setAtivo(e.target.checked)}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
        />
        <label htmlFor="ativo" className="text-gray-700 text-sm font-medium">Ativo</label>
      </div>

      <div className="flex gap-3 justify-end">
        <Button_M3 label="Cancelar" onClick={onCancel} bgColor="gray" type="button" />
        <Button_M3 label={loading ? 'Salvando...' : 'Salvar'} onClick={() => {}} type="submit" disabled={loading} />
      </div>
    </form>
  );
};

export default RecorrenciaForm;
