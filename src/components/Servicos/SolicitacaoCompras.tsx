import { useCallback, useEffect, useState } from 'react';
import { FaClipboardList, FaPlus, FaPaperPlane, FaRegCommentDots, FaTimes, FaTrash } from 'react-icons/fa';
import { notifyError, notifySuccess } from '@/utils/Functions';
import { withApiAuth } from '@/utils/apiAuth';
import type { PrioridadeSolicitacaoCompra, StatusSolicitacaoCompra, T_SolicitacaoCompra } from '@/types/T_solicitacaoCompra';

type ItemForm = {
  id: string;
  nome: string;
  quantidade: string;
  unidade: string;
  observacao: string;
};

const UNIDADES = ['un', 'cx', 'pct', 'kg', 'g', 'l', 'ml', 'm', 'outro'];

const STATUS_LABEL: Record<StatusSolicitacaoCompra, string> = {
  pendente: 'Aguardando anÃ¡lise',
  em_analise: 'Em anÃ¡lise',
  aprovada: 'Aprovada',
  recusada: 'Recusada',
  comprada: 'Compra realizada',
  cancelada: 'Cancelada',
};

const STATUS_STYLE: Record<StatusSolicitacaoCompra, string> = {
  pendente: 'bg-amber-50 text-amber-700 border-amber-200',
  em_analise: 'bg-blue-50 text-blue-700 border-blue-200',
  aprovada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  recusada: 'bg-red-50 text-red-700 border-red-200',
  comprada: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  cancelada: 'bg-gray-100 text-gray-500 border-gray-200',
};

function novoItem(): ItemForm {
  return { id: `${Date.now()}-${Math.random()}`, nome: '', quantidade: '1', unidade: 'un', observacao: '' };
}

function dataBr(value?: string | null) {
  if (!value) return '';
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR');
}

export default function SolicitacaoCompras() {
  const [itens, setItens] = useState<ItemForm[]>([novoItem()]);
  const [prioridade, setPrioridade] = useState<PrioridadeSolicitacaoCompra>('normal');
  const [necessarioAte, setNecessarioAte] = useState('');
  const [comentario, setComentario] = useState('');
  const [solicitacoes, setSolicitacoes] = useState<T_SolicitacaoCompra[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const response = await fetch('/api/Controller/C_solicitacoesCompra?type=minhas', { headers: withApiAuth() });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.message || 'NÃ£o foi possÃ­vel carregar suas solicitaÃ§Ãµes.');
      setSolicitacoes(data.solicitacoes ?? []);
    } catch (error: any) {
      notifyError(error?.message || 'NÃ£o foi possÃ­vel carregar suas solicitaÃ§Ãµes.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  function atualizarItem(id: string, campo: keyof ItemForm, valor: string) {
    setItens(current => current.map(item => item.id === id ? { ...item, [campo]: valor } : item));
  }

  function removerItem(id: string) {
    setItens(current => {
      const restantes = current.filter(item => item.id !== id);
      return restantes.length ? restantes : [novoItem()];
    });
  }

  async function enviar() {
    const itensValidos = itens
      .filter(item => item.nome.trim())
      .map(item => ({
        id: item.id,
        nome: item.nome.trim(),
        quantidade: Number(item.quantidade),
        unidade: item.unidade,
        observacao: item.observacao.trim(),
      }))
      .filter(item => Number.isFinite(item.quantidade) && item.quantidade > 0);

    if (!itensValidos.length) {
      notifyError('Adicione pelo menos um item com nome e quantidade.');
      return;
    }

    setEnviando(true);
    try {
      const response = await fetch('/api/Controller/C_solicitacoesCompra', {
        method: 'POST',
        headers: withApiAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ itens: itensValidos, prioridade, necessarioAte: necessarioAte || null, comentarioSolicitante: comentario }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.message || 'NÃ£o foi possÃ­vel enviar a solicitaÃ§Ã£o.');
      notifySuccess('SolicitaÃ§Ã£o enviada para o setor de compras.');
      setItens([novoItem()]);
      setPrioridade('normal');
      setNecessarioAte('');
      setComentario('');
      await carregar();
    } catch (error: any) {
      notifyError(error?.message || 'NÃ£o foi possÃ­vel enviar a solicitaÃ§Ã£o.');
    } finally {
      setEnviando(false);
    }
  }

  async function cancelar(id: string) {
    if (!window.confirm('Cancelar esta solicitaÃ§Ã£o de compra?')) return;
    const response = await fetch(`/api/Controller/C_solicitacoesCompra?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: withApiAuth() });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      notifyError(data.message || 'NÃ£o foi possÃ­vel cancelar a solicitaÃ§Ã£o.');
      return;
    }
    notifySuccess('SolicitaÃ§Ã£o cancelada.');
    await carregar();
  }

  return (
    <div className="space-y-5">
      <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FaClipboardList />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">SolicitaÃ§Ã£o de Compras</h1>
            <p className="text-sm text-gray-500 mt-1">Informe o que precisa ser comprado. VocÃª pode solicitar vÃ¡rios itens de uma vez.</p>
          </div>
        </div>

        <div className="space-y-3">
          {itens.map((item, index) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500">Item {index + 1}</span>
                <button type="button" onClick={() => removerItem(item.id)} className="text-gray-400 hover:text-red-500" title="Remover item">
                  <FaTrash className="text-xs" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_90px_100px] gap-2">
                <input value={item.nome} onChange={e => atualizarItem(item.id, 'nome', e.target.value)} placeholder="O que precisa ser comprado? *" className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white" />
                <input type="number" min="0.01" step="0.01" value={item.quantidade} onChange={e => atualizarItem(item.id, 'quantidade', e.target.value)} placeholder="Qtd." className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white" />
                <select value={item.unidade} onChange={e => atualizarItem(item.id, 'unidade', e.target.value)} className="border border-gray-200 rounded-md px-2 py-2 text-sm bg-white">
                  {UNIDADES.map(unidade => <option key={unidade} value={unidade}>{unidade}</option>)}
                </select>
              </div>
              <input value={item.observacao} onChange={e => atualizarItem(item.id, 'observacao', e.target.value)} placeholder="ObservaÃ§Ã£o do item (opcional)" className="mt-2 w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white" />
            </div>
          ))}
          <button type="button" onClick={() => setItens(current => [...current, novoItem()])} className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            <FaPlus className="text-xs" /> Adicionar outro item
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Prioridade</label>
            <select value={prioridade} onChange={e => setPrioridade(e.target.value as PrioridadeSolicitacaoCompra)} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm">
              <option value="normal">Normal</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Precisa atÃ© (opcional)</label>
            <input type="date" value={necessarioAte} onChange={e => setNecessarioAte(e.target.value)} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-xs font-semibold text-gray-500 mb-1">ComentÃ¡rios gerais</label>
          <textarea value={comentario} onChange={e => setComentario(e.target.value)} rows={3} maxLength={4000} placeholder="Explique o motivo, preferÃªncia de marca, local de entrega ou outra informaÃ§Ã£o Ãºtil." className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-y" />
        </div>

        <div className="flex justify-end mt-4">
          <button type="button" onClick={enviar} disabled={enviando} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
            <FaPaperPlane className="text-xs" /> {enviando ? 'Enviando...' : 'Enviar solicitaÃ§Ã£o'}
          </button>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-bold text-gray-800">Minhas solicitaÃ§Ãµes</h2>
            <p className="text-xs text-gray-500 mt-1">Acompanhe o andamento dos pedidos enviados.</p>
          </div>
          <button type="button" onClick={carregar} className="text-xs text-indigo-600 hover:underline">Atualizar</button>
        </div>

        {carregando ? <p className="text-sm text-gray-400 py-6 text-center">Carregando...</p> : solicitacoes.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">VocÃª ainda nÃ£o enviou nenhuma solicitaÃ§Ã£o.</p>
        ) : (
          <div className="space-y-3">
            {solicitacoes.map(solicitacao => (
              <article key={solicitacao._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-800">SolicitaÃ§Ã£o #{String(solicitacao.numero || '').padStart(3, '0')}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Enviada em {dataBr(solicitacao.criadoEm || solicitacao.createdAt)}</p>
                  </div>
                  <span className={`text-xs font-semibold border rounded-full px-2 py-1 ${STATUS_STYLE[solicitacao.status]}`}>{STATUS_LABEL[solicitacao.status]}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {solicitacao.itens.map(item => <span key={item.id} className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1">{item.quantidade} {item.unidade} Â· {item.nome}</span>)}
                </div>
                {solicitacao.comentarioSolicitante && <p className="text-sm text-gray-600 mt-3"><strong>Seu comentÃ¡rio:</strong> {solicitacao.comentarioSolicitante}</p>}
                {solicitacao.comentarioCompras && <p className="text-sm text-indigo-700 mt-2 flex gap-2 items-start"><FaRegCommentDots className="mt-1 shrink-0" /><span><strong>Resposta de Compras:</strong> {solicitacao.comentarioCompras}</span></p>}
                {['pendente', 'em_analise'].includes(solicitacao.status) && <button type="button" onClick={() => cancelar(solicitacao._id!)} className="mt-3 inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700"><FaTimes /> Cancelar solicitaÃ§Ã£o</button>}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


