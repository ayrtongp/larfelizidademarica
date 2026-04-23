import React, { useEffect, useState } from 'react';
import MoneyInputM2 from '@/components/Formularios/MoneyInputM2';
import TextInputM2 from '@/components/Formularios/TextInputM2';
import Button_M3 from '@/components/Formularios/Button_M3';
import RateioEditor, { RateioRow } from './RateioEditor';
import PessoaCombobox, { PessoaItem } from '@/components/financeiro/shared/PessoaCombobox';
import S_financeiroMovimentacoes from '@/services/S_financeiroMovimentacoes';
import { T_Movimentacao, TipoMovimento, FormaPagamento } from '@/types/T_financeiroMovimentacoes';
import { Contraparte_tipo } from '@/types/T_financeiroEmprestimos';

interface Conta {
  _id: string;
  nome: string;
  ativo?: boolean;
  status?: string;
}

interface RawPessoa {
  _id: string;
  nome: string;
  sobrenome?: string;
}

interface Props {
  tipoMovimentoFixo?: TipoMovimento;
  initialData?: T_Movimentacao;
  onSuccess?: () => void;
}

const hoje = () => new Date().toISOString().split('T')[0];

export default function MovimentacaoForm({ tipoMovimentoFixo, initialData, onSuccess }: Props) {
  const isEditing = !!initialData?._id;

  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const [tipoMovimento, setTipoMovimento] = useState<TipoMovimento>(tipoMovimentoFixo || 'entrada');
  const [contaFinanceiraId, setContaFinanceiraId] = useState('');
  const [dataMovimento, setDataMovimento] = useState(hoje());
  const [competencia, setCompetencia] = useState(hoje().substring(0, 7));
  const [valor, setValor] = useState(0);
  const [historico, setHistorico] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento | ''>('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [categorias, setCategorias] = useState<{ _id: string; nome: string; tipo: string }[]>([]);
  const [temRateio, setTemRateio] = useState(false);
  const [rateios, setRateios] = useState<RateioRow[]>([]);

  // Vínculo de pessoa na movimentação
  const [vinculadoId, setVinculadoId] = useState('');
  const [vinculadoTipo, setVinculadoTipo] = useState<'usuario' | 'residente' | ''>('');

  // Lista combinada para combobox
  const [pessoas, setPessoas] = useState<PessoaItem[]>([]);

  // empréstimo inline (apenas na criação)
  const [criarEmprestimo, setCriarEmprestimo] = useState(false);
  const [emprestimoTipo, setEmprestimoTipo] = useState<'concedido' | 'recebido'>('concedido');
  const [emprestimoContraparte_tipo, setEmprestimoContraparte_tipo] = useState<Contraparte_tipo | ''>('');
  const [emprestimoContraparteId, setEmprestimoContraparteId] = useState('');
  const [emprestimoContraparteNome, setEmprestimoContraparteNome] = useState('');
  const [emprestimoVencimento, setEmprestimoVencimento] = useState('');

  useEffect(() => {
    fetch('/api/Controller/C_financeiroContas?type=getAll&ativo=true')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setContas(Array.isArray(data) ? data : []))
      .catch(() => setContas([]));
    fetch('/api/Controller/C_financeiroCategorias?type=getAll')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setCategorias(Array.isArray(data) ? data : []))
      .catch(() => setCategorias([]));

    // Carrega usuários e residentes e monta lista combinada
    Promise.all([
      fetch('/api/Controller/Usuario?type=getProfissionais').then((r) => r.ok ? r.json() : []),
      fetch('/api/Controller/ResidentesController?type=getAllActive').then((r) => r.ok ? r.json() : []),
    ]).then(([us, rs]) => {
      const lista: PessoaItem[] = [
        ...(Array.isArray(us) ? us : []).map((u: RawPessoa) => ({
          id: u._id,
          nome: u.sobrenome ? `${u.nome} ${u.sobrenome}` : u.nome,
          tipo: 'usuario' as const,
        })),
        ...(Array.isArray(rs) ? rs : []).map((r: RawPessoa) => ({
          id: r._id,
          nome: r.sobrenome ? `${r.nome} ${r.sobrenome}` : r.nome,
          tipo: 'residente' as const,
        })),
      ];
      setPessoas(lista);
    }).catch(() => {});
  }, []);

  // Preenche estados quando initialData muda (modo edição)
  useEffect(() => {
    if (!initialData) return;
    setTipoMovimento(initialData.tipoMovimento ?? 'entrada');
    setContaFinanceiraId(initialData.contaFinanceiraId ?? '');
    setDataMovimento(initialData.dataMovimento?.split('T')[0] ?? hoje());
    setCompetencia(initialData.competencia ?? initialData.dataMovimento?.substring(0, 7) ?? hoje().substring(0, 7));
    setValor(initialData.valor ?? 0);
    setHistorico(initialData.historico ?? '');
    setFormaPagamento((initialData.formaPagamento as FormaPagamento | '') ?? '');
    setNumeroDocumento(initialData.numeroDocumento ?? '');
    setObservacoes(initialData.observacoes ?? '');
    setCategoriaId(initialData.categoriaId ?? '');
    setVinculadoId(initialData.vinculadoId ?? '');
    setVinculadoTipo((initialData.vinculadoTipo as 'usuario' | 'residente' | '') ?? '');
    setTemRateio(initialData.temRateio ?? false);
    setRateios([]);
    setCriarEmprestimo(false);

    // Carrega rateios existentes em modo edição
    if (initialData.temRateio && initialData._id) {
      S_financeiroMovimentacoes.getRateiosByMovimentacaoId(initialData._id)
        .then((data) => {
          setRateios(data.map((r) => ({
            categoriaId: r.categoriaId ?? '',
            descricao: r.descricao ?? '',
            valor: r.valor ?? 0,
            vinculadoId: r.residenteId ?? r.responsavelId ?? undefined,
            vinculadoTipo: r.residenteId ? 'residente' : r.responsavelId ? 'usuario' : undefined,
          })));
        })
        .catch(() => {});
    }
  }, [initialData]);

  async function handleSalvar(e: React.MouseEvent) {
    e.preventDefault();
    setErro('');

    if (!contaFinanceiraId || !dataMovimento || !historico || valor <= 0) {
      setErro('Preencha todos os campos obrigatórios: conta, data, histórico e valor.');
      return;
    }

    if (temRateio && rateios.length === 0) {
      setErro('Adicione pelo menos um rateio ou desmarque a opção de rateio.');
      return;
    }

    if (temRateio) {
      const total = rateios.reduce((acc, r) => acc + Number(r.valor), 0);
      if (Math.abs(total - valor) > 0.001) {
        setErro('A soma dos rateios deve ser igual ao valor da movimentação.');
        return;
      }
    }

    setLoading(true);
    try {
      const dados: Partial<T_Movimentacao> = {
        tipoMovimento,
        contaFinanceiraId,
        dataMovimento,
        competencia,
        categoriaId: categoriaId || undefined,
        valor,
        historico,
        formaPagamento: formaPagamento || undefined,
        numeroDocumento: numeroDocumento || undefined,
        observacoes: observacoes || undefined,
        vinculadoId: vinculadoId || undefined,
        vinculadoTipo: (vinculadoTipo as 'usuario' | 'residente') || undefined,
      };

      if (isEditing) {
        await S_financeiroMovimentacoes.update(initialData!._id!, {
          ...dados,
          temRateio,
          ...(temRateio ? { rateios: rateios as any } : {}),
        } as any);
      } else {
        await S_financeiroMovimentacoes.create({
          ...dados,
          temRateio,
          rateios: temRateio ? rateios : undefined,
          ...(criarEmprestimo && {
            criarEmprestimo: true,
            emprestimoTipo,
            emprestimoContraparte_tipo: emprestimoContraparte_tipo || undefined,
            emprestimoContraparteId: emprestimoContraparteId || undefined,
            emprestimoContraparteNome: emprestimoContraparteNome || undefined,
            emprestimoVencimento: emprestimoVencimento || undefined,
          }),
        } as any);
      }

      onSuccess && onSuccess();
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar movimentação.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {isEditing && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded text-xs font-medium">
          Modo edição — os rateios serão substituídos pelos que estão definidos abaixo.
        </div>
      )}

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {erro}
        </div>
      )}

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1">Tipo de Movimento</label>
        <select
          value={tipoMovimento}
          onChange={(e) => setTipoMovimento(e.target.value as TipoMovimento)}
          disabled={!!tipoMovimentoFixo}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100"
        >
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
          <option value="ajuste">Ajuste</option>
        </select>
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1">Conta Financeira *</label>
        <select
          value={contaFinanceiraId}
          onChange={(e) => setContaFinanceiraId(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          <option value="">Selecione uma conta...</option>
          {contas.map((c) => (
            <option key={c._id} value={c._id}>{c.nome}</option>
          ))}
        </select>
      </div>

      {tipoMovimento !== 'transferencia' && !temRateio && (
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-1">Categoria</label>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Selecione uma categoria (opcional)...</option>
            {categorias
              .filter((c) => tipoMovimento === 'ajuste' || c.tipo === (tipoMovimento === 'entrada' ? 'receita' : 'despesa'))
              .map((c) => (
                <option key={c._id} value={c._id}>{c.nome}</option>
              ))}
          </select>
        </div>
      )}

      {!temRateio && (
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-1">Vincular pessoa (opcional)</label>
          <PessoaCombobox
            pessoas={pessoas}
            value={vinculadoId}
            onChange={(id, tipo) => { setVinculadoId(id); setVinculadoTipo(tipo); }}
            placeholder="Pesquisar usuário ou residente..."
          />
        </div>
      )}

      <div>
        <label className="block text-gray-700 text-sm font-bold mb-1">Data do Movimento *</label>
        <input
          type="date"
          value={dataMovimento}
          onChange={(e) => {
            setDataMovimento(e.target.value);
            setCompetencia(e.target.value.substring(0, 7));
          }}
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
        <p className="text-xs text-gray-400 mt-1">Preenchido automaticamente pela data do movimento. Altere se o mês de referência for diferente.</p>
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
        <label className="block text-gray-700 text-sm font-bold mb-1">Forma de Pagamento</label>
        <select
          value={formaPagamento}
          onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento | '')}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          <option value="">Selecione (opcional)...</option>
          <option value="pix">Pix</option>
          <option value="dinheiro">Dinheiro</option>
          <option value="transferencia">Transferência</option>
          <option value="boleto">Boleto</option>
          <option value="cartao">Cartão</option>
          <option value="cheque">Cheque</option>
          <option value="outro">Outro</option>
        </select>
      </div>

      <TextInputM2
        label="Número do Documento"
        name="numeroDocumento"
        value={numeroDocumento}
        onChange={(e) => setNumeroDocumento(e.target.value)}
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

      {/* Empréstimo inline — apenas na criação */}
      {!isEditing && (tipoMovimento === 'entrada' || tipoMovimento === 'saida') && (
        <div className="border rounded-md p-4 bg-blue-50 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="criarEmprestimo"
              checked={criarEmprestimo}
              onChange={(e) => setCriarEmprestimo(e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
            <label htmlFor="criarEmprestimo" className="text-sm font-medium text-gray-700">
              Esta movimentação é um empréstimo
            </label>
          </div>
          {criarEmprestimo && (
            <div className="space-y-3 pt-1">
              <p className="text-xs text-blue-700">Um registro de empréstimo será criado automaticamente e vinculado a esta movimentação.</p>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-1">Tipo do Empréstimo</label>
                <select
                  value={emprestimoTipo}
                  onChange={(e) => setEmprestimoTipo(e.target.value as 'concedido' | 'recebido')}
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
                >
                  <option value="concedido">Concedido (você emprestou)</option>
                  <option value="recebido">Recebido (você tomou emprestado)</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-1">Contraparte do Empréstimo</label>
                <PessoaCombobox
                  pessoas={pessoas}
                  value={emprestimoContraparteId}
                  onChange={(id, tipo) => {
                    setEmprestimoContraparteId(id);
                    setEmprestimoContraparte_tipo(tipo as Contraparte_tipo | '');
                    if (!id) { setEmprestimoContraparteNome(''); return; }
                    const p = pessoas.find((x) => x.id === id);
                    setEmprestimoContraparteNome(p?.nome ?? '');
                  }}
                  placeholder="Pesquisar contraparte..."
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-1">Vencimento do Empréstimo (opcional)</label>
                <input
                  type="date"
                  value={emprestimoVencimento}
                  onChange={(e) => setEmprestimoVencimento(e.target.value)}
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rateio — disponível em create e edit */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="temRateio"
          checked={temRateio}
          onChange={(e) => {
            setTemRateio(e.target.checked);
            if (e.target.checked) {
              setCategoriaId('');
              setVinculadoId('');
              setVinculadoTipo('');
            } else {
              setRateios([]);
            }
          }}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
        />
        <label htmlFor="temRateio" className="text-sm font-medium text-gray-700">
          Possui rateio por categoria
        </label>
      </div>

      {temRateio && (
        <RateioEditor valor={valor} rateios={rateios} onChange={setRateios} pessoas={pessoas} />
      )}

      <div className="pt-2">
        <Button_M3
          label={loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Salvar'}
          onClick={handleSalvar}
          disabled={loading}
          type="submit"
        />
      </div>
    </div>
  );
}
