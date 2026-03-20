import React, { useEffect, useState } from 'react';
import MoneyInputM2 from '@/components/Formularios/MoneyInputM2';
import TextInputM2 from '@/components/Formularios/TextInputM2';
import Button_M3 from '@/components/Formularios/Button_M3';
import S_financeiroMovimentacoes from '@/services/S_financeiroMovimentacoes';

interface Conta {
  _id: string;
  nome: string;
}

interface Props {
  onSuccess?: () => void;
}

const hoje = () => new Date().toISOString().split('T')[0];

export default function TransferenciaForm({ onSuccess }: Props) {
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const [contaOrigemId, setContaOrigemId] = useState('');
  const [contaDestinoId, setContaDestinoId] = useState('');
  const [dataMovimento, setDataMovimento] = useState(hoje());
  const [competencia, setCompetencia] = useState(hoje().substring(0, 7));
  const [valor, setValor] = useState(0);
  const [historico, setHistorico] = useState('Transferência entre contas');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    fetch('/api/Controller/C_financeiroContas?type=getAll&ativo=true')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setContas(Array.isArray(data) ? data : []))
      .catch(() => setContas([]));
  }, []);

  const contasDestino = contas.filter((c) => c._id !== contaOrigemId);

  async function handleSalvar(e: React.MouseEvent) {
    e.preventDefault();
    setErro('');

    if (!contaOrigemId || !contaDestinoId || !dataMovimento || !historico || valor <= 0) {
      setErro('Preencha todos os campos obrigatórios: conta origem, conta destino, data, histórico e valor.');
      return;
    }

    if (contaOrigemId === contaDestinoId) {
      setErro('A conta de origem e destino não podem ser iguais.');
      return;
    }

    setLoading(true);
    try {
      await S_financeiroMovimentacoes.createTransferencia({
        contaFinanceiraId: contaOrigemId,
        contaDestinoId,
        dataMovimento,
        competencia,
        valor,
        historico,
        observacoes: observacoes || undefined,
      } as any);

      onSuccess && onSuccess();
    } catch (err: any) {
      setErro(err.message || 'Erro ao criar transferência.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {erro}
        </div>
      )}

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1">Conta Origem *</label>
        <select
          value={contaOrigemId}
          onChange={(e) => {
            setContaOrigemId(e.target.value);
            if (contaDestinoId === e.target.value) setContaDestinoId('');
          }}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          <option value="">Selecione a conta de origem...</option>
          {contas.map((c) => (
            <option key={c._id} value={c._id}>{c.nome}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1">Conta Destino *</label>
        <select
          value={contaDestinoId}
          onChange={(e) => setContaDestinoId(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          <option value="">Selecione a conta de destino...</option>
          {contasDestino.map((c) => (
            <option key={c._id} value={c._id}>{c.nome}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1">Data do Movimento *</label>
        <input
          type="date"
          value={dataMovimento}
          onChange={(e) => { setDataMovimento(e.target.value); setCompetencia(e.target.value.substring(0, 7)); }}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1">Mês de Referência (Competência)</label>
        <input
          type="month"
          value={competencia}
          onChange={(e) => setCompetencia(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <MoneyInputM2
        label="Valor *"
        name="valor"
        value={valor}
        onChange={(v) => setValor(v)}
        required
      />

      <TextInputM2
        label="Histórico *"
        name="historico"
        value={historico}
        onChange={(e) => setHistorico(e.target.value)}
      />

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1">Observações</label>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={3}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Observações opcionais..."
        />
      </div>

      <div className="pt-2">
        <Button_M3
          label={loading ? 'Salvando...' : 'Salvar Transferência'}
          onClick={handleSalvar}
          disabled={loading}
          type="submit"
        />
      </div>
    </div>
  );
}
