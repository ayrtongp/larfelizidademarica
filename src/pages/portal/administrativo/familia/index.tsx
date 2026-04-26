import React, { useEffect, useState } from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';
import PortalBase from '@/components/Portal/PortalBase';
import { notifyError, notifySuccess } from '@/utils/Functions';
import { FaUsers, FaPlus, FaTrash, FaTimes, FaLink, FaUnlink } from 'react-icons/fa';
import { PARENTESCO_OPTIONS } from '@/types/T_familiarResidente';
import S_familiarResidente from '@/services/S_familiarResidente';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface UsuarioFamiliar {
  _id: string;
  nome: string;
  sobrenome?: string;
  usuario: string;
  email?: string;
  ativo: 'S' | 'N';
}

interface Vinculo {
  _id: string;
  usuario_id: string;
  residente_id: string;
  parentesco: string;
  ativo: boolean;
  usuario?: { nome: string; sobrenome?: string; usuario: string };
  residente?: { _id: string; display_name: string };
}

interface Paciente {
  _id: string;
  display_name: string;
}

// ── Modal: criar usuário familiar ─────────────────────────────────────────────

interface CriarUsuarioModalProps {
  pacientes: Paciente[];
  onClose: () => void;
  onSaved: () => void;
}

const CriarUsuarioModal: React.FC<CriarUsuarioModalProps> = ({ pacientes, onClose, onSaved }) => {
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
      // 1. Cria o usuário com funcoes: ['familiar']
      const resUser = await fetch('/api/Controller/Usuario?type=newFamiliar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          sobrenome: sobrenome.trim(),
          usuario: usuarioLogin.trim(),
          email: email.trim() || undefined,
          senha,
          funcoes: ['familiar'],
          ativo: 'S',
          admin: 'N',
        }),
      });
      const jsonUser = await resUser.json();
      if (!resUser.ok) throw new Error(jsonUser.message || 'Erro ao criar usuário.');

      const usuarioId = String(jsonUser.id ?? jsonUser._id ?? jsonUser.insertedId);

      // 2. Cria o vínculo familiar_residente
      await S_familiarResidente.createVinculo({ usuario_id: usuarioId, residente_id: residenteId, parentesco });

      notifySuccess('Familiar cadastrado e vinculado com sucesso!');
      onSaved();
    } catch (e: unknown) {
      notifyError(e instanceof Error ? e.message : 'Erro ao cadastrar.');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition';
  const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Novo acesso de família</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><FaTimes size={14} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nome *</label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="João" className={inputCls} autoFocus />
          </div>
          <div>
            <label className={labelCls}>Sobrenome</label>
            <input value={sobrenome} onChange={e => setSobrenome(e.target.value)} placeholder="Silva" className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Usuário de login *</label>
          <input value={usuarioLogin} onChange={e => setUsuarioLogin(e.target.value.toLowerCase().replace(/\s/g, ''))} placeholder="joao.silva" className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>E-mail</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="joao@email.com" className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Senha * (mín. 6 caracteres)</label>
          <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" className={inputCls} autoComplete="new-password" />
        </div>

        <hr className="border-gray-100" />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vínculo com residente</p>

        <div>
          <label className={labelCls}>Residente *</label>
          <select value={residenteId} onChange={e => setResidenteId(e.target.value)} className={inputCls + ' bg-white'}>
            <option value="">Selecione...</option>
            {pacientes.map(p => <option key={p._id} value={p._id}>{p.display_name}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls}>Parentesco *</label>
          <select value={parentesco} onChange={e => setParentesco(e.target.value)} className={inputCls + ' bg-white'}>
            <option value="">Selecione...</option>
            {PARENTESCO_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition font-medium">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!canSave || saving} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition">
            {saving ? 'Salvando...' : 'Cadastrar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Modal: gerenciar vínculos de um familiar ──────────────────────────────────

interface VinculosModalProps {
  usuario: UsuarioFamiliar;
  pacientes: Paciente[];
  onClose: () => void;
}

const VinculosModal: React.FC<VinculosModalProps> = ({ usuario, pacientes, onClose }) => {
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [residenteId, setResidenteId] = useState('');
  const [parentesco, setParentesco] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadVinculos() {
    setLoading(true);
    try {
      const data = await S_familiarResidente.getByUsuario(usuario._id);
      setVinculos(data as any);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadVinculos(); }, []);

  async function handleAdd() {
    if (!residenteId || !parentesco) return;
    setSaving(true);
    try {
      await S_familiarResidente.createVinculo({ usuario_id: usuario._id, residente_id: residenteId, parentesco });
      notifySuccess('Vínculo adicionado.');
      setResidenteId(''); setParentesco('');
      loadVinculos();
    } catch (e: unknown) {
      notifyError(e instanceof Error ? e.message : 'Erro ao adicionar vínculo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(v: Vinculo) {
    try {
      await S_familiarResidente.toggleAtivo(v._id);
      setVinculos(prev => prev.map(x => x._id === v._id ? { ...x, ativo: !x.ativo } : x));
    } catch {
      notifyError('Erro ao atualizar vínculo.');
    }
  }

  async function handleRemove(v: Vinculo) {
    if (!confirm('Remover este vínculo permanentemente?')) return;
    try {
      await S_familiarResidente.removeVinculo(v._id);
      setVinculos(prev => prev.filter(x => x._id !== v._id));
      notifySuccess('Vínculo removido.');
    } catch {
      notifyError('Erro ao remover vínculo.');
    }
  }

  const inputCls = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Vínculos de {usuario.nome}</h2>
            <p className="text-xs text-gray-400">@{usuario.usuario}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><FaTimes size={14} /></button>
        </div>

        {/* Lista de vínculos */}
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-4">Carregando...</p>
        ) : vinculos.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhum vínculo cadastrado.</p>
        ) : (
          <ul className="space-y-2">
            {vinculos.map(v => {
              const pac = pacientes.find(p => p._id === v.residente_id);
              return (
                <li key={v._id} className={`flex items-center gap-3 p-3 rounded-xl border ${v.ativo ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{pac?.display_name || v.residente_id}</p>
                    <p className="text-xs text-gray-400">{v.parentesco}</p>
                  </div>
                  <button onClick={() => handleToggle(v)} title={v.ativo ? 'Desativar' : 'Ativar'} className="p-1.5 text-gray-400 hover:text-indigo-500">
                    {v.ativo ? <FaLink size={12} /> : <FaUnlink size={12} />}
                  </button>
                  <button onClick={() => handleRemove(v)} title="Remover" className="p-1.5 text-gray-400 hover:text-red-500">
                    <FaTrash size={12} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Adicionar novo vínculo */}
        <div className="border-t border-gray-100 pt-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Adicionar vínculo</p>
          <div className="flex gap-2">
            <select value={residenteId} onChange={e => setResidenteId(e.target.value)} className={inputCls + ' flex-1'}>
              <option value="">Residente...</option>
              {pacientes.map(p => <option key={p._id} value={p._id}>{p.display_name}</option>)}
            </select>
            <select value={parentesco} onChange={e => setParentesco(e.target.value)} className={inputCls + ' flex-1'}>
              <option value="">Parentesco...</option>
              {PARENTESCO_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={!residenteId || !parentesco || saving}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {saving ? 'Adicionando...' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Página ────────────────────────────────────────────────────────────────────

const FamiliaAdminPage = () => {
  const [usuarios, setUsuarios] = useState<UsuarioFamiliar[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalCriar, setModalCriar] = useState(false);
  const [modalVinculos, setModalVinculos] = useState<UsuarioFamiliar | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [usersRes, patientsRes] = await Promise.all([
        fetch('/api/Controller/Usuario?type=getByFuncao&funcao=familiar').then(r => r.ok ? r.json() : []),
        fetch('/api/Controller/patient.controller?type=getActivePatients').then(r => r.ok ? r.json() : { patients: [] }),
      ]);
      setUsuarios(Array.isArray(usersRes) ? usersRes : []);
      const pts: Paciente[] = (patientsRes?.patients || patientsRes || []).map((p: any) => ({
        _id: String(p._id),
        display_name: p.display_name || p.nome || '(sem nome)',
      }));
      setPacientes(pts.sort((a, b) => a.display_name.localeCompare(b.display_name)));
    } catch {
      notifyError('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  return (
    <PermissionWrapper href="/portal/administrativo">
      <PortalBase>
        <div className="col-span-full max-w-3xl mx-auto w-full space-y-6 pb-10">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                <FaUsers size={18} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Acessos de Família</h1>
                <p className="text-sm text-gray-500">{usuarios.length} {usuarios.length === 1 ? 'familiar cadastrado' : 'familiares cadastrados'}</p>
              </div>
            </div>
            <button
              onClick={() => setModalCriar(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <FaPlus size={12} /> Novo familiar
            </button>
          </div>

          {/* Info */}
          <div className="bg-rose-50 border border-rose-200 rounded-2xl px-5 py-4 text-sm text-rose-700">
            <strong>Como funciona:</strong> Cadastre o familiar como usuário e vincule-o ao(s) residente(s) que ele pode acompanhar.
            O familiar acessa em <strong>/familia</strong> com usuário e senha.
          </div>

          {/* Lista */}
          {loading ? (
            <div className="text-center py-12 text-sm text-gray-400">Carregando...</div>
          ) : usuarios.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <FaUsers size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Nenhum familiar cadastrado.</p>
              <button onClick={() => setModalCriar(true)} className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors">
                Cadastrar primeiro familiar
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <ul className="divide-y divide-gray-100">
                {usuarios.map(u => (
                  <li key={u._id} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 shrink-0 text-lg font-bold">
                      {u.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{u.nome}{u.sobrenome ? ` ${u.sobrenome}` : ''}</p>
                      <p className="text-xs text-gray-400">@{u.usuario}{u.email ? ` · ${u.email}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.ativo === 'S' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.ativo === 'S' ? 'Ativo' : 'Inativo'}
                      </span>
                      <button
                        onClick={() => setModalVinculos(u)}
                        title="Gerenciar vínculos"
                        className="p-2 text-gray-400 hover:text-indigo-500 transition-colors"
                      >
                        <FaLink size={13} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {modalCriar && (
          <CriarUsuarioModal
            pacientes={pacientes}
            onClose={() => setModalCriar(false)}
            onSaved={() => { setModalCriar(false); loadData(); }}
          />
        )}

        {modalVinculos && (
          <VinculosModal
            usuario={modalVinculos}
            pacientes={pacientes}
            onClose={() => setModalVinculos(null)}
          />
        )}
      </PortalBase>
    </PermissionWrapper>
  );
};

export default FamiliaAdminPage;
