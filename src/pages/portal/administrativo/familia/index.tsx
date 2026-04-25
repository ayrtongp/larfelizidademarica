import React, { useEffect, useState } from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';
import PortalBase from '@/components/Portal/PortalBase';
import { notifyError, notifySuccess } from '@/utils/Functions';
import { FaUsers, FaPlus, FaTrash, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface FamiliaUser {
  _id: string;
  nome: string;
  id_residente: string;
  nome_residente: string;
  ativo: string;
  createdAt: string;
}

interface Paciente {
  _id: string;
  display_name: string;
}

// ── Modal de criação ──────────────────────────────────────────────────────────

interface ModalProps {
  pacientes: Paciente[];
  onClose: () => void;
  onSaved: (u: FamiliaUser) => void;
}

const CreateModal: React.FC<ModalProps> = ({ pacientes, onClose, onSaved }) => {
  const [nome, setNome] = useState('');
  const [pin, setPin] = useState('');
  const [idResidente, setIdResidente] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [saving, setSaving] = useState(false);

  const pinValid = /^\d{6}$/.test(pin);
  const canSave = nome.trim() && pinValid && idResidente;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await fetch('/api/Controller/C_familiaUsuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim(), pin, id_residente: idResidente }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Erro ao criar conta.');
      const pac = pacientes.find(p => p._id === idResidente);
      onSaved({
        _id: String(json.id),
        nome: nome.trim(),
        id_residente: idResidente,
        nome_residente: pac?.display_name || '—',
        ativo: 'S',
        createdAt: new Date().toISOString(),
      });
      notifySuccess('Conta criada com sucesso!');
    } catch (e: unknown) {
      notifyError(e instanceof Error ? e.message : 'Erro ao criar conta.');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-300 transition';
  const labelCls = 'block text-sm font-semibold text-gray-600 mb-1.5';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Nova conta de família</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><FaTimes size={14} /></button>
        </div>

        <div className="space-y-4">
          {/* Nome */}
          <div>
            <label className={labelCls}>Nome da pessoa (ex: &quot;Maria — filha do João&quot;)</label>
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Identificação da pessoa"
              className={inputCls}
              autoFocus
            />
          </div>

          {/* PIN */}
          <div>
            <label className={labelCls}>PIN de acesso (6 dígitos)</label>
            <div className="relative">
              <input
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                placeholder="000000"
                className={inputCls + ' pr-12 tracking-widest text-lg'}
              />
              <button
                type="button"
                onClick={() => setShowPin(v => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPin ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
            {pin.length > 0 && !pinValid && (
              <p className="text-xs text-red-500 mt-1">O PIN deve ter exatamente 6 números.</p>
            )}
          </div>

          {/* Residente */}
          <div>
            <label className={labelCls}>Residente vinculado</label>
            <select
              value={idResidente}
              onChange={e => setIdResidente(e.target.value)}
              className={inputCls + ' bg-white'}
            >
              <option value="">Selecione o residente...</option>
              {pacientes.map(p => (
                <option key={p._id} value={p._id}>{p.display_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Criando...' : 'Criar conta'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Página ────────────────────────────────────────────────────────────────────

const FamiliaAdminPage = () => {
  const [usuarios,  setUsuarios]  = useState<FamiliaUser[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/Controller/C_familiaUsuarios').then(r => r.json()),
      fetch('/api/Controller/patient.controller?type=getActivePatients').then(r => r.ok ? r.json() : { patients: [] }),
    ]).then(([users, patientsRes]) => {
      setUsuarios(users || []);
      const pts: Paciente[] = (patientsRes?.patients || patientsRes || []).map((p: any) => ({
        _id: String(p._id),
        display_name: p.display_name || p.nome || '(sem nome)',
      }));
      setPacientes(pts.sort((a, b) => a.display_name.localeCompare(b.display_name)));
    }).catch(() => notifyError('Erro ao carregar dados.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(u: FamiliaUser) {
    if (!confirm(`Excluir a conta de "${u.nome}"?\n\nEla perderá o acesso imediatamente.`)) return;
    try {
      const res = await fetch(`/api/Controller/C_familiaUsuarios?id=${u._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).message);
      setUsuarios(prev => prev.filter(x => x._id !== u._id));
      notifySuccess('Conta excluída.');
    } catch (e: unknown) {
      notifyError(e instanceof Error ? e.message : 'Erro ao excluir.');
    }
  }

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
                <p className="text-sm text-gray-500">{usuarios.length} {usuarios.length === 1 ? 'conta cadastrada' : 'contas cadastradas'}</p>
              </div>
            </div>
            <button
              onClick={() => setModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <FaPlus size={12} /> Nova conta
            </button>
          </div>

          {/* Aviso */}
          <div className="bg-rose-50 border border-rose-200 rounded-2xl px-5 py-4 text-sm text-rose-700">
            <strong>Como funciona:</strong> Crie uma conta com um PIN de 6 dígitos e informe à família.
            Eles acessam em <strong>seu-dominio.com/familia</strong> e digitam o PIN para entrar.
            Sem nome de usuário, sem senha complexa.
          </div>

          {/* Lista */}
          {loading ? (
            <div className="text-center py-12 text-sm text-gray-400">Carregando...</div>
          ) : usuarios.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <FaUsers size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Nenhuma conta de família cadastrada.</p>
              <button
                onClick={() => setModal(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Criar primeira conta
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
                      <p className="text-sm font-semibold text-gray-800">{u.nome}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Residente: {u.nome_residente}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.ativo === 'S' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.ativo === 'S' ? 'Ativo' : 'Inativo'}
                      </span>
                      <button
                        onClick={() => handleDelete(u)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Excluir conta"
                      >
                        <FaTrash size={13} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {modal && (
          <CreateModal
            pacientes={pacientes}
            onClose={() => setModal(false)}
            onSaved={u => {
              setUsuarios(prev => [u, ...prev]);
              setModal(false);
            }}
          />
        )}
      </PortalBase>
    </PermissionWrapper>
  );
};

export default FamiliaAdminPage;
