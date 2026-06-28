import React, { useCallback, useEffect, useState } from 'react';
import PortalBase from '@/components/Portal/PortalBase';
import PermissionWrapper from '@/components/PermissionWrapper';
import { SUPRIMENTOS_GROUP_ID } from '@/constants/accessGroups';
import S_estoqueEmpresa from '@/services/S_estoqueEmpresa';
import { T_ItemEstoque, T_CategoriaEstoque, CATEGORIAS_ESTOQUE } from '@/types/T_estoqueEmpresa';
import { notifyError, notifySuccess } from '@/utils/Functions';
import { getUserID, updateProfile } from '@/utils/Login';
import { FaPlus, FaArrowUp, FaArrowDown, FaExchangeAlt, FaTrash, FaPen, FaExclamationTriangle, FaHistory, FaCog } from 'react-icons/fa';

const catLabel = (v: string) => CATEGORIAS_ESTOQUE.find(c => c.value === v)?.label ?? v;

function getUserInfo() {
  const profile = updateProfile();
  const userId = getUserID() ?? '';
  const nome = profile ? `${profile.nome ?? ''} ${profile.sobrenome ?? ''}`.trim() : '';
  return { userId, nome };
}

type ModalType = null | 'add' | 'mov' | 'transferir' | 'edit' | 'historico' | 'locais';

export default function EstoquePage() {
  const [itens, setItens] = useState<T_ItemEstoque[]>([]);
  const [locais, setLocais] = useState<{ _id: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroCat, setFiltroCat] = useState('');
  const [filtroLocal, setFiltroLocal] = useState('');
  const [modal, setModal] = useState<ModalType>(null);
  const [salvando, setSalvando] = useState(false);

  // Add
  const [formNome, setFormNome] = useState('');
  const [formQtd, setFormQtd] = useState(0);
  const [formUnidade, setFormUnidade] = useState('un');
  const [formCat, setFormCat] = useState<T_CategoriaEstoque>('outros');
  const [formMinimo, setFormMinimo] = useState(0);
  const [formObs, setFormObs] = useState('');
  const [formLocal, setFormLocal] = useState('');

  // Mov
  const [movItem, setMovItem] = useState<T_ItemEstoque | null>(null);
  const [movTipo, setMovTipo] = useState<'entrada' | 'saida'>('entrada');
  const [movQtd, setMovQtd] = useState(1);
  const [movLocal, setMovLocal] = useState('');
  const [movObs, setMovObs] = useState('');

  // Transferir
  const [transItem, setTransItem] = useState<T_ItemEstoque | null>(null);
  const [transOrigem, setTransOrigem] = useState('');
  const [transDestino, setTransDestino] = useState('');
  const [transQtd, setTransQtd] = useState(1);
  const [transObs, setTransObs] = useState('');

  // Edit
  const [editItem, setEditItem] = useState<T_ItemEstoque | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editUnidade, setEditUnidade] = useState('');
  const [editCat, setEditCat] = useState<T_CategoriaEstoque>('outros');
  const [editMinimo, setEditMinimo] = useState(0);
  const [editObs, setEditObs] = useState('');

  // Historico
  const [histItem, setHistItem] = useState<T_ItemEstoque | null>(null);
  const [histMovs, setHistMovs] = useState<any[]>([]);
  const [loadingHist, setLoadingHist] = useState(false);

  // Locais
  const [novoLocal, setNovoLocal] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [it, lo] = await Promise.all([S_estoqueEmpresa.getAll(), S_estoqueEmpresa.getLocais()]);
      setItens(it);
      setLocais(lo);
    } catch { notifyError('Erro ao carregar.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const locaisNomes = locais.map(l => l.nome);

  const filtrados = itens.filter(i => {
    if (busca && !i.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    if (filtroCat && i.categoria !== filtroCat) return false;
    if (filtroLocal && !((i.locais ?? {})[filtroLocal] > 0)) return false;
    return true;
  });

  const abaixoMinimo = itens.filter(i => i.estoqueMinimo > 0 && i.quantidade < i.estoqueMinimo);

  // ── Handlers ─────────────────────────────────────

  const abrirAdd = () => {
    setFormNome(''); setFormQtd(0); setFormUnidade('un'); setFormCat('outros');
    setFormMinimo(0); setFormObs(''); setFormLocal(locaisNomes[0] ?? 'Geral');
    setModal('add');
  };

  const handleAdd = async () => {
    if (!formNome.trim()) { notifyError('Nome obrigatório.'); return; }
    setSalvando(true);
    try {
      const { userId, nome } = getUserInfo();
      await S_estoqueEmpresa.adicionar({
        nome: formNome, quantidade: formQtd, unidade: formUnidade, categoria: formCat,
        estoqueMinimo: formMinimo, observacoes: formObs, local: formLocal || 'Geral',
        criadoPor: userId, criadoPorNome: nome,
      });
      notifySuccess('Item adicionado!');
      setModal(null); await carregar();
    } catch (e: any) { notifyError(e.message); } finally { setSalvando(false); }
  };

  const abrirMov = (item: T_ItemEstoque, tipo: 'entrada' | 'saida') => {
    setMovItem(item); setMovTipo(tipo); setMovQtd(1); setMovObs('');
    setMovLocal(locaisNomes[0] ?? 'Geral');
    setModal('mov');
  };

  const handleMov = async () => {
    if (!movItem || movQtd <= 0) return;
    setSalvando(true);
    try {
      const { userId, nome } = getUserInfo();
      if (movTipo === 'entrada') await S_estoqueEmpresa.entrada(movItem._id!, movQtd, movLocal, movObs, userId, nome);
      else await S_estoqueEmpresa.saida(movItem._id!, movQtd, movLocal, movObs, userId, nome);
      notifySuccess(`${movTipo === 'entrada' ? 'Entrada' : 'Saída'} registrada!`);
      setModal(null); await carregar();
    } catch (e: any) { notifyError(e.message); } finally { setSalvando(false); }
  };

  const abrirTransferir = (item: T_ItemEstoque) => {
    setTransItem(item); setTransQtd(1); setTransObs('');
    const locaisDoItem = Object.keys(item.locais ?? {}).filter(l => (item.locais ?? {})[l] > 0);
    setTransOrigem(locaisDoItem[0] ?? '');
    setTransDestino('');
    setModal('transferir');
  };

  const handleTransferir = async () => {
    if (!transItem || transQtd <= 0 || !transOrigem || !transDestino) return;
    setSalvando(true);
    try {
      const { userId, nome } = getUserInfo();
      await S_estoqueEmpresa.transferir(transItem._id!, transQtd, transOrigem, transDestino, transObs, userId, nome);
      notifySuccess('Transferência realizada!');
      setModal(null); await carregar();
    } catch (e: any) { notifyError(e.message); } finally { setSalvando(false); }
  };

  const abrirEdit = (item: T_ItemEstoque) => {
    setEditItem(item); setEditNome(item.nome); setEditUnidade(item.unidade);
    setEditCat(item.categoria); setEditMinimo(item.estoqueMinimo); setEditObs(item.observacoes ?? '');
    setModal('edit');
  };

  const handleEdit = async () => {
    if (!editItem) return;
    setSalvando(true);
    try {
      await S_estoqueEmpresa.atualizar(editItem._id!, {
        nome: editNome, unidade: editUnidade, categoria: editCat,
        estoqueMinimo: editMinimo, observacoes: editObs,
      });
      notifySuccess('Atualizado!'); setModal(null); await carregar();
    } catch (e: any) { notifyError(e.message); } finally { setSalvando(false); }
  };

  const abrirHist = async (item: T_ItemEstoque) => {
    setHistItem(item); setHistMovs([]); setLoadingHist(true); setModal('historico');
    try { setHistMovs(await S_estoqueEmpresa.historico(item._id!)); }
    catch { notifyError('Erro ao carregar histórico.'); setModal(null); }
    finally { setLoadingHist(false); }
  };

  const handleExcluir = async (id: string) => {
    if (!confirm('Excluir item?')) return;
    try { await S_estoqueEmpresa.excluir(id); notifySuccess('Excluído.'); await carregar(); }
    catch { notifyError('Erro.'); }
  };

  const handleAddLocal = async () => {
    if (!novoLocal.trim()) return;
    try { await S_estoqueEmpresa.addLocal(novoLocal.trim()); setNovoLocal(''); await carregar(); notifySuccess('Local adicionado!'); }
    catch (e: any) { notifyError(e.message); }
  };

  const handleRemoveLocal = async (id: string) => {
    if (!confirm('Remover local?')) return;
    try { await S_estoqueEmpresa.removeLocal(id); await carregar(); } catch { notifyError('Erro.'); }
  };

  // ── Render helpers ───────────────────────────────

  const locaisDoItem = (item: T_ItemEstoque) => {
    const l = item.locais ?? {};
    return Object.entries(l).filter(([, v]) => v !== 0).sort(([a], [b]) => a.localeCompare(b, 'pt-BR'));
  };

  return (
    <PermissionWrapper href="/portal" groups={[SUPRIMENTOS_GROUP_ID]}>
      <PortalBase>
        <div className="col-span-full space-y-4">

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Estoque da Empresa</h1>
              <p className="text-xs text-gray-400">Controle de insumos do Lar Felizidade</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setModal('locais'); }}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors">
                <FaCog size={12} /> Locais
              </button>
              <button type="button" onClick={abrirAdd}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors">
                <FaPlus size={12} /> Adicionar item
              </button>
            </div>
          </div>

          {abaixoMinimo.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-sm text-yellow-800 flex items-center gap-2">
              <FaExclamationTriangle />
              <strong>{abaixoMinimo.length}</strong> item{abaixoMinimo.length !== 1 ? 'ns' : ''} abaixo do mínimo
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..."
              className="border rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 flex-1 min-w-[180px]" />
            <select value={filtroCat} onChange={e => setFiltroCat(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300">
              <option value="">Todas categorias</option>
              {CATEGORIAS_ESTOQUE.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {locaisNomes.length > 0 && (
              <select value={filtroLocal} onChange={e => setFiltroLocal(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value="">Todos locais</option>
                {locaisNomes.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            )}
          </div>

          {loading ? (
            <p className="text-center py-12 text-gray-400 text-sm">Carregando...</p>
          ) : filtrados.length === 0 ? (
            <p className="text-center py-12 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
              {itens.length === 0 ? 'Nenhum item cadastrado.' : 'Nenhum item encontrado.'}
            </p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Item</th>
                    <th className="px-4 py-2.5 text-left font-medium hidden sm:table-cell">Categoria</th>
                    <th className="px-4 py-2.5 text-center font-medium">Total</th>
                    <th className="px-4 py-2.5 text-left font-medium hidden md:table-cell">Locais</th>
                    <th className="px-4 py-2.5 text-center font-medium">Status</th>
                    <th className="px-4 py-2.5 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtrados.map(item => {
                    const zerado = item.quantidade <= 0;
                    const baixo = item.estoqueMinimo > 0 && item.quantidade < item.estoqueMinimo && !zerado;
                    const locs = locaisDoItem(item);
                    return (
                      <tr key={item._id} className={`hover:bg-gray-50 ${zerado ? 'bg-red-50/30' : baixo ? 'bg-yellow-50/30' : ''}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{item.nome}</p>
                          <p className="text-xs text-gray-400">{item.unidade}</p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{catLabel(item.categoria)}</span>
                        </td>
                        <td className={`px-4 py-3 text-center text-lg font-bold ${zerado ? 'text-red-600' : baixo ? 'text-yellow-700' : 'text-gray-800'}`}>
                          {item.quantidade}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {locs.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {locs.map(([loc, qty]) => (
                                <span key={loc} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                                  {loc}: {qty}
                                </span>
                              ))}
                            </div>
                          ) : <span className="text-xs text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {zerado ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">Zerado</span>
                            : baixo ? <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">Baixo</span>
                            : <span className="text-xs text-gray-400">OK</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => abrirMov(item, 'entrada')} className="p-1.5 rounded bg-green-50 text-green-600 hover:bg-green-100" title="Entrada"><FaArrowUp size={11} /></button>
                            <button type="button" onClick={() => abrirMov(item, 'saida')} className="p-1.5 rounded bg-red-50 text-red-500 hover:bg-red-100" title="Saída"><FaArrowDown size={11} /></button>
                            <button type="button" onClick={() => abrirTransferir(item)} className="p-1.5 rounded bg-blue-50 text-blue-500 hover:bg-blue-100" title="Transferir"><FaExchangeAlt size={11} /></button>
                            <button type="button" onClick={() => abrirHist(item)} className="p-1.5 rounded bg-gray-50 text-gray-500 hover:bg-gray-100" title="Histórico"><FaHistory size={10} /></button>
                            <button type="button" onClick={() => abrirEdit(item)} className="p-1.5 rounded bg-gray-50 text-gray-500 hover:bg-gray-100" title="Editar"><FaPen size={10} /></button>
                            <button type="button" onClick={() => handleExcluir(item._id!)} className="p-1.5 rounded bg-gray-50 text-red-400 hover:bg-red-50" title="Excluir"><FaTrash size={10} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── MODAL ADICIONAR ───────────────────── */}
        {modal === 'add' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(null)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-5 space-y-3" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800">Adicionar item</h3>
                <button type="button" onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label><input value={formNome} onChange={e => setFormNome(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Quantidade</label><input type="number" value={formQtd} onChange={e => setFormQtd(Number(e.target.value) || 0)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Unidade</label><input value={formUnidade} onChange={e => setFormUnidade(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Mínimo</label><input type="number" value={formMinimo} onChange={e => setFormMinimo(Number(e.target.value) || 0)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
                  <select value={formCat} onChange={e => setFormCat(e.target.value as T_CategoriaEstoque)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                    {CATEGORIAS_ESTOQUE.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Local</label>
                  <select value={formLocal} onChange={e => setFormLocal(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                    <option value="Geral">Geral</option>
                    {locaisNomes.map(l => <option key={l} value={l}>{l}</option>)}
                  </select></div>
              </div>
              <button type="button" onClick={handleAdd} disabled={salvando || !formNome.trim()} className="w-full py-2.5 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50">{salvando ? 'Adicionando...' : 'Adicionar'}</button>
            </div>
          </div>
        )}

        {/* ── MODAL ENTRADA/SAÍDA ───────────────── */}
        {modal === 'mov' && movItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(null)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5 space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800">{movTipo === 'entrada' ? 'Entrada' : 'Saída'} — {movItem.nome}</h3>
                <button type="button" onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
              </div>
              <p className="text-xs text-gray-500">Estoque total: <strong>{movItem.quantidade}</strong> {movItem.unidade}</p>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Local</label>
                <select value={movLocal} onChange={e => setMovLocal(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  <option value="Geral">Geral</option>
                  {locaisNomes.map(l => <option key={l} value={l}>{l}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Quantidade</label>
                <input type="number" min="1" value={movQtd} onChange={e => setMovQtd(Number(e.target.value) || 0)} className="w-full border rounded-lg px-3 py-2 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Observação</label>
                <input value={movObs} onChange={e => setMovObs(e.target.value)} placeholder="Motivo, fornecedor..." className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
              <button type="button" onClick={handleMov} disabled={salvando || movQtd <= 0}
                className={`w-full py-2.5 text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-50 ${movTipo === 'entrada' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {salvando ? 'Registrando...' : `Confirmar ${movTipo}`}
              </button>
            </div>
          </div>
        )}

        {/* ── MODAL TRANSFERIR ──────────────────── */}
        {modal === 'transferir' && transItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(null)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5 space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800">Transferir — {transItem.nome}</h3>
                <button type="button" onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
              </div>
              <div className="flex flex-wrap gap-1 text-xs">
                {locaisDoItem(transItem).map(([l, q]) => (
                  <span key={l} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{l}: {q}</span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Origem</label>
                  <select value={transOrigem} onChange={e => setTransOrigem(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                    <option value="">Selecione</option>
                    {Object.entries(transItem.locais ?? {}).filter(([, v]) => v > 0).map(([l]) => <option key={l} value={l}>{l}</option>)}
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Destino</label>
                  <select value={transDestino} onChange={e => setTransDestino(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                    <option value="">Selecione</option>
                    {locaisNomes.filter(l => l !== transOrigem).map(l => <option key={l} value={l}>{l}</option>)}
                  </select></div>
              </div>
              {transOrigem && <p className="text-xs text-gray-500">Disponível em {transOrigem}: <strong>{(transItem.locais ?? {})[transOrigem] ?? 0}</strong></p>}
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Quantidade</label>
                <input type="number" min="1" value={transQtd} onChange={e => setTransQtd(Number(e.target.value) || 0)} className="w-full border rounded-lg px-3 py-2 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Observação</label>
                <input value={transObs} onChange={e => setTransObs(e.target.value)} placeholder="Opcional" className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
              <button type="button" onClick={handleTransferir} disabled={salvando || !transOrigem || !transDestino || transQtd <= 0}
                className="w-full py-2.5 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50">
                {salvando ? 'Transferindo...' : 'Confirmar transferência'}
              </button>
            </div>
          </div>
        )}

        {/* ── MODAL EDITAR ──────────────────────── */}
        {modal === 'edit' && editItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(null)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-5 space-y-3" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800">Editar item</h3>
                <button type="button" onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Nome</label><input value={editNome} onChange={e => setEditNome(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Unidade</label><input value={editUnidade} onChange={e => setEditUnidade(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Mínimo</label><input type="number" value={editMinimo} onChange={e => setEditMinimo(Number(e.target.value) || 0)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
                <select value={editCat} onChange={e => setEditCat(e.target.value as T_CategoriaEstoque)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  {CATEGORIAS_ESTOQUE.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select></div>
              <button type="button" onClick={handleEdit} disabled={salvando} className="w-full py-2.5 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50">{salvando ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        )}

        {/* ── MODAL HISTÓRICO ───────────────────── */}
        {modal === 'historico' && histItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(null)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Histórico — {histItem.nome}</h3>
                  <p className="text-xs text-gray-400">Total: {histItem.quantidade} {histItem.unidade}</p>
                </div>
                <button type="button" onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
              </div>
              <div className="overflow-y-auto flex-1">
                {loadingHist ? <p className="text-sm text-gray-400 text-center py-8">Carregando...</p>
                  : histMovs.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">Nenhuma movimentação.</p>
                  : histMovs.map((m: any) => (
                    <div key={m._id} className="px-5 py-3 border-b border-gray-50 last:border-0 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.tipo === 'entrada' ? 'bg-green-100 text-green-600' : m.tipo === 'saida' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'}`}>
                        {m.tipo === 'entrada' ? <FaArrowUp size={12} /> : m.tipo === 'saida' ? <FaArrowDown size={12} /> : <FaExchangeAlt size={12} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-bold ${m.tipo === 'entrada' ? 'text-green-700' : m.tipo === 'saida' ? 'text-red-600' : 'text-blue-600'}`}>
                            {m.tipo === 'entrada' ? '+' : m.tipo === 'saida' ? '-' : '⇄'}{m.quantidade}
                          </span>
                          {m.local && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{m.local}</span>}
                        </div>
                        {m.observacoes && <p className="text-xs text-gray-500 mt-0.5">{m.observacoes}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">{m.criadoPorNome} — {new Date(m.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL GERENCIAR LOCAIS ─────────────── */}
        {modal === 'locais' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(null)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5 space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800">Gerenciar locais de estoque</h3>
                <button type="button" onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
              </div>
              <div className="flex gap-2">
                <input value={novoLocal} onChange={e => setNovoLocal(e.target.value)} placeholder="Nome do local"
                  onKeyDown={e => e.key === 'Enter' && handleAddLocal()}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                <button type="button" onClick={handleAddLocal} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg"><FaPlus size={12} /></button>
              </div>
              <div className="space-y-1">
                {locais.length === 0 ? <p className="text-xs text-gray-400 text-center py-4">Nenhum local cadastrado.</p>
                  : locais.map(l => (
                    <div key={l._id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">{l.nome}</span>
                      <button type="button" onClick={() => handleRemoveLocal(l._id)} className="text-red-400 hover:text-red-600"><FaTrash size={11} /></button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

      </PortalBase>
    </PermissionWrapper>
  );
}
