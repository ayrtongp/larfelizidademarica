import React, { useCallback, useEffect, useState } from 'react';
import PortalBase from '@/components/Portal/PortalBase';
import PermissionWrapper from '@/components/PermissionWrapper';
import { ADMINISTRATIVO_GROUP_ID, SUPRIMENTOS_GROUP_ID } from '@/constants/accessGroups';
import { notifyError, notifySuccess } from '@/utils/Functions';
import { withApiAuth } from '@/utils/apiAuth';
import type { StatusSolicitacaoCompra, T_SolicitacaoCompra } from '@/types/T_solicitacaoCompra';

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

const STATUS_OPTIONS: StatusSolicitacaoCompra[] = ['pendente', 'em_analise', 'aprovada', 'recusada', 'comprada', 'cancelada'];

function dataBr(value?: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('pt-BR');
}

export default function SolicitacoesComprasPage() {
  const [solicitacoes, setSolicitacoes] = useState<T_SolicitacaoCompra[]>([]);
  const [filtro, setFiltro] = useState<'todas' | StatusSolicitacaoCompra>('todas');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState<string | null>(null);
  const [comentarios, setComentarios] = useState<Record<string, string>>({});

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const response = await fetch('/api/Controller/C_solicitacoesCompra?type=todas', { headers: withApiAuth() });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.message || 'NÃ£o foi possÃ­vel carregar as solicitaÃ§Ãµes.');
      setSolicitacoes(data.solicitacoes ?? []);
    } catch (error: any) {
      notifyError(error?.message || 'NÃ£o foi possÃ­vel carregar as solicitaÃ§Ãµes.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function salvar(solicitacao: T_SolicitacaoCompra, status: StatusSolicitacaoCompra) {
    if (!solicitacao._id) return;
    setSalvando(solicitacao._id);
    try {
      const response = await fetch(`/api/Controller/C_solicitacoesCompra?id=${encodeURIComponent(solicitacao._id)}`, {
        method: 'PUT',
        headers: withApiAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status, comentarioCompras: comentarios[solicitacao._id] ?? solicitacao.comentarioCompras ?? '' }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.message || 'NÃ£o foi possÃ­vel atualizar a solicitaÃ§Ã£o.');
      notifySuccess('SolicitaÃ§Ã£o atualizada.');
      await carregar();
    } catch (error: any) {
      notifyError(error?.message || 'NÃ£o foi possÃ­vel atualizar a solicitaÃ§Ã£o.');
    } finally {
      setSalvando(null);
    }
  }

  const filtradas = filtro === 'todas' ? solicitacoes : solicitacoes.filter(item => item.status === filtro);

  return (
    <PermissionWrapper href="/portal" groups={[SUPRIMENTOS_GROUP_ID, ADMINISTRATIVO_GROUP_ID]}>
      <PortalBase>
        <div className="col-span-full w-full space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-800">SolicitaÃ§Ãµes de Compras</h1>
                <p className="text-sm text-gray-500 mt-1">Revise as necessidades da equipe e acompanhe o atendimento.</p>
              </div>
              <button type="button" onClick={carregar} className="text-sm text-indigo-600 hover:underline">Atualizar fila</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {(['todas', ...STATUS_OPTIONS] as const).map(status => (
                <button key={status} type="button" onClick={() => setFiltro(status)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${filtro === status ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'}`}>
                  {status === 'todas' ? 'Todas' : STATUS_LABEL[status]}
                </button>
              ))}
            </div>
          </div>

          {carregando ? <p className="text-center text-sm text-gray-400 py-12">Carregando solicitaÃ§Ãµes...</p> : filtradas.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-sm text-gray-400">Nenhuma solicitaÃ§Ã£o nesta situaÃ§Ã£o.</div>
          ) : (
            <div className="space-y-3">
              {filtradas.map(solicitacao => {
                const id = solicitacao._id!;
                const status = solicitacao.status;
                return (
                  <article key={id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-bold text-gray-800">SolicitaÃ§Ã£o #{String(solicitacao.numero || '').padStart(3, '0')}</h2>
                          <span className={`text-xs font-semibold border rounded-full px-2 py-1 ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>
                          {solicitacao.prioridade === 'urgente' && <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-1">Urgente</span>}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Solicitante: <strong>{solicitacao.solicitanteNome}</strong></p>
                        <p className="text-xs text-gray-400 mt-0.5">Enviada em {dataBr(solicitacao.createdAt || solicitacao.criadoEm)}{solicitacao.necessarioAte ? ` Â· Precisa atÃ© ${dataBr(solicitacao.necessarioAte)}` : ''}</p>
                      </div>
                      <select value={status} onChange={e => salvar(solicitacao, e.target.value as StatusSolicitacaoCompra)} disabled={salvando === id} className="border border-gray-200 rounded-md px-2 py-2 text-sm">
                        {STATUS_OPTIONS.map(opcao => <option key={opcao} value={opcao}>{STATUS_LABEL[opcao]}</option>)}
                      </select>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="text-left text-xs text-gray-400 border-b"><th className="py-2 pr-3">Item</th><th className="py-2 pr-3">Quantidade</th><th className="py-2">ObservaÃ§Ã£o</th></tr></thead>
                        <tbody>{solicitacao.itens.map(item => <tr key={item.id} className="border-b last:border-0"><td className="py-2 pr-3 font-medium text-gray-700">{item.nome}</td><td className="py-2 pr-3 text-gray-600">{item.quantidade} {item.unidade}</td><td className="py-2 text-gray-500">{item.observacao || 'â€”'}</td></tr>)}</tbody>
                      </table>
                    </div>

                    {solicitacao.comentarioSolicitante && <p className="text-sm text-gray-600 mt-3"><strong>ComentÃ¡rio do solicitante:</strong> {solicitacao.comentarioSolicitante}</p>}
                    <div className="mt-4">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">ComentÃ¡rio da AdministraÃ§Ã£o/Compras</label>
                      <textarea value={comentarios[id] ?? solicitacao.comentarioCompras ?? ''} onChange={e => setComentarios(current => ({ ...current, [id]: e.target.value }))} rows={2} maxLength={4000} placeholder="Informe aprovaÃ§Ã£o, motivo da recusa, previsÃ£o ou observaÃ§Ã£o da compra." className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-y" />
                      <button type="button" onClick={() => salvar(solicitacao, status)} disabled={salvando === id} className="mt-2 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md disabled:opacity-50">{salvando === id ? 'Salvando...' : 'Salvar comentÃ¡rio'}</button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </PortalBase>
    </PermissionWrapper>
  );
}


