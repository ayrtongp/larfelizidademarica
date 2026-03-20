import React, { useState, useEffect } from 'react';
import TextInputM2 from '@/components/Formularios/TextInputM2';
import MoneyInputM2 from '@/components/Formularios/MoneyInputM2';
import Button_M3 from '@/components/Formularios/Button_M3';
import { T_Emprestimo, Contraparte_tipo } from '@/types/T_financeiroEmprestimos';

interface Conta {
  _id: string;
  nome: string;
}

interface Pessoa {
  _id: string;
  nome: string;
  sobrenome?: string;
}

interface Props {
  onSave: (data: Partial<T_Emprestimo> & { contaFinanceiraId: string }) => Promise<void>;
  onCancel: () => void;
}

const hoje = () => new Date().toISOString().slice(0, 10);

const EmprestimoForm: React.FC<Props> = ({ onSave, onCancel }) => {
  const [tipo, setTipo] = useState<'concedido' | 'recebido'>('concedido');
  const [contraparte_tipo, setContraparte_tipo] = useState<Contraparte_tipo | ''>('');
  const [contraparteId, setContraparteId] = useState('');
  const [contraparteNome, setContraparteNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valorOriginal, setValorOriginal] = useState(0);
  const [dataEmprestimo, setDataEmprestimo] = useState(hoje());
  const [vencimento, setVencimento] = useState('');
  const [contaFinanceiraId, setContaFinanceiraId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [contas, setContas] = useState<Conta[]>([]);
  const [usuarios, setUsuarios] = useState<Pessoa[]>([]);
  const [residentes, setResidentes] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/Controller/C_financeiroContas?type=getAll&ativo=true')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setContas(data); })
      .catch(() => {});
    fetch('/api/Controller/Usuario?type=getProfissionais')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setUsuarios(data); })
      .catch(() => {});
    fetch('/api/Controller/ResidentesController?type=getAllActive')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setResidentes(data); })
      .catch(() => {});
  }, []);

  function handleContraparteChange(id: string) {
    setContraparteId(id);
    if (!id) { setContraparteNome(''); return; }
    if (contraparte_tipo === 'usuario') {
      const u = usuarios.find((x) => x._id === id);
      setContraparteNome(u ? `${u.nome}${u.sobrenome ? ' ' + u.sobrenome : ''}` : '');
    } else {
      const r = residentes.find((x) => x._id === id);
      setContraparteNome(r ? r.nome : '');
    }
  }

  function handleContraparte_tipoChange(t: Contraparte_tipo | '') {
    setContraparte_tipo(t);
    setContraparteId('');
    setContraparteNome('');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || valorOriginal <= 0 || !dataEmprestimo || !contaFinanceiraId) return;
    setLoading(true);
    try {
      await onSave({
        tipo,
        contraparte_tipo: contraparte_tipo || undefined,
        contraparteId: contraparteId || undefined,
        contraparteNome: contraparteNome || undefined,
        descricao,
        valorOriginal,
        dataEmprestimo,
        vencimento: vencimento || undefined,
        observacoes: observacoes || undefined,
        contaFinanceiraId,
      });
    } finally {
      setLoading(false);
    }
  };

  const listaPessoas = contraparte_tipo === 'usuario' ? usuarios : residentes;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1">Tipo</label>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as 'concedido' | 'recebido')}
          className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
        >
          <option value="concedido">Concedido</option>
          <option value="recebido">Recebido</option>
        </select>
      </div>

      {/* Contraparte */}
      <div className="space-y-2">
        <label className="block text-gray-700 text-sm font-bold mb-1">Contraparte</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleContraparte_tipoChange('usuario')}
            className={`flex-1 py-1.5 rounded border text-sm font-medium transition-colors ${contraparte_tipo === 'usuario' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'}`}
          >
            Usuário
          </button>
          <button
            type="button"
            onClick={() => handleContraparte_tipoChange('residente')}
            className={`flex-1 py-1.5 rounded border text-sm font-medium transition-colors ${contraparte_tipo === 'residente' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'}`}
          >
            Residente
          </button>
        </div>
        {contraparte_tipo && (
          <select
            value={contraparteId}
            onChange={(e) => handleContraparteChange(e.target.value)}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
          >
            <option value="">Selecione...</option>
            {listaPessoas.map((p) => (
              <option key={p._id} value={p._id}>
                {p.nome}{p.sobrenome ? ' ' + p.sobrenome : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      <TextInputM2
        label="Descrição *"
        name="descricao"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
      />

      <MoneyInputM2
        label="Valor Original *"
        name="valorOriginal"
        value={valorOriginal}
        onChange={(v) => setValorOriginal(v)}
        required
      />

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1">Data do Empréstimo *</label>
        <input
          type="date"
          value={dataEmprestimo}
          onChange={(e) => setDataEmprestimo(e.target.value)}
          className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1">Vencimento (opcional)</label>
        <input
          type="date"
          value={vencimento}
          onChange={(e) => setVencimento(e.target.value)}
          className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1">Conta Financeira *</label>
        <select
          value={contaFinanceiraId}
          onChange={(e) => setContaFinanceiraId(e.target.value)}
          className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
          required
        >
          <option value="">Selecione uma conta</option>
          {contas.map((c) => (
            <option key={c._id} value={c._id}>{c.nome}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1">Observações</label>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={3}
          className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button_M3 label="Cancelar" onClick={onCancel} bgColor="gray" type="button" />
        <Button_M3 label={loading ? 'Salvando...' : 'Salvar'} onClick={() => {}} type="submit" disabled={loading} />
      </div>
    </form>
  );
};

export default EmprestimoForm;
