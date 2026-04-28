import React, { useCallback, useEffect, useState } from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';
import PortalBase from '@/components/Portal/PortalBase';
import { notifyError, notifySuccess, getUserDetails } from '@/utils/Functions';
import { getUserID } from '@/utils/Login';
import { useHasGroup } from '@/hooks/useHasGroup';
import ComboBox, { Opcao } from '@/components/UI/ComboBox';

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Prioridade = 'baixa' | 'normal' | 'alta' | 'urgente';
type StatusTarefa = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
type FiltroStatus = StatusTarefa | 'todas' | 'atrasada';

interface Tarefa {
  _id: string;
  titulo: string;
  descricao?: string;
  categoria_id?: string | null;
  categoria_nome?: string;
  prioridade: Prioridade;
  status: StatusTarefa;
  atribuido_a?: string | null;
  atribuido_nome?: string;
  prazo: string;
  horario?: string;
  criado_por: string;
  criado_por_nome: string;
  concluido_em?: string;
  concluido_por_nome?: string;
  createdAt: string;
}

interface Categoria {
  _id: string;
  nome: string;
  cor: string;
  ativo: boolean;
}

interface UsuarioOpcao {
  _id: string;
  nome: string;
  sobrenome?: string;
  funcao?: string;
}

// ── Constantes de cores ───────────────────────────────────────────────────────

const PRIORIDADE_CONFIG: Record<Prioridade, { label: string; cls: string }> = {
  baixa:   { label: 'Baixa',   cls: 'bg-gray-100 text-gray-500' },
  normal:  { label: 'Normal',  cls: 'bg-blue-100 text-blue-600' },
  alta:    { label: 'Alta',    cls: 'bg-orange-100 text-orange-600' },
  urgente: { label: 'Urgente', cls: 'bg-red-100 text-red-600' },
};

const STATUS_CONFIG: Record<StatusTarefa, { label: string; cls: string }> = {
  pendente:     { label: 'Pendente',     cls: 'bg-yellow-100 text-yellow-700' },
  em_andamento: { label: 'Em andamento', cls: 'bg-blue-100 text-blue-700' },
  concluida:    { label: 'Concluída',    cls: 'bg-green-100 text-green-700' },
  cancelada:    { label: 'Cancelada',    cls: 'bg-gray-100 text-gray-500' },
};

const CAT_COLORS: Record<string, string> = {
  blue:   'bg-blue-100 text-blue-700',
  green:  'bg-green-100 text-green-700',
  red:    'bg-red-100 text-red-600',
  orange: 'bg-orange-100 text-orange-600',
  purple: 'bg-purple-100 text-purple-700',
  pink:   'bg-pink-100 text-pink-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  gray:   'bg-gray-100 text-gray-600',
};

const CORES_OPCOES = Object.keys(CAT_COLORS);

function hoje(): string {
  return new Date().toISOString().split('T')[0];
}

function isAtrasada(t: Tarefa): boolean {
  return (t.status === 'pendente' || t.status === 'em_andamento') && t.prazo < hoje();
}

function formatPrazo(prazo: string): string {
  const [y, m, d] = prazo.split('-');
  return `${d}/${m}/${y}`;
}

// ── Formulário vazio ───────────────────────────────────────────────────────────

const emptyForm = {
  titulo: '',
  descricao: '',
  prioridade: 'normal' as Prioridade,
  prazo: '',
  horario: '',
};

// ── Componente principal ───────────────────────────────────────────────────────

export default function TarefasPage() {
  const userInfo  = typeof window !== 'undefined' ? getUserDetails() as any : {};
  const userId    = (getUserID() as string) ?? '';
  const { hasGroup: hasCoordenacao } = useHasGroup('coordenacao');

  const [tarefas,    setTarefas]    = useState<Tarefa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [usuarios,   setUsuarios]   = useState<UsuarioOpcao[]>([]);

  const [filtro,    setFiltro]    = useState<FiltroStatus>('todas');
  const [soMinhas,  setSoMinhas]  = useState(false);
  const [loading,   setLoading]   = useState(true);

  // Modal tarefa
  const [modalAberto,  setModalAberto]  = useState(false);
  const [editando,     setEditando]     = useState<Tarefa | null>(null);
  const [form,         setForm]         = useState(emptyForm);
  const [catSel,       setCatSel]       = useState<Opcao | null>(null);
  const [userSel,      setUserSel]      = useState<Opcao | null>(null);
  const [salvando,     setSalvando]     = useState(false);

  // Seção categorias
  const [catAberta,    setCatAberta]    = useState(false);
  const [catForm,      setCatForm]      = useState({ nome: '', cor: 'blue' });
  const [catEditId,    setCatEditId]    = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchTarefas = useCallback(async () => {
    const params = new URLSearchParams({ type: 'getAll', userId });
    if (!soMinhas && hasCoordenacao) params.set('all', 'true');
    const data = await fetch(`/api/Controller/C_tarefas?${params}`).then(r => r.json());
    setTarefas(Array.isArray(data) ? data : []);
  }, [userId, soMinhas, hasCoordenacao]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchTarefas(),
      fetch('/api/Controller/C_tarefasCategorias').then(r => r.json()).then(d => setCategorias(Array.isArray(d) ? d : [])),
      fetch('/api/Controller/Usuario?type=getProfissionais').then(r => r.json()).then(d => setUsuarios(Array.isArray(d) ? d : [])),
    ]).finally(() => setLoading(false));
  }, [fetchTarefas]);

  // ── Filtro local ───────────────────────────────────────────────────────────

  const tarefasFiltradas = tarefas.filter(t => {
    if (soMinhas && t.atribuido_a !== userId && t.atribuido_a != null) return false;
    if (filtro === 'todas')    return true;
    if (filtro === 'atrasada') return isAtrasada(t);
    return t.status === filtro;
  });

  // ── Abrir modal ────────────────────────────────────────────────────────────

  function abrirCriar() {
    setEditando(null);
    setForm(emptyForm);
    setCatSel(null);
    setUserSel(null);
    setModalAberto(true);
  }

  function abrirEditar(t: Tarefa) {
    setEditando(t);
    setForm({ titulo: t.titulo, descricao: t.descricao || '', prioridade: t.prioridade, prazo: t.prazo, horario: t.horario || '' });
    setCatSel(t.categoria_id ? { _id: t.categoria_id, nome: t.categoria_nome || '' } : null);
    setUserSel(t.atribuido_a ? { _id: t.atribuido_a, nome: t.atribuido_nome || '' } : null);
    setModalAberto(true);
  }

  // ── Salvar tarefa ──────────────────────────────────────────────────────────

  async function handleSalvar() {
    if (!form.titulo.trim()) return notifyError('Título é obrigatório.');
    if (!form.prazo)         return notifyError('Prazo é obrigatório.');
    setSalvando(true);
    try {
      const body = {
        ...form,
        categoria_id:    catSel?._id  || null,
        categoria_nome:  catSel?.nome || '',
        atribuido_a:     userSel?._id  || null,
        atribuido_nome:  userSel?.nome || '',
        criado_por:      userId,
        criado_por_nome: userInfo?.nome || '',
      };

      if (editando) {
        const r = await fetch(`/api/Controller/C_tarefas?type=editar&id=${editando._id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error();
        notifySuccess('Tarefa atualizada.');
      } else {
        const r = await fetch('/api/Controller/C_tarefas', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error();
        notifySuccess('Tarefa criada.');
      }
      setModalAberto(false);
      fetchTarefas();
    } catch {
      notifyError('Erro ao salvar tarefa.');
    } finally {
      setSalvando(false);
    }
  }

  // ── Status ─────────────────────────────────────────────────────────────────

  async function handleStatus(id: string, status: StatusTarefa) {
    await fetch(`/api/Controller/C_tarefas?type=status&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, userId, userName: userInfo?.nome || '' }),
    });
    fetchTarefas();
  }

  // ── Excluir ────────────────────────────────────────────────────────────────

  async function handleExcluir(id: string) {
    if (!confirm('Excluir esta tarefa?')) return;
    await fetch(`/api/Controller/C_tarefas?id=${id}`, { method: 'DELETE' });
    notifySuccess('Tarefa excluída.');
    fetchTarefas();
  }

  // ── Categorias ─────────────────────────────────────────────────────────────

  async function handleSalvarCategoria() {
    if (!catForm.nome.trim()) return notifyError('Nome da categoria é obrigatório.');
    if (catEditId) {
      await fetch(`/api/Controller/C_tarefasCategorias?id=${catEditId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(catForm),
      });
    } else {
      await fetch('/api/Controller/C_tarefasCategorias', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(catForm),
      });
    }
    notifySuccess(catEditId ? 'Categoria atualizada.' : 'Categoria criada.');
    setCatForm({ nome: '', cor: 'blue' });
    setCatEditId(null);
    const d = await fetch('/api/Controller/C_tarefasCategorias').then(r => r.json());
    setCategorias(Array.isArray(d) ? d : []);
  }

  async function handleExcluirCategoria(id: string) {
    if (!confirm('Excluir esta categoria?')) return;
    await fetch(`/api/Controller/C_tarefasCategorias?id=${id}`, { method: 'DELETE' });
    const d = await fetch('/api/Controller/C_tarefasCategorias').then(r => r.json());
    setCategorias(Array.isArray(d) ? d : []);
  }

  // ── Helpers visuais ────────────────────────────────────────────────────────

  const catOpcoes: Opcao[] = categorias.map(c => ({ _id: c._id, nome: c.nome, cor: c.cor }));
  const userOpcoes: Opcao[] = usuarios.map(u => ({ _id: u._id, nome: `${u.nome}${u.sobrenome ? ' ' + u.sobrenome : ''}`, funcao: u.funcao }));

  const atrasadasCount = tarefas.filter(isAtrasada).length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <PermissionWrapper href=''>
      <PortalBase>
        <div className='col-span-full flex flex-col gap-6 pb-10'>

          {/* Cabeçalho */}
          <div className='flex items-center justify-between flex-wrap gap-3'>
            <div className='flex items-center gap-3'>
              <h1 className='text-2xl font-bold text-gray-800'>Tarefas</h1>
              {atrasadasCount > 0 && (
                <span className='bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5'>
                  {atrasadasCount} atrasada{atrasadasCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <button
              onClick={abrirCriar}
              className='bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors'
            >
              + Nova Tarefa
            </button>
          </div>

          {/* Filtros */}
          <div className='flex flex-wrap items-center gap-2'>
            {(['todas', 'pendente', 'em_andamento', 'concluida', 'cancelada', 'atrasada'] as FiltroStatus[]).map(f => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filtro === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'todas' ? 'Todas' : f === 'atrasada' ? 'Atrasadas' : STATUS_CONFIG[f as StatusTarefa]?.label}
              </button>
            ))}
            <label className='flex items-center gap-2 ml-2 text-sm text-gray-600 cursor-pointer select-none'>
              <input
                type='checkbox'
                checked={soMinhas}
                onChange={e => setSoMinhas(e.target.checked)}
                className='rounded'
              />
              Só minhas
            </label>
          </div>

          {/* Lista de tarefas */}
          {loading ? (
            <div className='text-gray-400 text-center py-10'>Carregando...</div>
          ) : tarefasFiltradas.length === 0 ? (
            <div className='text-gray-400 text-center py-10 bg-white rounded-2xl'>
              Nenhuma tarefa encontrada.
            </div>
          ) : (
            <div className='flex flex-col gap-3'>
              {tarefasFiltradas.map(t => {
                const atrasada = isAtrasada(t);
                const cat = categorias.find(c => c._id === t.categoria_id);
                return (
                  <div
                    key={t._id}
                    className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${
                      atrasada ? 'border-red-400' : t.status === 'concluida' ? 'border-green-400' : 'border-gray-200'
                    }`}
                  >
                    <div className='flex items-start justify-between gap-3 flex-wrap'>
                      <div className='flex-1 min-w-0'>
                        <div className='flex flex-wrap items-center gap-2 mb-1'>
                          {/* Prioridade */}
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORIDADE_CONFIG[t.prioridade].cls}`}>
                            {PRIORIDADE_CONFIG[t.prioridade].label}
                          </span>
                          {/* Categoria */}
                          {cat && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CAT_COLORS[cat.cor] || CAT_COLORS.gray}`}>
                              {cat.nome}
                            </span>
                          )}
                          {/* Status */}
                          {!atrasada && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CONFIG[t.status].cls}`}>
                              {STATUS_CONFIG[t.status].label}
                            </span>
                          )}
                          {atrasada && (
                            <span className='text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold'>
                              Atrasada
                            </span>
                          )}
                        </div>
                        <p className={`text-base font-semibold ${t.status === 'concluida' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {t.titulo}
                        </p>
                        {t.descricao && (
                          <p className='text-sm text-gray-500 mt-0.5 line-clamp-2'>{t.descricao}</p>
                        )}
                        <div className='flex flex-wrap gap-3 mt-2 text-xs text-gray-400'>
                          <span className={atrasada ? 'text-red-500 font-semibold' : ''}>
                            Prazo: {formatPrazo(t.prazo)}{t.horario ? ` às ${t.horario}` : ''}
                          </span>
                          <span>
                            {t.atribuido_nome ? `→ ${t.atribuido_nome}` : 'Geral (equipe)'}
                          </span>
                          {t.concluido_por_nome && (
                            <span>Concluída por {t.concluido_por_nome}</span>
                          )}
                        </div>
                      </div>

                      {/* Ações */}
                      <div className='flex items-center gap-2 shrink-0'>
                        {t.status === 'pendente' && (
                          <button
                            onClick={() => handleStatus(t._id, 'em_andamento')}
                            className='text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded-lg transition-colors'
                          >
                            Iniciar
                          </button>
                        )}
                        {(t.status === 'pendente' || t.status === 'em_andamento') && (
                          <button
                            onClick={() => handleStatus(t._id, 'concluida')}
                            className='text-xs bg-green-50 hover:bg-green-100 text-green-600 px-2 py-1 rounded-lg transition-colors'
                          >
                            Concluir
                          </button>
                        )}
                        <button
                          onClick={() => abrirEditar(t)}
                          className='text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 px-2 py-1 rounded-lg transition-colors'
                        >
                          Editar
                        </button>
                        {hasCoordenacao && (
                          <button
                            onClick={() => handleExcluir(t._id)}
                            className='text-xs bg-red-50 hover:bg-red-100 text-red-500 px-2 py-1 rounded-lg transition-colors'
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Gerenciar Categorias (admin) */}
          {hasCoordenacao && (
            <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
              <button
                onClick={() => setCatAberta(p => !p)}
                className='w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors'
              >
                <span>Gerenciar Categorias</span>
                <span className='text-gray-400'>{catAberta ? '▲' : '▼'}</span>
              </button>
              {catAberta && (
                <div className='px-5 pb-5 border-t border-gray-100 space-y-4'>
                  {/* Form nova/editar */}
                  <div className='flex flex-wrap gap-3 pt-4 items-end'>
                    <div className='flex-1 min-w-[160px]'>
                      <label className='block text-xs font-medium text-gray-500 mb-1'>Nome</label>
                      <input
                        type='text'
                        value={catForm.nome}
                        onChange={e => setCatForm(p => ({ ...p, nome: e.target.value }))}
                        className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300'
                        placeholder='Ex.: Manutenção'
                      />
                    </div>
                    <div>
                      <label className='block text-xs font-medium text-gray-500 mb-1'>Cor</label>
                      <select
                        value={catForm.cor}
                        onChange={e => setCatForm(p => ({ ...p, cor: e.target.value }))}
                        className='border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none'
                      >
                        {CORES_OPCOES.map(c => (
                          <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handleSalvarCategoria}
                      className='bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors'
                    >
                      {catEditId ? 'Salvar' : 'Adicionar'}
                    </button>
                    {catEditId && (
                      <button
                        onClick={() => { setCatEditId(null); setCatForm({ nome: '', cor: 'blue' }); }}
                        className='text-sm text-gray-400 hover:text-gray-600 px-2 py-2'
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                  {/* Lista de categorias */}
                  <div className='flex flex-wrap gap-2'>
                    {categorias.map(c => (
                      <div key={c._id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${CAT_COLORS[c.cor] || CAT_COLORS.gray}`}>
                        <span>{c.nome}</span>
                        <button
                          onClick={() => { setCatEditId(c._id); setCatForm({ nome: c.nome, cor: c.cor }); }}
                          className='opacity-60 hover:opacity-100 text-xs'
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleExcluirCategoria(c._id)}
                          className='opacity-60 hover:opacity-100 text-xs'
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {categorias.length === 0 && (
                      <p className='text-sm text-gray-400'>Nenhuma categoria criada ainda.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal criar/editar tarefa */}
        {modalAberto && (
          <div className='fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4'>
            <div className='bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto'>
              <div className='px-6 py-5 border-b border-gray-100 flex items-center justify-between'>
                <h2 className='text-lg font-bold text-gray-800'>
                  {editando ? 'Editar Tarefa' : 'Nova Tarefa'}
                </h2>
                <button onClick={() => setModalAberto(false)} className='text-gray-400 hover:text-gray-600 text-2xl leading-none'>&times;</button>
              </div>
              <div className='px-6 py-5 space-y-4'>

                {/* Título */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Título *</label>
                  <input
                    type='text'
                    value={form.titulo}
                    onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
                    className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300'
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Descrição</label>
                  <textarea
                    value={form.descricao}
                    onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
                    rows={3}
                    className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none'
                  />
                </div>

                {/* Categoria */}
                <div>
                  <ComboBox
                    label='Categoria'
                    options={catOpcoes}
                    value={catSel}
                    onChange={setCatSel}
                    clearable
                    showIdSuffix={false}
                    emptyText='Nenhuma categoria encontrada'
                  />
                </div>

                {/* Prioridade */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Prioridade</label>
                  <select
                    value={form.prioridade}
                    onChange={e => setForm(p => ({ ...p, prioridade: e.target.value as Prioridade }))}
                    className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none'
                  >
                    <option value='baixa'>Baixa</option>
                    <option value='normal'>Normal</option>
                    <option value='alta'>Alta</option>
                    <option value='urgente'>Urgente</option>
                  </select>
                </div>

                {/* Prazo + Horário */}
                <div className='flex gap-3'>
                  <div className='flex-1'>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Prazo *</label>
                    <input
                      type='date'
                      value={form.prazo}
                      onChange={e => setForm(p => ({ ...p, prazo: e.target.value }))}
                      className='w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Horário</label>
                    <input
                      type='time'
                      value={form.horario}
                      onChange={e => setForm(p => ({ ...p, horario: e.target.value }))}
                      className='border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none'
                    />
                  </div>
                </div>

                {/* Atribuir a */}
                <div>
                  <ComboBox
                    label='Atribuir a (opcional — vazio = geral)'
                    options={userOpcoes}
                    value={userSel}
                    onChange={setUserSel}
                    clearable
                    showIdSuffix={false}
                    getOptionSubtitle={o => o.funcao || null}
                    showSubtitle
                    emptyText='Nenhum usuário encontrado'
                  />
                </div>

              </div>
              <div className='px-6 pb-5 flex gap-3 justify-end'>
                <button
                  onClick={() => setModalAberto(false)}
                  className='px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors'
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvar}
                  disabled={salvando}
                  className='bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors'
                >
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}

      </PortalBase>
    </PermissionWrapper>
  );
}
