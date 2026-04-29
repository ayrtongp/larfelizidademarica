import React, { useEffect, useState } from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';
import PortalBase from '@/components/Portal/PortalBase';
import CalendarioM1 from '@/components/Diversos/CalendarioM1';
import { notifyError, notifySuccess } from '@/utils/Functions';
import { useHasAnyGroup } from '@/hooks/useHasAnyGroup';
import { ADMINISTRATIVO_GROUP_ID } from '@/constants/accessGroups';
import S_agendaGeral, { AgendaGeralPayload } from '@/services/S_agendaGeral';
import {
  AGENDA_GERAL_ORIGEM_LABELS,
  AGENDA_GERAL_STATUS_LABELS,
  AGENDA_GERAL_TIPO_LABELS,
  agendaGeralToEventosCalendario,
  T_AgendaGeral,
  T_AgendaGeralOrigem,
  T_AgendaGeralStatus,
  T_AgendaGeralTipo,
} from '@/types/T_agendaGeral';
import { FaCalendarAlt, FaCheck, FaEdit, FaPlus, FaTimes, FaTrash } from 'react-icons/fa';

interface Paciente {
  _id: string;
  display_name: string;
}

interface UsuarioProfissional {
  _id: string;
  nome: string;
  sobrenome?: string;
  funcao?: string;
}

const AGENDA_ACCESS_GROUPS = [ADMINISTRATIVO_GROUP_ID, 'rh', 'coordenacao'];
const TIPOS = Object.keys(AGENDA_GERAL_TIPO_LABELS) as T_AgendaGeralTipo[];
const ORIGENS = Object.keys(AGENDA_GERAL_ORIGEM_LABELS) as T_AgendaGeralOrigem[];
const STATUS = Object.keys(AGENDA_GERAL_STATUS_LABELS) as T_AgendaGeralStatus[];

const EMPTY_FORM = {
  titulo: '',
  data: '',
  horario: '',
  tipo: 'compromisso' as T_AgendaGeralTipo,
  origem: 'equipe' as T_AgendaGeralOrigem,
  status: 'agendado' as T_AgendaGeralStatus,
  residente_id: '',
  usuario_id: '',
  local: '',
  informado_por: '',
  descricao: '',
};

function statusChipClass(status: T_AgendaGeralStatus) {
  if (status === 'concluido') return 'bg-green-100 text-green-700';
  if (status === 'cancelado') return 'bg-rose-100 text-rose-700';
  return 'bg-sky-100 text-sky-700';
}

function tipoChipClass(tipo: T_AgendaGeralTipo) {
  if (tipo === 'consulta' || tipo === 'retorno') return 'bg-indigo-100 text-indigo-700';
  if (tipo === 'exame') return 'bg-amber-100 text-amber-700';
  if (tipo === 'reuniao') return 'bg-violet-100 text-violet-700';
  if (tipo === 'visita') return 'bg-cyan-100 text-cyan-700';
  return 'bg-gray-100 text-gray-700';
}

function formatDate(iso: string) {
  if (!iso) return '';
  return iso.split('-').reverse().join('/');
}

export default function AgendaGeralPage() {
  const { hasGroup: hasAccess, loading: loadingAccess } = useHasAnyGroup(AGENDA_ACCESS_GROUPS);

  const [items, setItems] = useState<T_AgendaGeral[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioProfissional[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'all' | T_AgendaGeralStatus>('all');
  const [filtroVinculo, setFiltroVinculo] = useState<'todos' | 'residente' | 'usuario' | 'geral'>('todos');
  const [form, setForm] = useState(EMPTY_FORM);

  async function loadAgenda() {
    const data = await S_agendaGeral.getAll();
    setItems(Array.isArray(data) ? data : []);
  }

  async function loadBaseData() {
    setLoading(true);
    try {
      const [agenda, pacientesRes, usuariosRes] = await Promise.all([
        S_agendaGeral.getAll(),
        fetch('/api/Controller/patient.controller?type=getActivePatients'),
        fetch('/api/Controller/Usuario?type=getProfissionais&ativo=S'),
      ]);

      const pacientesJson = pacientesRes.ok ? await pacientesRes.json() : [];
      const usuariosJson = usuariosRes.ok ? await usuariosRes.json() : [];

      setItems(Array.isArray(agenda) ? agenda : []);
      setPacientes(Array.isArray(pacientesJson) ? pacientesJson : []);
      setUsuarios(Array.isArray(usuariosJson) ? usuariosJson : []);
    } catch (error) {
      console.error('Erro ao carregar agenda geral:', error);
      notifyError('Erro ao carregar agenda geral.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!hasAccess) return;
    loadBaseData();
  }, [hasAccess]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function handleEdit(item: T_AgendaGeral) {
    setEditingId(item._id || null);
    setForm({
      titulo: item.titulo || '',
      data: item.data || '',
      horario: item.horario || '',
      tipo: item.tipo,
      origem: item.origem,
      status: item.status,
      residente_id: item.residente_id || '',
      usuario_id: item.usuario_id || '',
      local: item.local || '',
      informado_por: item.informado_por || '',
      descricao: item.descricao || '',
    });
  }

  async function handleSave() {
    if (!form.titulo.trim()) {
      notifyError('Título é obrigatório.');
      return;
    }

    if (!form.data) {
      notifyError('Data é obrigatória.');
      return;
    }

    setSaving(true);
    try {
      const createPayload: AgendaGeralPayload = {
        titulo: form.titulo.trim(),
        data: form.data,
        horario: form.horario.trim() || undefined,
        tipo: form.tipo,
        origem: form.origem,
        status: form.status,
        residente_id: form.residente_id || undefined,
        usuario_id: form.usuario_id || undefined,
        local: form.local.trim() || undefined,
        informado_por: form.informado_por.trim() || undefined,
        descricao: form.descricao.trim() || undefined,
      };

      if (editingId) {
        await S_agendaGeral.update(editingId, {
          ...createPayload,
          horario: form.horario.trim(),
          residente_id: form.residente_id,
          usuario_id: form.usuario_id,
          local: form.local.trim(),
          informado_por: form.informado_por.trim(),
          descricao: form.descricao.trim(),
        });
        notifySuccess('Evento atualizado.');
      } else {
        await S_agendaGeral.create(createPayload);
        notifySuccess('Evento criado.');
      }

      await loadAgenda();
      resetForm();
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'Erro ao salvar evento.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id?: string) {
    if (!id) return;
    if (!confirm('Remover este evento da agenda?')) return;

    try {
      await S_agendaGeral.remove(id);
      notifySuccess('Evento removido.');
      if (editingId === id) resetForm();
      await loadAgenda();
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'Erro ao remover evento.');
    }
  }

  async function handleStatusChange(item: T_AgendaGeral, status: T_AgendaGeralStatus) {
    if (!item._id || item.status === status) return;

    try {
      await S_agendaGeral.update(item._id, { status });
      notifySuccess(`Status alterado para ${AGENDA_GERAL_STATUS_LABELS[status].toLowerCase()}.`);
      await loadAgenda();
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'Erro ao atualizar status.');
    }
  }

  const termoBusca = busca.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    if (filtroStatus !== 'all' && item.status !== filtroStatus) return false;

    if (filtroVinculo === 'residente' && !item.residente_id) return false;
    if (filtroVinculo === 'usuario' && !item.usuario_id) return false;
    if (filtroVinculo === 'geral' && (item.residente_id || item.usuario_id)) return false;

    if (!termoBusca) return true;

    const haystack = [
      item.titulo,
      item.nomeResidente,
      item.nomeUsuario,
      item.local,
      item.informado_por,
      item.descricao,
    ].filter(Boolean).join(' ').toLowerCase();

    return haystack.includes(termoBusca);
  });

  const eventosCalendario = agendaGeralToEventosCalendario(
    filteredItems.filter((item) => item.status !== 'cancelado'),
  );

  const hoje = new Date().toISOString().split('T')[0];
  const totalFuturos = items.filter((item) => item.status === 'agendado' && item.data >= hoje).length;
  const totalComResidente = items.filter((item) => item.residente_id).length;
  const totalComColaborador = items.filter((item) => item.usuario_id).length;

  if (loadingAccess) return null;

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300';
  const labelCls = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';

  return (
    <PermissionWrapper href="/portal" groups={AGENDA_ACCESS_GROUPS}>
      <PortalBase>
        <div className="col-span-full space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Administrativo</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900">Agenda Geral</h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-500">
                  Registre consultas, exames, reuniões, retornos e informes com vínculo opcional a idosa ou colaborador.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-sky-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Próximos</p>
                  <p className="mt-1 text-2xl font-bold text-sky-900">{totalFuturos}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Com idosa</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-900">{totalComResidente}</p>
                </div>
                <div className="rounded-2xl bg-violet-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Com colaborador</p>
                  <p className="mt-1 text-2xl font-bold text-violet-900">{totalComColaborador}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[380px,minmax(0,1fr)]">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {editingId ? 'Editar evento' : 'Novo evento'}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {editingId ? 'Ajuste os dados e salve.' : 'Cadastre um agendamento ou informe.'}
                  </p>
                </div>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    <FaTimes size={10} />
                    Limpar
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Título</label>
                  <input
                    value={form.titulo}
                    onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))}
                    className={inputCls}
                    placeholder="Ex.: Consulta com cardiologista"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Data</label>
                    <input
                      type="date"
                      value={form.data}
                      onChange={(e) => setForm((prev) => ({ ...prev, data: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Horário</label>
                    <input
                      type="time"
                      value={form.horario}
                      onChange={(e) => setForm((prev) => ({ ...prev, horario: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className={labelCls}>Tipo</label>
                    <select
                      value={form.tipo}
                      onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value as T_AgendaGeralTipo }))}
                      className={inputCls}
                    >
                      {TIPOS.map((tipo) => (
                        <option key={tipo} value={tipo}>{AGENDA_GERAL_TIPO_LABELS[tipo]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Origem</label>
                    <select
                      value={form.origem}
                      onChange={(e) => setForm((prev) => ({ ...prev, origem: e.target.value as T_AgendaGeralOrigem }))}
                      className={inputCls}
                    >
                      {ORIGENS.map((origem) => (
                        <option key={origem} value={origem}>{AGENDA_GERAL_ORIGEM_LABELS[origem]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as T_AgendaGeralStatus }))}
                      className={inputCls}
                    >
                      {STATUS.map((status) => (
                        <option key={status} value={status}>{AGENDA_GERAL_STATUS_LABELS[status]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Idosa vinculada</label>
                  <select
                    value={form.residente_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, residente_id: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">Sem vínculo com idosa</option>
                    {pacientes.map((paciente) => (
                      <option key={paciente._id} value={paciente._id}>{paciente.display_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Servidor vinculado</label>
                  <select
                    value={form.usuario_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, usuario_id: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">Sem vínculo com colaborador</option>
                    {usuarios.map((usuario) => (
                      <option key={usuario._id} value={usuario._id}>
                        {[usuario.nome, usuario.sobrenome].filter(Boolean).join(' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Local</label>
                  <input
                    value={form.local}
                    onChange={(e) => setForm((prev) => ({ ...prev, local: e.target.value }))}
                    className={inputCls}
                    placeholder="Ex.: Clínica, sala de reunião, hospital"
                  />
                </div>

                <div>
                  <label className={labelCls}>Informado por</label>
                  <input
                    value={form.informado_por}
                    onChange={(e) => setForm((prev) => ({ ...prev, informado_por: e.target.value }))}
                    className={inputCls}
                    placeholder="Ex.: familiar, recepção, RH"
                  />
                </div>

                <div>
                  <label className={labelCls}>Observações</label>
                  <textarea
                    value={form.descricao}
                    onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))}
                    className={`${inputCls} min-h-[96px] resize-y`}
                    placeholder="Detalhes importantes para a equipe."
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                  >
                    {editingId ? <FaCheck size={12} /> : <FaPlus size={12} />}
                    {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar evento'}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Cancelar edição
                    </button>
                  )}
                </div>
              </div>
            </section>

            <div className="space-y-5">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Calendário</h2>
                    <p className="text-sm text-slate-500">Eventos ativos conforme os filtros atuais.</p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className={inputCls}
                      placeholder="Buscar por título, local, idosa ou colaborador"
                    />
                    <select
                      value={filtroVinculo}
                      onChange={(e) => setFiltroVinculo(e.target.value as 'todos' | 'residente' | 'usuario' | 'geral')}
                      className={inputCls}
                    >
                      <option value="todos">Todos os vínculos</option>
                      <option value="residente">Com idosa</option>
                      <option value="usuario">Com colaborador</option>
                      <option value="geral">Somente gerais</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setFiltroStatus('all')}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filtroStatus === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Todos
                  </button>
                  {STATUS.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFiltroStatus(status)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filtroStatus === status ? statusChipClass(status) : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {AGENDA_GERAL_STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div className="py-16 text-center text-sm text-slate-500">Carregando calendário...</div>
                ) : (
                  <CalendarioM1 eventos={eventosCalendario} />
                )}
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Lista de eventos</h2>
                    <p className="text-sm text-slate-500">
                      {filteredItems.length} registro(s) dentro do filtro atual.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    <FaCalendarAlt size={11} />
                    Agenda compartilhada
                  </div>
                </div>

                {loading ? (
                  <div className="py-16 text-center text-sm text-slate-500">Carregando eventos...</div>
                ) : filteredItems.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-12 text-center text-sm text-slate-500">
                    Nenhum evento encontrado com esse filtro.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredItems.map((item) => (
                      <article key={item._id} className="rounded-2xl border border-slate-200 px-4 py-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tipoChipClass(item.tipo)}`}>
                                {AGENDA_GERAL_TIPO_LABELS[item.tipo]}
                              </span>
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusChipClass(item.status)}`}>
                                {AGENDA_GERAL_STATUS_LABELS[item.status]}
                              </span>
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                {AGENDA_GERAL_ORIGEM_LABELS[item.origem]}
                              </span>
                            </div>

                            <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.titulo}</h3>

                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                              <span>{formatDate(item.data)}{item.horario ? ` às ${item.horario}` : ''}</span>
                              <span>{item.nomeResidente ? `Idosa: ${item.nomeResidente}` : 'Sem idosa vinculada'}</span>
                              <span>{item.nomeUsuario ? `Servidor: ${item.nomeUsuario}` : 'Sem colaborador vinculado'}</span>
                              {item.local && <span>Local: {item.local}</span>}
                              {item.informado_por && <span>Informado por: {item.informado_por}</span>}
                            </div>

                            {item.descricao && (
                              <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{item.descricao}</p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 lg:justify-end">
                            {item.status !== 'agendado' && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(item, 'agendado')}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                              >
                                Reabrir
                              </button>
                            )}

                            {item.status !== 'concluido' && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(item, 'concluido')}
                                className="rounded-xl bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100"
                              >
                                Concluir
                              </button>
                            )}

                            {item.status !== 'cancelado' && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(item, 'cancelado')}
                                className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                              >
                                Cancelar
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              <FaEdit size={11} />
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(item._id)}
                              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                            >
                              <FaTrash size={11} />
                              Excluir
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </PortalBase>
    </PermissionWrapper>
  );
}
