import React, { useState, useEffect } from 'react';
import TextInputM2 from '@/components/Formularios/TextInputM2';
import MoneyInputM2 from '@/components/Formularios/MoneyInputM2';
import Button_M3 from '@/components/Formularios/Button_M3';
import { SistemaAmortizacao, T_SimulacaoParcela } from '@/types/T_financeiroParcelamentos';
import S_financeiroParcelamentos from '@/services/S_financeiroParcelamentos';

interface Categoria {
  _id: string;
  nome: string;
  tipo: string;
}

interface Props {
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (d: string) => {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

const ParcelamentoForm: React.FC<Props> = ({ onSave, onCancel }) => {
  const [tipo, setTipo] = useState<'pagar' | 'receber'>('pagar');
  const [descricao, setDescricao] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [valorFinanciado, setValorFinanciado] = useState(0);
  const [taxaJuros, setTaxaJuros] = useState(0);
  const [sistemaAmortizacao, setSistemaAmortizacao] = useState<SistemaAmortizacao>('fixo');
  const [numeroParcelas, setNumeroParcelas] = useState(12);
  const [parcelasJaPagas, setParcelasJaPagas] = useState(0);
  const [emAndamento, setEmAndamento] = useState(false);
  const [primeiroPagamento, setPrimeiroPagamento] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [simulacao, setSimulacao] = useState<T_SimulacaoParcela[] | null>(null);
  const [valorTotalSimulado, setValorTotalSimulado] = useState(0);
  const [loadingSimular, setLoadingSimular] = useState(false);
  const [loading, setLoading] = useState(false);
  const [etapa, setEtapa] = useState<'form' | 'simulacao'>('form');

  useEffect(() => {
    fetch('/api/Controller/C_financeiroCategorias?type=getAll')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCategorias(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setSimulacao(null);
    setEtapa('form');
  }, [valorFinanciado, numeroParcelas, taxaJuros, sistemaAmortizacao, primeiroPagamento]);

  const categoriasFiltradas = categorias.filter((c) =>
    tipo === 'pagar' ? c.tipo === 'despesa' : c.tipo === 'receita'
  );

  const handleSimular = async () => {
    if (!valorFinanciado || valorFinanciado <= 0) return;
    setLoadingSimular(true);
    try {
      const result = await S_financeiroParcelamentos.simular({
        valorFinanciado,
        numeroParcelas,
        taxaJuros,
        sistemaAmortizacao,
        primeiroPagamento,
      });
      setSimulacao(result.parcelas);
      setValorTotalSimulado(result.valorTotal);
      setEtapa('simulacao');
    } catch {
      alert('Erro ao simular parcelamento.');
    } finally {
      setLoadingSimular(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || !categoriaId) return;
    if (sistemaAmortizacao !== 'variavel' && (!primeiroPagamento || valorFinanciado <= 0)) return;
    if (sistemaAmortizacao !== 'variavel' && numeroParcelas < 2) return;
    setLoading(true);
    try {
      await onSave({
        tipo,
        descricao,
        categoriaId,
        valorFinanciado,
        taxaJuros: taxaJuros || 0,
        sistemaAmortizacao,
        numeroParcelas: sistemaAmortizacao !== 'variavel' ? numeroParcelas : 0,
        parcelasJaPagas: parcelasJaPagas || 0,
        primeiroPagamento,
        observacoes: observacoes || undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  if (etapa === 'simulacao' && simulacao) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-800">Simulação — {numeroParcelas}x</h3>
            <p className="text-sm text-gray-500">
              Valor total com juros:{' '}
              <span className="font-semibold text-gray-800">{formatCurrency(valorTotalSimulado)}</span>
              {taxaJuros > 0 && <span className="ml-2 text-gray-400">({taxaJuros}% a.m.)</span>}
            </p>
          </div>
          <button type="button" onClick={() => setEtapa('form')} className="text-sm text-indigo-600 hover:underline">
            ← Editar
          </button>
        </div>

        <div className="overflow-auto max-h-64 rounded border border-gray-200">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-gray-500 font-semibold">#</th>
                <th className="px-3 py-2 text-left text-gray-500 font-semibold">Vencimento</th>
                <th className="px-3 py-2 text-right text-gray-500 font-semibold">Valor</th>
                {taxaJuros > 0 && (
                  <>
                    <th className="px-3 py-2 text-right text-gray-500 font-semibold">Juros</th>
                    <th className="px-3 py-2 text-right text-gray-500 font-semibold">Amortiz.</th>
                    <th className="px-3 py-2 text-right text-gray-500 font-semibold">Saldo</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {simulacao.map((p) => (
                <tr key={p.numeroParcela} className="hover:bg-gray-50">
                  <td className="px-3 py-1.5 text-gray-600">
                    {parcelasJaPagas > 0 ? parcelasJaPagas + p.numeroParcela : p.numeroParcela}
                  </td>
                  <td className="px-3 py-1.5 text-gray-700">{formatDate(p.vencimento)}</td>
                  <td className="px-3 py-1.5 text-right font-medium text-gray-800">{formatCurrency(p.valor)}</td>
                  {taxaJuros > 0 && (
                    <>
                      <td className="px-3 py-1.5 text-right text-red-500">{formatCurrency(p.juros)}</td>
                      <td className="px-3 py-1.5 text-right text-green-600">{formatCurrency(p.amortizacao)}</td>
                      <td className="px-3 py-1.5 text-right text-gray-500">{formatCurrency(p.saldoDevedor)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3 justify-end mt-4">
          <Button_M3 label="Cancelar" onClick={onCancel} bgColor="gray" type="button" />
          <Button_M3
            label={loading ? 'Gerando...' : `Confirmar e Gerar ${numeroParcelas} Parcelas`}
            onClick={handleSubmit as any}
            type="button"
            disabled={loading}
          />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1">Tipo</label>
        <div className="flex gap-3">
          {(['pagar', 'receber'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTipo(t); setCategoriaId(''); }}
              className={`flex-1 py-1.5 rounded border text-sm font-medium transition-colors ${
                tipo === t
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
              }`}
            >
              {t === 'pagar' ? 'A Pagar' : 'A Receber'}
            </button>
          ))}
        </div>
      </div>

      <TextInputM2 label="Descrição *" name="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} />

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

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1">Sistema de Amortização</label>
        <select
          value={sistemaAmortizacao}
          onChange={(e) => setSistemaAmortizacao(e.target.value as SistemaAmortizacao)}
          className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
        >
          <option value="fixo">Fixo — parcelas iguais, sem juros</option>
          <option value="price">Price (Tabela Francesa) — parcelas iguais com juros</option>
          <option value="sac">SAC — amortização constante, parcelas decrescentes</option>
          <option value="variavel">Variável — valores diferentes, lançamento mês a mês</option>
        </select>
        {sistemaAmortizacao === 'variavel' && (
          <p className="text-xs text-gray-400 mt-1">
            Ideal para acordos tributários (PGFN, PERT, Simples Nacional) onde o valor muda mensalmente.
            As parcelas são adicionadas individualmente conforme o boleto é emitido.
          </p>
        )}
      </div>

      <MoneyInputM2
        label={sistemaAmortizacao === 'variavel' ? 'Valor total da dívida' : 'Valor Financiado *'}
        name="valorFinanciado"
        value={valorFinanciado}
        onChange={(v) => setValorFinanciado(v)}
        required={sistemaAmortizacao !== 'variavel'}
      />

      {(sistemaAmortizacao === 'price' || sistemaAmortizacao === 'sac') && (
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-1">Taxa de Juros (% ao mês)</label>
          <input
            type="number"
            value={taxaJuros}
            onChange={(e) => setTaxaJuros(Number(e.target.value))}
            step="0.01"
            min="0"
            className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
          />
        </div>
      )}

      {sistemaAmortizacao !== 'variavel' && (
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-1">Número de Parcelas *</label>
          <input
            type="number"
            value={numeroParcelas}
            onChange={(e) => setNumeroParcelas(Number(e.target.value))}
            min="2"
            max="360"
            className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
            required
          />
        </div>
      )}

      <div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={emAndamento}
            onChange={(e) => {
              setEmAndamento(e.target.checked);
              if (!e.target.checked) setParcelasJaPagas(0);
            }}
            className="w-4 h-4 accent-indigo-600"
          />
          <span className="text-gray-700 text-sm font-medium">Este parcelamento já está em andamento</span>
        </label>
      </div>

      {emAndamento && (
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-1">Parcelas já pagas</label>
          <input
            type="number"
            value={parcelasJaPagas}
            onChange={(e) => setParcelasJaPagas(Number(e.target.value))}
            min="1"
            className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
          />
        </div>
      )}

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1">
          {emAndamento || sistemaAmortizacao === 'variavel'
            ? 'Data do 1º pagamento do acordo'
            : 'Vencimento da 1ª parcela *'}
        </label>
        <input
          type="date"
          value={primeiroPagamento}
          onChange={(e) => setPrimeiroPagamento(e.target.value)}
          className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
          required={sistemaAmortizacao !== 'variavel'}
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

      <div className="flex gap-3 justify-end">
        <Button_M3 label="Cancelar" onClick={onCancel} bgColor="gray" type="button" />
        {sistemaAmortizacao !== 'variavel' ? (
          <Button_M3
            label={loadingSimular ? 'Calculando...' : 'Simular Parcelas'}
            onClick={handleSimular}
            type="button"
            disabled={loadingSimular || !valorFinanciado || !descricao || !categoriaId}
          />
        ) : (
          <Button_M3
            label={loading ? 'Salvando...' : 'Salvar'}
            onClick={() => {}}
            type="submit"
            disabled={loading}
          />
        )}
      </div>
    </form>
  );
};

export default ParcelamentoForm;
