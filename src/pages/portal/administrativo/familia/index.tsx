import React, { useEffect, useState } from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';
import PortalBase from '@/components/Portal/PortalBase';
import { notifyError, notifySuccess } from '@/utils/Functions';
import { FaUsers, FaPlus, FaTrash, FaTimes, FaLink, FaUnlink, FaEnvelope, FaCalendarAlt, FaNewspaper, FaCheck, FaReply } from 'react-icons/fa';
import { PARENTESCO_OPTIONS } from '@/types/T_familiarResidente';
import S_familiarResidente from '@/services/S_familiarResidente';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface UsuarioFamiliar {
  _id: string; nome: string; sobrenome?: string; usuario: string; email?: string; ativo: 'S' | 'N';
}
interface Vinculo {
  _id: string; usuario_id: string; residente_id: string; parentesco: string; ativo: boolean;
  usuario?: { nome: string; sobrenome?: string; usuario: string };
  residente?: { _id: string; display_name: string };
}
interface Paciente { _id: string; display_name: string; }
interface Mensagem {
  _id: string; usuario_id: string; residente_id: string; assunto: string; texto: string;
  lida_admin: boolean; resposta?: string; respondida_em?: string;
  status: 'nova' | 'lida' | 'respondida'; createdAt: string;
  nomeUsuario?: string; nomeResidente?: string;
}
interface Visita {
  _id: string; residente_id: string; data: string; horario?: string;
  descricao?: string; confirmada: boolean; nomeResidente?: string;
}
interface Boletim {
  _id: string; residente_id: string; tipo: string; titulo: string; conteudo: string;
  periodo: string; publicado: boolean; publicado_em?: string;
  nomeResidente?: string; createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls = 'w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition bg-white';
const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';

// ── Modal: criar usuário familiar ─────────────────────────────────────────────

const CriarUsuarioModal: React.FC<{ pacientes: Paciente[]; onClose: () => void; onSaved: () => void }> = ({ pacientes, onClose, onSaved }) => {
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [usuarioLogin, setUsuarioLogin] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [residenteId, setResidenteId] = useState('');
  const [parentesco, setParentesco] = useState('');
  const [saving, setSaving] = useState(false);

  const canSave = nome.trim() && usuarioLogin.trim() && senha.length >= 6 && residenteId && parentesco;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      const resUser = await fetch('/api/Controller/Usuario?type=newFamiliar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim(), sobrenome: sobrenome.trim(), usuario: usuarioLogin.trim(), email: email.trim() || undefined, senha, funcoes: ['familiar'], ativo: 'S', admin: 'N' }),
      });
      const jsonUser = await resUser.json();
      if (!resUser.ok) throw new Error(jsonUser.message || 'Erro ao criar usuário.');
      const usuarioId = String(jsonUser.id ?? jsonUser._id ?? jsonUser.insertedId);
      await S_familiarResidente.createVinculo({ usuario_id: usuarioId, residente_id: residenteId, parentesco });
      notifySuccess('Familiar cadastrado e vinculado com sucesso!');
      onSaved();
    } catch (e: unknown) {
      notifyError(e instanceof Error ? e.message : 'Erro ao cadastrar.');
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Novo acesso de família</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><FaTimes size={14} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Nome *</label><input value={nome} onChange={e => setNome(e.target.value)} placeholder="João" className={inputCls} autoFocus /></div>
          <div><label className={labelCls}>Sobrenome</label><input value={sobrenome} onChange={e => setSobrenome(e.target.value)} placeholder="Silva" className={inputCls} /></div>
        </div>
        <div><label className={labelCls}>Usuário de login *</label><input value={usuarioLogin} onChange={e => setUsuarioLogin(e.target.value.toLowerCase().replace(/\s/g, ''))} placeholder="joao.silva" className={inputCls} /></div>
        <div><label className={labelCls}>E-mail</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="joao@email.com" className={inputCls} /></div>
        <div><label className={labelCls}>Senha * (mín. 6 caracteres)</label><input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" className={inputCls} autoComplete="new-password" /></div>
        <hr className="border-gray-100" />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vínculo com residente</p>
        <div><label className={labelCls}>Residente *</label><select value={residenteId} onChange={e => setResidenteId(e.target.value)} className={inputCls}><option value="">Selecione...</option>{pacientes.map(p => <option key={p._id} value={p._id}>{p.display_name}</option>)}</select></div>
        <div><label className={labelCls}>Parentesco *</label><select value={parentesco} onChange={e => setParentesco(e.target.value)} className={inputCls}><option value="">Selecione...</option>{PARENTESCO_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition font-medium">Cancelar</button>
          <button onClick={handleSave} disabled={!canSave || saving} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition">{saving ? 'Salvando...' : 'Cadastrar'}</button>
        </div>
      </div>
    </div>
  );
};

// ── Modal: gerenciar vínculos ─────────────────────────────────────────────────

const VinculosModal: React.FC<{ usuario: UsuarioFamiliar; pacientes: Paciente[]; onClose: () => void }> = ({ usuario, pacientes, onClose }) => {
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [residenteId, setResidenteId] = useState('');
  const [parentesco, setParentesco] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try { setVinculos((await S_familiarResidente.getByUsuario(usuario._id)) as any); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function handleAdd() {
    if (!residenteId || !parentesco) return;
    setSaving(true);
    try {
      await S_familiarResidente.createVinculo({ usuario_id: usuario._id, residente_id: residenteId, parentesco });
      notifySuccess('Vínculo adicionado.'); setResidenteId(''); setParentesco(''); load();
    } catch (e: unknown) { notifyError(e instanceof Error ? e.message : 'Erro.'); }
    finally { setSaving(false); }
  }

  const ic = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-white';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div><h2 className="text-base font-bold text-gray-900">Vínculos de {usuario.nome}</h2><p className="text-xs text-gray-400">@{usuario.usuario}</p></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><FaTimes size={14} /></button>
        </div>
        {loading ? <p className="text-sm text-gray-400 text-center py-4">Carregando...</p>
          : vinculos.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">Nenhum vínculo cadastrado.</p>
          : <ul className="space-y-2">{vinculos.map(v => {
              const pac = pacientes.find(p => p._id === v.residente_id);
              return (
                <li key={v._id} className={`flex items-center gap-3 p-3 rounded-xl border ${v.ativo ? 'border-gray-200' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{pac?.display_name || v.residente_id}</p>
                    <p className="text-xs text-gray-400">{v.parentesco}</p>
                  </div>
                  <button onClick={async () => { await S_familiarResidente.toggleAtivo(v._id); setVinculos(prev => prev.map(x => x._id === v._id ? { ...x, ativo: !x.ativo } : x)); }} className="p-1.5 text-gray-400 hover:text-indigo-500">
                    {v.ativo ? <FaLink size={12} /> : <FaUnlink size={12} />}
                  </button>
                  <button onClick={async () => { if (!confirm('Remover?')) return; await S_familiarResidente.removeVinculo(v._id); setVinculos(prev => prev.filter(x => x._id !== v._id)); notifySuccess('Removido.'); }} className="p-1.5 text-gray-400 hover:text-red-500">
                    <FaTrash size={12} />
                  </button>
                </li>
              );
            })}</ul>}
        <div className="border-t border-gray-100 pt-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Adicionar vínculo</p>
          <div className="flex gap-2">
            <select value={residenteId} onChange={e => setResidenteId(e.target.value)} className={ic + ' flex-1'}><option value="">Residente...</option>{pacientes.map(p => <option key={p._id} value={p._id}>{p.display_name}</option>)}</select>
            <select value={parentesco} onChange={e => setParentesco(e.target.value)} className={ic + ' flex-1'}><option value="">Parentesco...</option>{PARENTESCO_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}</select>
          </div>
          <button onClick={handleAdd} disabled={!residenteId || !parentesco || saving} className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition">{saving ? 'Adicionando...' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  );
};

// ── Tab: Familiares ───────────────────────────────────────────────────────────

const TabFamiliares: React.FC<{ pacientes: Paciente[] }> = ({ pacientes }) => {
  const [usuarios, setUsuarios] = useState<UsuarioFamiliar[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalCriar, setModalCriar] = useState(false);
  const [modalVinculos, setModalVinculos] = useState<UsuarioFamiliar | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await fetch('/api/Controller/Usuario?type=getByFuncao&funcao=familiar').then(r => r.ok ? r.json() : []);
      setUsuarios(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setModalCriar(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
          <FaPlus size={12} /> Novo familiar
        </button>
      </div>

      <div className="bg-rose-50 border border-rose-200 rounded-2xl px-5 py-4 text-sm text-rose-700 mb-4">
        <strong>Como funciona:</strong> Cadastre o familiar como usuário e vincule-o ao(s) residente(s). O familiar acessa em <strong>/familia</strong> com usuário e senha.
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-gray-400">Carregando...</div>
      ) : usuarios.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <FaUsers size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Nenhum familiar cadastrado.</p>
          <button onClick={() => setModalCriar(true)} className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors">Cadastrar primeiro familiar</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {usuarios.map(u => (
              <li key={u._id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 shrink-0 text-lg font-bold">{u.nome.charAt(0).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{u.nome}{u.sobrenome ? ` ${u.sobrenome}` : ''}</p>
                  <p className="text-xs text-gray-400">@{u.usuario}{u.email ? ` · ${u.email}` : ''}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.ativo === 'S' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{u.ativo === 'S' ? 'Ativo' : 'Inativo'}</span>
                  <button onClick={() => setModalVinculos(u)} title="Gerenciar vínculos" className="p-2 text-gray-400 hover:text-indigo-500 transition-colors"><FaLink size={13} /></button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {modalCriar && <CriarUsuarioModal pacientes={pacientes} onClose={() => setModalCriar(false)} onSaved={() => { setModalCriar(false); load(); }} />}
      {modalVinculos && <VinculosModal usuario={modalVinculos} pacientes={pacientes} onClose={() => setModalVinculos(null)} />}
    </>
  );
};

// ── Tab: Mensagens ────────────────────────────────────────────────────────────

const TabMensagens: React.FC = () => {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandida, setExpandida] = useState<string | null>(null);
  const [resposta, setResposta] = useState('');
  const [sending, setSending] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('');

  async function load() {
    setLoading(true);
    try {
      const url = `/api/Controller/C_mensagensFamilia?type=getAll${filtroStatus ? `&status=${filtroStatus}` : ''}`;
      const data = await fetch(url).then(r => r.ok ? r.json() : []);
      setMensagens(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [filtroStatus]);

  async function handleMarcarLida(id: string) {
    await fetch(`/api/Controller/C_mensagensFamilia?type=marcarLida&id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    setMensagens(prev => prev.map(m => m._id === id ? { ...m, status: 'lida', lida_admin: true } : m));
  }

  async function handleResponder(id: string) {
    if (!resposta.trim()) return;
    setSending(true);
    try {
      await fetch(`/api/Controller/C_mensagensFamilia?type=responder&id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resposta }),
      });
      notifySuccess('Resposta enviada!');
      setResposta(''); setExpandida(null); load();
    } catch { notifyError('Erro ao responder.'); }
    finally { setSending(false); }
  }

  const statusBadge = (s: string) => {
    if (s === 'nova')       return <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold">Nova</span>;
    if (s === 'lida')       return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-semibold">Lida</span>;
    if (s === 'respondida') return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">Respondida</span>;
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(['', 'nova', 'lida', 'respondida'] as const).map(s => (
          <button key={s} onClick={() => setFiltroStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filtroStatus === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s === '' ? 'Todas' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-8 text-sm text-gray-400">Carregando...</div>
        : mensagens.length === 0 ? <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-sm text-gray-400"><FaEnvelope size={28} className="mx-auto mb-3 text-gray-200" />Nenhuma mensagem{filtroStatus ? ` com status "${filtroStatus}"` : ''}.</div>
        : (
        <div className="space-y-3">
          {mensagens.map(m => (
            <div key={m._id} className={`bg-white rounded-2xl border p-4 space-y-2 ${m.status === 'nova' ? 'border-rose-300' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{m.assunto}</p>
                  <p className="text-xs text-gray-400">{m.nomeUsuario} · {m.nomeResidente} · {new Date(m.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {statusBadge(m.status)}
                  {!m.lida_admin && (
                    <button onClick={() => handleMarcarLida(m._id)} title="Marcar como lida" className="p-1.5 text-gray-400 hover:text-green-600">
                      <FaCheck size={11} />
                    </button>
                  )}
                  <button onClick={() => { setExpandida(expandida === m._id ? null : m._id); setResposta(''); }} className="p-1.5 text-gray-400 hover:text-indigo-500">
                    <FaReply size={11} />
                  </button>
                </div>
              </div>

              {expandida === m._id && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{m.texto}</p>
                  {m.resposta && (
                    <div className="bg-green-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-green-700 mb-1">Resposta da equipe:</p>
                      <p className="text-sm text-green-800 whitespace-pre-wrap">{m.resposta}</p>
                    </div>
                  )}
                  {m.status !== 'respondida' && (
                    <div className="space-y-2">
                      <textarea
                        value={resposta}
                        onChange={e => setResposta(e.target.value)}
                        placeholder="Digite a resposta..."
                        rows={3}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none"
                      />
                      <button onClick={() => handleResponder(m._id)} disabled={!resposta.trim() || sending} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                        {sending ? 'Enviando...' : 'Responder'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Tab: Visitas ──────────────────────────────────────────────────────────────

const TabVisitas: React.FC<{ pacientes: Paciente[] }> = ({ pacientes }) => {
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(true);
  const [residenteId, setResidenteId] = useState('');
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const url = `/api/Controller/C_agendaVisitas?type=getAll${residenteId ? `&residente_id=${residenteId}` : ''}`;
      const data = await fetch(url).then(r => r.ok ? r.json() : []);
      setVisitas(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [residenteId]);

  async function handleCreate() {
    if (!residenteId || !data) return;
    setSaving(true);
    try {
      await fetch('/api/Controller/C_agendaVisitas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ residente_id: residenteId, data, horario, descricao }),
      });
      notifySuccess('Visita criada!');
      setData(''); setHorario(''); setDescricao('');
      load();
    } catch { notifyError('Erro ao criar visita.'); }
    finally { setSaving(false); }
  }

  async function handleConfirmar(v: Visita) {
    await fetch(`/api/Controller/C_agendaVisitas?type=confirmar&id=${v._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    setVisitas(prev => prev.map(x => x._id === v._id ? { ...x, confirmada: !x.confirmada } : x));
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover visita?')) return;
    await fetch(`/api/Controller/C_agendaVisitas?id=${id}`, { method: 'DELETE' });
    setVisitas(prev => prev.filter(x => x._id !== id));
    notifySuccess('Visita removida.');
  }

  const ic = 'border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-white';

  return (
    <div className="space-y-5">
      {/* Form criar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
        <p className="text-sm font-semibold text-gray-700">Nova visita</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={labelCls}>Residente</label>
            <select value={residenteId} onChange={e => setResidenteId(e.target.value)} className={ic + ' w-full'}>
              <option value="">Todos / Selecione...</option>
              {pacientes.map(p => <option key={p._id} value={p._id}>{p.display_name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Data *</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)} className={ic + ' w-full'} />
          </div>
          <div>
            <label className={labelCls}>Horário</label>
            <input type="time" value={horario} onChange={e => setHorario(e.target.value)} className={ic + ' w-full'} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Descrição</label>
            <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Visita de domingo" className={ic + ' w-full'} />
          </div>
        </div>
        <button onClick={handleCreate} disabled={!residenteId || !data || saving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {saving ? 'Salvando...' : 'Criar visita'}
        </button>
      </div>

      {/* Lista */}
      {loading ? <div className="text-center py-8 text-sm text-gray-400">Carregando...</div>
        : visitas.length === 0 ? <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-sm text-gray-400"><FaCalendarAlt size={28} className="mx-auto mb-3 text-gray-200" />Nenhuma visita cadastrada.</div>
        : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {visitas.map(v => (
              <li key={v._id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">
                    {new Date(v.data + 'T12:00:00').toLocaleDateString('pt-BR')} {v.horario && `· ${v.horario}`}
                  </p>
                  <p className="text-xs text-gray-400">{v.nomeResidente}{v.descricao ? ` · ${v.descricao}` : ''}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleConfirmar(v)} className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors ${v.confirmada ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {v.confirmada ? 'Confirmada' : 'Confirmar'}
                  </button>
                  <button onClick={() => handleDelete(v._id)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
                    <FaTrash size={12} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ── Tab: Boletins ─────────────────────────────────────────────────────────────

const TabBoletins: React.FC<{ pacientes: Paciente[] }> = ({ pacientes }) => {
  const [boletins, setBoletins] = useState<Boletim[]>([]);
  const [loading, setLoading] = useState(true);
  const [residenteId, setResidenteId] = useState('');
  const [form, setForm] = useState({ titulo: '', conteudo: '', periodo: '', tipo: 'mensal' });
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState<Boletim | null>(null);

  async function load() {
    setLoading(true);
    try {
      const url = `/api/Controller/C_boletinsFamilia?type=getAll${residenteId ? `&residente_id=${residenteId}` : ''}`;
      const data = await fetch(url).then(r => r.ok ? r.json() : []);
      setBoletins(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [residenteId]);

  async function handleCreate() {
    if (!residenteId || !form.titulo.trim() || !form.conteudo.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/Controller/C_boletinsFamilia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ residente_id: residenteId, ...form }),
      });
      notifySuccess('Boletim criado como rascunho!');
      setForm({ titulo: '', conteudo: '', periodo: '', tipo: 'mensal' });
      load();
    } catch { notifyError('Erro ao criar boletim.'); }
    finally { setSaving(false); }
  }

  async function handlePublicar(b: Boletim) {
    const r = await fetch(`/api/Controller/C_boletinsFamilia?type=publicar&id=${b._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const json = await r.json();
    setBoletins(prev => prev.map(x => x._id === b._id ? { ...x, publicado: json.publicado } : x));
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir boletim?')) return;
    await fetch(`/api/Controller/C_boletinsFamilia?id=${id}`, { method: 'DELETE' });
    setBoletins(prev => prev.filter(x => x._id !== id));
    notifySuccess('Boletim excluído.');
  }

  async function handleSaveEdit() {
    if (!editando) return;
    setSaving(true);
    try {
      await fetch(`/api/Controller/C_boletinsFamilia?type=editar&id=${editando._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: editando.titulo, conteudo: editando.conteudo, periodo: editando.periodo }),
      });
      notifySuccess('Boletim atualizado!');
      setEditando(null); load();
    } catch { notifyError('Erro ao salvar.'); }
    finally { setSaving(false); }
  }

  const ic = 'border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-white w-full';

  return (
    <div className="space-y-5">
      {/* Filtro + form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
        <p className="text-sm font-semibold text-gray-700">Novo boletim</p>
        <div>
          <label className={labelCls}>Residente *</label>
          <select value={residenteId} onChange={e => setResidenteId(e.target.value)} className={ic}>
            <option value="">Selecione um residente...</option>
            {pacientes.map(p => <option key={p._id} value={p._id}>{p.display_name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Tipo</label>
            <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className={ic}>
              <option value="mensal">Mensal</option>
              <option value="semanal">Semanal</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Período</label>
            <input value={form.periodo} onChange={e => setForm(f => ({ ...f, periodo: e.target.value }))} placeholder="Ex: Abril 2026" className={ic} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Título *</label>
          <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Boletim de Abril" className={ic} />
        </div>
        <div>
          <label className={labelCls}>Conteúdo *</label>
          <textarea value={form.conteudo} onChange={e => setForm(f => ({ ...f, conteudo: e.target.value }))} placeholder="Escreva o resumo..." rows={5} className={ic + ' resize-none'} />
        </div>
        <button onClick={handleCreate} disabled={!residenteId || !form.titulo.trim() || !form.conteudo.trim() || saving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {saving ? 'Salvando...' : 'Salvar rascunho'}
        </button>
      </div>

      {/* Lista */}
      {loading ? <div className="text-center py-8 text-sm text-gray-400">Carregando...</div>
        : boletins.length === 0 ? <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-sm text-gray-400"><FaNewspaper size={28} className="mx-auto mb-3 text-gray-200" />Nenhum boletim{residenteId ? ' para este residente' : ''}.</div>
        : (
        <div className="space-y-3">
          {boletins.map(b => (
            <div key={b._id} className={`bg-white rounded-2xl border p-4 space-y-2 ${b.publicado ? 'border-green-200' : 'border-gray-200'}`}>
              {editando?._id === b._id ? (
                <div className="space-y-2">
                  <input value={editando.titulo} onChange={e => setEditando(x => x ? { ...x, titulo: e.target.value } : x)} className={ic} />
                  <input value={editando.periodo} onChange={e => setEditando(x => x ? { ...x, periodo: e.target.value } : x)} placeholder="Período" className={ic} />
                  <textarea value={editando.conteudo} onChange={e => setEditando(x => x ? { ...x, conteudo: e.target.value } : x)} rows={5} className={ic + ' resize-none'} />
                  <div className="flex gap-2">
                    <button onClick={handleSaveEdit} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar'}</button>
                    <button onClick={() => setEditando(null)} className="px-4 py-2 border border-gray-300 text-sm rounded-xl text-gray-600 hover:bg-gray-50">Cancelar</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-800">{b.titulo}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${b.tipo === 'mensal' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{b.tipo}</span>
                        {b.periodo && <span className="text-xs text-gray-400">{b.periodo}</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{b.nomeResidente}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handlePublicar(b)} className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors ${b.publicado ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {b.publicado ? 'Publicado' : 'Publicar'}
                      </button>
                      <button onClick={() => setEditando(b)} className="p-1.5 text-gray-400 hover:text-indigo-500 transition-colors"><FaReply size={11} /></button>
                      <button onClick={() => handleDelete(b._id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><FaTrash size={12} /></button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 whitespace-pre-wrap">{b.conteudo}</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Página principal ──────────────────────────────────────────────────────────

type Tab = 'familiares' | 'mensagens' | 'visitas' | 'boletins';

const FamiliaAdminPage = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [tab, setTab] = useState<Tab>('familiares');

  useEffect(() => {
    fetch('/api/Controller/patient.controller?type=getActivePatients')
      .then(r => r.ok ? r.json() : { patients: [] })
      .then(data => {
        const pts: Paciente[] = (data?.patients || data || []).map((p: any) => ({
          _id: String(p._id),
          display_name: p.display_name || p.nome || '(sem nome)',
        }));
        setPacientes(pts.sort((a, b) => a.display_name.localeCompare(b.display_name)));
      })
      .catch(() => {});
  }, []);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'familiares', label: 'Familiares',  icon: <FaUsers size={13} /> },
    { key: 'mensagens',  label: 'Mensagens',   icon: <FaEnvelope size={13} /> },
    { key: 'visitas',    label: 'Visitas',      icon: <FaCalendarAlt size={13} /> },
    { key: 'boletins',   label: 'Boletins',     icon: <FaNewspaper size={13} /> },
  ];

  return (
    <PermissionWrapper href="/portal/administrativo">
      <PortalBase>
        <div className="col-span-full max-w-3xl mx-auto w-full space-y-6 pb-10">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-500 shrink-0">
              <FaUsers size={18} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Portal da Família</h1>
              <p className="text-sm text-gray-500">Gerenciamento de acesso e comunicação</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t.icon} <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          {tab === 'familiares' && <TabFamiliares pacientes={pacientes} />}
          {tab === 'mensagens'  && <TabMensagens />}
          {tab === 'visitas'    && <TabVisitas pacientes={pacientes} />}
          {tab === 'boletins'   && <TabBoletins pacientes={pacientes} />}
        </div>
      </PortalBase>
    </PermissionWrapper>
  );
};

export default FamiliaAdminPage;
