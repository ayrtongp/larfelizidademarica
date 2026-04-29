import React, { useEffect, useState } from 'react';
import MoneyInputM2 from '@/components/Formularios/MoneyInputM2';
import TextInputM2 from '@/components/Formularios/TextInputM2';
import Button_M3 from '@/components/Formularios/Button_M3';
import RateioEditor, { RateioRow } from './RateioEditor';
import PessoaCombobox, { PessoaItem } from '@/components/financeiro/shared/PessoaCombobox';
import ComboBox, { Opcao } from '@/components/UI/ComboBox';
import S_financeiroMovimentacoes, { UpdateMovimentacaoPayload } from '@/services/S_financeiroMovimentacoes';
import { T_Movimentacao, TipoMovimento, FormaPagamento } from '@/types/T_financeiroMovimentacoes';
import { Contraparte_tipo, T_Emprestimo } from '@/types/T_financeiroEmprestimos';
import { S_financeiroEmprestimos } from '@/services/S_financeiroEmprestimos';
import DevolucaoEmprestimoModal from '@/components/financeiro/emprestimos/DevolucaoEmprestimoModal';

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
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  const [tipoMovimento, setTipoMovimento] = useState<TipoMovimento>(tipoMovimentoFixo || 'entrada');
  const [contaFinanceiraId, setContaFinanceiraId] = useState('');
  const [contaDestinoId, setContaDestinoId] = useState('');
  const [dataMovimento, setDataMovimento] = useState(hoje());
  const [competencia, setCompetencia] = useState(hoje().substring(0, 7));
  const [valor, setValor] = useState(0);
  const [historico, setHistorico] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento | ''>('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [categorias, setCategorias] = useState<{ _id: string; nome: string; tipo: string; categoriaPaiId?: string | null }[]>([]);
  const [rateioCategId, setRateioCategId] = useState('');
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

  // par de transferência entre contas
  const [criarPar, setCriarPar] = useState(false);
  const [contaParId, setContaParId] = useState('');

  // empréstimo vinculado (modo edição)
  const [emprestimoVinculadoId, setEmprestimoVinculadoId] = useState('');
  const [emprestimoData, setEmprestimoData] = useState<T_Emprestimo | null>(null);
  const [loadingEmprestimo, setLoadingEmprestimo] = useState(false);
  const [showDevolucaoModal, setShowDevolucaoModal] = useState(false);
  const [vinculandoEmprestimo, setVinculandoEmprestimo] = useState(false);
  const [emprestimosDisponiveis, setEmprestimosDisponiveis] = useState<T_Emprestimo[]>([]);
  const [loadingEmprestimosLista, setLoadingEmprestimosLista] = useState(false);

  useEffect(() => {
    fetch('/api/Controller/C_financeiroContas?type=getAll&ativo=true')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setContas(Array.isArray(data) ? data : []))
      .catch(() => setContas([]));
    fetch('/api/Controller/C_financeiroCategorias?type=getAll')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        const lista = Array.isArray(data) ? data : [];
        setCategorias(lista);
        const rateiocat = lista.find((c: { tipo: string; nome: string }) => c.tipo === 'sistema' && c.nome.toLowerCase() === 'rateio');
        if (rateiocat) setRateioCategId(rateiocat._id);
      })
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
    setContaDestinoId(initialData.contaDestinoId ?? '');
    setCriarPar(false);
    setContaParId('');
    setVinculadoId(initialData.vinculadoId ?? '');
    setVinculadoTipo((initialData.vinculadoTipo as 'usuario' | 'residente' | '') ?? '');
    setTemRateio(initialData.temRateio ?? false);
    setRateios([]);
    setCriarEmprestimo(false);
    setVinculandoEmprestimo(false);
    setShowDevolucaoModal(false);
    setEmprestimosDisponiveis([]);

    const eid = initialData.emprestimoId ?? '';
    setEmprestimoVinculadoId(eid);
    setEmprestimoData(null);
    if (eid) {
      setLoadingEmprestimo(true);
      S_financeiroEmprestimos.getById(eid)
        .then(setEmprestimoData)
        .catch(() => {})
        .finally(() => setLoadingEmprestimo(false));
    }

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
      const dadosCriacao: Partial<T_Movimentacao> = {
        tipoMovimento,
        contaFinanceiraId,
        contaDestinoId: contaDestinoId || undefined,
        dataMovimento,
        competencia,
        categoriaId: categoriaId || undefined,
        valor,
        historico,
        formaPagamento: formaPagamento || undefined,
        numeroDocumento: numeroDocumento || undefined,
        observacoes: observacoes || undefined,
        vinculadoId: vinculadoId || undefined,
        vinculadoTipo: (vinculadoTipo as 'usuario' | 'residente' | '') || undefined,
        emprestimoId: emprestimoVinculadoId || undefined,
      };

      if (isEditing) {
        const dadosEdicao: UpdateMovimentacaoPayload = {
          tipoMovimento,
          contaFinanceiraId,
          contaDestinoId: contaDestinoId || null,
          dataMovimento,
          competencia,
          categoriaId: categoriaId || null,
          valor,
          historico,
          formaPagamento: formaPagamento || null,
          numeroDocumento: numeroDocumento || null,
          observacoes: observacoes || null,
          vinculadoId: vinculadoId || null,
          vinculadoTipo: vinculadoTipo || null,
          emprestimoId: emprestimoVinculadoId || null,
        };

        await S_financeiroMovimentacoes.update(initialData!._id!, {
          ...dadosEdicao,
          temRateio,
          ...(criarPar && contaParId ? { criarPar: true, contaParId } : {}),
          ...(temRateio ? { rateios: rateios as any } : {}),
        });
      } else {
        await S_financeiroMovimentacoes.create({
          ...dadosCriacao,
          temRateio,
          rateios: temRateio ? rateios : undefined,
          ...(criarPar && contaParId ? { criarPar: true, contaParId } : {}),
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

  async function handleDevolucao(data: { valor: number; dataDevolucao: string; contaFinanceiraId: string; formaPagamento?: string; observacoes?: string }) {
    await S_financeiroEmprestimos.devolver(emprestimoVinculadoId, data);
    const updated = await S_financeiroEmprestimos.getById(emprestimoVinculadoId);
    setEmprestimoData(updated);
    setShowDevolucaoModal(false);
  }

  function handleAbrirVincular() {
    setVinculandoEmprestimo(true);
    if (emprestimosDisponiveis.length > 0) return;
    setLoadingEmprestimosLista(true);
    S_financeiroEmprestimos.getAll()
      .then(data => setEmprestimosDisponiveis(data.filter(e => e.status === 'aberto' || e.status === 'parcial')))
      .catch(() => {})
      .finally(() => setLoadingEmprestimosLista(false));
  }

  async function handleSelecionarEmprestimo(id: string) {
    setEmprestimoVinculadoId(id);
    setVinculandoEmprestimo(false);
    if (!id) { setEmprestimoData(null); return; }
    setLoadingEmprestimo(true);
    S_financeiroEmprestimos.getById(id)
      .then(setEmprestimoData)
      .catch(() => {})
      .finally(() => setLoadingEmprestimo(false));
  }

  async function handleExcluir() {
    if (!initialData?._id) return;
    setLoading(true);
    setErro('');
    try {
      const res = await fetch(`/api/Controller/C_financeiroMovimentacoes?id=${initialData._id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao excluir.');
      }
      onSuccess && onSuccess();
    } catch (err: any) {
      setErro(err.message || 'Erro ao excluir movimentação.');
      setConfirmandoExclusao(false);
    } finally {
      setLoading(false);
    }
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const statusCor: Record<string, string> = {
    aberto:   'bg-blue-100 text-blue-700',
    parcial:  'bg-yellow-100 text-yellow-700',
    quitado:  'bg-green-100 text-green-700',
    cancelado:'bg-red-100 text-red-700',
  };
  const statusLabel: Record<string, string> = {
    aberto: 'Aberto', parcial: 'Parcial', quitado: 'Quitado', cancelado: 'Cancelado',
  };

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
          {/* opção legado — só aparece se o registro já tem esse tipo */}
          {tipoMovimento === 'transferencia' && <option value="transferencia">Transferência (legado)</option>}
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

      {temRateio ? (
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-1">Categoria</label>
          <input
            type="text"
            value="Rateio"
            disabled
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-400 bg-gray-100 leading-tight cursor-not-allowed"
          />
        </div>
      ) : tipoMovimento !== 'transferencia' && (() => {
        const categoriaAtual = categorias.find((c) => c._id === categoriaId);
        const isCategoriaTransf = categoriaAtual?.tipo === 'transferencia';
        return (
          <>
            <ComboBox
              label="Categoria"
              placeholder="Pesquisar categoria..."
              options={(() => {
                const paiIds = new Set(categorias.map((c) => c.categoriaPaiId).filter(Boolean) as string[]);
                return categorias.filter((c) =>
                  c._id === categoriaId ||
                  (
                    !paiIds.has(c._id) &&
                    (
                      c.tipo === 'transferencia' ||
                      tipoMovimento === 'ajuste' ||
                      c.tipo === (tipoMovimento === 'entrada' ? 'receita' : 'despesa')
                    )
                  )
                );
              })() as Opcao[]}
              value={categoriaAtual as Opcao ?? null}
              onChange={(val) => {
                setCategoriaId(val?._id ?? '');
                setCriarPar(false);
                setContaParId('');
                if (val?.nome && val.nome.toLowerCase().includes('empr')) {
                  if (!isEditing) {
                    setCriarEmprestimo(true);
                  } else if (!emprestimoVinculadoId) {
                    handleAbrirVincular();
                  }
                }
              }}
              showIdSuffix={false}
              showSubtitle={false}
              emptyText="Nenhuma categoria encontrada."
            />

            {isCategoriaTransf && (
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-1">
                  ↔ Conta da outra perna
                </label>
                <select
                  value={contaParId}
                  onChange={(e) => { setContaParId(e.target.value); setCriarPar(!!e.target.value); }}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Não criar par agora</option>
                  {contas.filter((c) => c._id !== contaFinanceiraId).map((c) => (
                    <option key={c._id} value={c._id}>{c.nome}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        );
      })()}

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

      {/* Seção de empréstimo */}
      {(tipoMovimento === 'entrada' || tipoMovimento === 'saida') && (
        isEditing ? (
          emprestimoVinculadoId ? (
            /* Card do empréstimo vinculado */
            <div className="border border-indigo-200 rounded-lg bg-indigo-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="text-sm font-semibold text-indigo-700">Empréstimo vinculado</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setEmprestimoVinculadoId(''); setEmprestimoData(null); }}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  title="Desvincular empréstimo"
                >
                  Desvincular
                </button>
              </div>

              {loadingEmprestimo ? (
                <p className="text-xs text-gray-400 py-2">Carregando dados do empréstimo…</p>
              ) : emprestimoData ? (
                <div className="space-y-3">
                  {/* Badges: tipo + status */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${emprestimoData.tipo === 'concedido' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                      {emprestimoData.tipo === 'concedido' ? 'Concedido' : 'Recebido'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusCor[emprestimoData.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {statusLabel[emprestimoData.status] ?? emprestimoData.status}
                    </span>
                    {emprestimoData.vencimento && new Date(emprestimoData.vencimento) < new Date() && emprestimoData.status !== 'quitado' && emprestimoData.status !== 'cancelado' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Vencido</span>
                    )}
                  </div>

                  {/* Descrição e contraparte */}
                  <div>
                    <p className="text-sm font-medium text-gray-800">{emprestimoData.descricao}</p>
                    {emprestimoData.contraparteNome && (
                      <p className="text-xs text-gray-500 mt-0.5">Contraparte: {emprestimoData.contraparteNome}</p>
                    )}
                    {emprestimoData.vencimento && (
                      <p className="text-xs text-gray-500">Vencimento: {new Date(emprestimoData.vencimento + 'T12:00').toLocaleDateString('pt-BR')}</p>
                    )}
                  </div>

                  {/* Valores e progresso */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded p-2.5 border border-indigo-100">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Valor original</p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">{fmt(emprestimoData.valorOriginal)}</p>
                    </div>
                    <div className="bg-white rounded p-2.5 border border-indigo-100">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Em aberto</p>
                      <p className={`text-sm font-bold mt-0.5 ${emprestimoData.valorEmAberto > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {fmt(emprestimoData.valorEmAberto)}
                      </p>
                    </div>
                  </div>

                  {/* Barra de progresso */}
                  {emprestimoData.valorOriginal > 0 && (
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>Pago</span>
                        <span>{Math.round(((emprestimoData.valorOriginal - emprestimoData.valorEmAberto) / emprestimoData.valorOriginal) * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.round(((emprestimoData.valorOriginal - emprestimoData.valorEmAberto) / emprestimoData.valorOriginal) * 100))}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Ação */}
                  {(emprestimoData.status === 'aberto' || emprestimoData.status === 'parcial') && (
                    <button
                      type="button"
                      onClick={() => setShowDevolucaoModal(true)}
                      className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded transition-colors"
                    >
                      Registrar devolução
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-red-500">Não foi possível carregar os dados do empréstimo.</p>
              )}
            </div>
          ) : vinculandoEmprestimo ? (
            /* Seletor para vincular empréstimo existente */
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Vincular a empréstimo existente</span>
                <button type="button" onClick={() => setVinculandoEmprestimo(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
              </div>
              {loadingEmprestimosLista ? (
                <p className="text-xs text-gray-400">Carregando empréstimos…</p>
              ) : emprestimosDisponiveis.length === 0 ? (
                <p className="text-xs text-gray-500">Nenhum empréstimo aberto ou parcial encontrado.</p>
              ) : (
                <select
                  defaultValue=""
                  onChange={e => handleSelecionarEmprestimo(e.target.value)}
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 text-sm focus:outline-none focus:shadow-outline"
                >
                  <option value="">Selecione um empréstimo…</option>
                  {emprestimosDisponiveis.map(e => (
                    <option key={e._id} value={e._id}>
                      {e.descricao}{e.contraparteNome ? ` — ${e.contraparteNome}` : ''} ({fmt(e.valorEmAberto)} em aberto)
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            /* Botão discreto para vincular */
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAbrirVincular}
                className="text-xs text-indigo-500 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Vincular a empréstimo
              </button>
            </div>
          )
        ) : (
          /* Criação: checkbox para criar empréstimo */
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
        )
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
              setCategoriaId(rateioCategId);
              setVinculadoId('');
              setVinculadoTipo('');
            } else {
              if (categoriaId === rateioCategId) setCategoriaId('');
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

      <div className="pt-2 flex flex-col gap-2">
        <Button_M3
          label={loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Salvar'}
          onClick={handleSalvar}
          disabled={loading}
          type="submit"
        />

        {isEditing && !confirmandoExclusao && (
          <button
            type="button"
            onClick={() => setConfirmandoExclusao(true)}
            disabled={loading}
            className="w-full py-2 px-4 rounded text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            Excluir movimentação
          </button>
        )}

        {isEditing && confirmandoExclusao && (
          <div className="border border-red-200 rounded-lg bg-red-50 p-3 space-y-2">
            <p className="text-sm text-red-700 font-medium">Tem certeza? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExcluir}
                disabled={loading}
                className="flex-1 py-1.5 rounded text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Excluindo...' : 'Sim, excluir'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmandoExclusao(false)}
                disabled={loading}
                className="flex-1 py-1.5 rounded text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {showDevolucaoModal && emprestimoData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Registrar Devolução</h3>
              <button
                type="button"
                onClick={() => setShowDevolucaoModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <DevolucaoEmprestimoModal
                emprestimo={emprestimoData}
                onSave={handleDevolucao}
                onClose={() => setShowDevolucaoModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
