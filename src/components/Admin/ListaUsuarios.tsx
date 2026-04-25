import Image from 'next/image';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ImagemPadrao from '../../../public/images/lar felizidade logo transparente.png';
import { notifyError, notifySuccess } from '@/utils/Functions';
import GruposUsuario_getGruposUsuario from '@/actions/GruposUsuario_getGruposUsuario';
import Grupos_getAll from '@/actions/Grupos_getAll';
import { FaTimes, FaTag, FaPlus, FaUsersCog } from 'react-icons/fa';

// ---- Types ----

type ListaData = {
  _id: string;
  admin: string;
  ativo: string;
  email: string;
  foto_base64: string;
  funcao: string;
  funcoes?: string[];
  nome: string;
  registro: string;
  sobrenome: string;
  usuario: string;
};

interface GrupoUsuario {
  _id: string;
  id_grupo: string;
  id_usuario: string;
  nome_grupo: string;
  cod_grupo?: string;
}

interface Grupo {
  _id: string;
  nome_grupo: string;
  cod_grupo?: string;
}

// ---- Modal de grupos ----

const ModalGruposUsuario = ({
  user,
  allGrupos,
  onClose,
  onFuncoesChange,
}: {
  user: ListaData;
  allGrupos: Grupo[];
  onFuncoesChange?: (userId: string, funcoes: string[]) => void;
  onClose: () => void;
}) => {
  const [gruposDoUsuario, setGruposDoUsuario] = useState<GrupoUsuario[]>([]);
  const [loadingGrupos, setLoadingGrupos] = useState(true);
  const [selectedGrupoId, setSelectedGrupoId] = useState('');
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Funções (áreas de atuação)
  const [funcoes, setFuncoes] = useState<string[]>(
    Array.isArray(user.funcoes) && user.funcoes.length > 0
      ? user.funcoes
      : user.funcao ? [user.funcao] : []
  );
  const [novaFuncao, setNovaFuncao] = useState('');
  const [savingFuncao, setSavingFuncao] = useState(false);

  async function saveFuncoes(next: string[]) {
    setSavingFuncao(true);
    try {
      const res = await fetch(`/api/Controller/Usuario?tipo=alteraDados&id=${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funcoes: next, funcao: next[0] ?? '' }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Erro');
      setFuncoes(next);
      onFuncoesChange?.(user._id, next);
      notifySuccess('Áreas de atuação atualizadas!');
    } catch {
      notifyError('Erro ao salvar funções.');
    } finally {
      setSavingFuncao(false);
    }
  }

  function handleAddFuncao() {
    const val = novaFuncao.trim();
    if (!val || funcoes.includes(val)) return;
    const next = [...funcoes, val];
    setNovaFuncao('');
    saveFuncoes(next);
  }

  function handleRemoveFuncao(f: string) {
    saveFuncoes(funcoes.filter(x => x !== f));
  }

  const fetchGruposDoUsuario = async () => {
    setLoadingGrupos(true);
    const result = await GruposUsuario_getGruposUsuario(user._id);
    setGruposDoUsuario(Array.isArray(result) ? result : []);
    setLoadingGrupos(false);
  };

  useEffect(() => {
    fetchGruposDoUsuario();

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [user._id]);

  const handleAdd = async () => {
    if (!selectedGrupoId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/Controller/GruposUsuario?type=new', {
        method: 'POST',
        body: JSON.stringify({ id_usuario: user._id, id_grupo: selectedGrupoId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        notifySuccess('Grupo vinculado com sucesso!');
        setSelectedGrupoId('');
        await fetchGruposDoUsuario();
      } else {
        notifyError(data.message || 'Erro ao vincular grupo.');
      }
    } catch {
      notifyError('Erro inesperado.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (grupoUsuario: GrupoUsuario) => {
    setRemovingId(grupoUsuario._id);
    try {
      const res = await fetch(`/api/Controller/GruposUsuario?id=${grupoUsuario._id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        notifySuccess(`Grupo "${grupoUsuario.nome_grupo}" removido.`);
        setGruposDoUsuario(prev => prev.filter(g => g._id !== grupoUsuario._id));
      } else {
        notifyError('Erro ao remover grupo.');
      }
    } catch {
      notifyError('Erro inesperado.');
    } finally {
      setRemovingId(null);
    }
  };

  // Mostra só grupos ainda não vinculados ao usuário
  const gruposDisponiveis = allGrupos.filter(
    g => !gruposDoUsuario.some(gu => gu.id_grupo === String(g._id))
  );

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={e => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          <div className="relative flex-shrink-0">
            <Image
              src={user.foto_base64 || ImagemPadrao}
              width={48} height={48}
              alt={user.nome}
              className="rounded-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 truncate">{user.nome} {user.sobrenome}</p>
            <p className="text-xs text-gray-400 truncate">@{user.usuario} · {user.funcao || '—'}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition flex-shrink-0"
            aria-label="Fechar"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-5">

          {/* Grupos ativos */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FaUsersCog size={12} className="text-gray-400" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Grupos de permissão
              </p>
              {loadingGrupos && (
                <span className="text-xs text-gray-400">carregando...</span>
              )}
            </div>

            {!loadingGrupos && gruposDoUsuario.length === 0 && (
              <p className="text-sm text-gray-400 italic">Nenhum grupo vinculado.</p>
            )}

            <div className="flex flex-wrap gap-2">
              {gruposDoUsuario.map(g => (
                <span
                  key={g._id}
                  className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-2.5 py-1 rounded-full"
                >
                  <FaTag size={9} className="text-indigo-400" />
                  <span className="font-medium">{g.nome_grupo}</span>
                  {g.cod_grupo && <span className="text-indigo-400">({g.cod_grupo})</span>}
                  <button
                    onClick={() => handleRemove(g)}
                    disabled={removingId === g._id}
                    className="ml-0.5 text-indigo-300 hover:text-red-500 transition disabled:opacity-40"
                    title="Remover grupo"
                  >
                    {removingId === g._id ? '…' : <FaTimes size={9} />}
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Áreas de Atuação */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Áreas de Atuação
              </p>
              {savingFuncao && <span className="text-xs text-gray-400">salvando...</span>}
            </div>

            {funcoes.length === 0 && (
              <p className="text-sm text-gray-400 italic mb-2">Nenhuma área cadastrada.</p>
            )}

            <div className="flex flex-wrap gap-2 mb-3">
              {funcoes.map((f, i) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 text-xs px-2.5 py-1 rounded-full"
                >
                  {i === 0 && <span className="text-rose-400 font-bold text-[10px]">●</span>}
                  <span className="font-medium">{f}</span>
                  <button
                    onClick={() => handleRemoveFuncao(f)}
                    disabled={savingFuncao}
                    className="ml-0.5 text-rose-300 hover:text-red-500 transition disabled:opacity-40"
                    title="Remover"
                  >
                    <FaTimes size={9} />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={novaFuncao}
                onChange={e => setNovaFuncao(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddFuncao(); } }}
                placeholder="Nova área (ex: Fisioterapeuta)"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-rose-400"
              />
              <button
                onClick={handleAddFuncao}
                disabled={!novaFuncao.trim() || savingFuncao}
                className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors whitespace-nowrap"
              >
                <FaPlus size={10} />
                Add
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">
              A primeira área (●) é a principal — usada quando o usuário tiver só uma.
            </p>
          </div>

          {/* Adicionar grupo */}
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Adicionar grupo
            </p>
            {gruposDisponiveis.length === 0 && !loadingGrupos ? (
              <p className="text-sm text-gray-400 italic">
                Todos os grupos já estão vinculados.
              </p>
            ) : (
              <div className="flex gap-2">
                <select
                  value={selectedGrupoId}
                  onChange={e => setSelectedGrupoId(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                >
                  <option value="">Selecione um grupo...</option>
                  {gruposDisponiveis.map(g => (
                    <option key={String(g._id)} value={String(g._id)}>
                      {g.cod_grupo ? `${g.cod_grupo} — ` : ''}{g.nome_grupo}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAdd}
                  disabled={!selectedGrupoId || saving}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors whitespace-nowrap"
                >
                  <FaPlus size={10} />
                  {saving ? 'Salvando...' : 'Adicionar'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- Componente principal ----

const ListaUsuarios = () => {
  const [listaUsuarios, setListaUsuarios] = useState<ListaData[]>([]);
  const [allGrupos, setAllGrupos] = useState<Grupo[]>([]);
  const [busca, setBusca] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<ListaData | null>(null);

  async function getListaUsuarios() {
    const res = await fetch('/api/Controller/Usuario');
    if (res.ok) {
      const data = await res.json();
      setListaUsuarios(data.usuarios);
    }
  }

  useEffect(() => {
    getListaUsuarios();
    Grupos_getAll().then((data: any) => setAllGrupos(Array.isArray(data) ? data : []));
  }, []);

  async function toggleAtivo(user: ListaData) {
    const novoAtivo = user.ativo === 'S' ? 'N' : 'S';
    const acao = novoAtivo === 'S' ? 'ativar' : 'desativar';
    if (!confirm(`Deseja ${acao} o usuário "${user.usuario}"?`)) return;

    setToggling(user._id);
    try {
      const res = await fetch(
        `/api/admin/toggle-usuario-ativo?id=${user._id}&ativo=${novoAtivo}`,
        { method: 'PUT' },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { notifyError(data.message || `Erro ${res.status}`); return; }
      setListaUsuarios(prev =>
        prev.map(u => u._id === user._id ? { ...u, ativo: novoAtivo } : u)
      );
      notifySuccess(`Usuário ${novoAtivo === 'S' ? 'ativado' : 'desativado'} com sucesso.`);
    } catch (err: any) {
      notifyError(err?.message || 'Erro ao alterar status do usuário.');
    } finally {
      setToggling(null);
    }
  }

  const filtrados = useMemo(() => {
    const lista = !busca.trim()
      ? listaUsuarios
      : listaUsuarios.filter(u =>
          `${u.nome} ${u.sobrenome}`.toLowerCase().includes(busca.toLowerCase()) ||
          u.usuario?.toLowerCase().includes(busca.toLowerCase()) ||
          u.email?.toLowerCase().includes(busca.toLowerCase()) ||
          u.funcao?.toLowerCase().includes(busca.toLowerCase())
        );

    return [...lista].sort((a, b) => {
      if (a.admin !== b.admin) return a.admin === 'S' ? -1 : 1;
      if (a.ativo !== b.ativo) return a.ativo === 'S' ? -1 : 1;
      const nomeA = `${a.nome} ${a.sobrenome}`.toLowerCase();
      const nomeB = `${b.nome} ${b.sobrenome}`.toLowerCase();
      if (nomeA !== nomeB) return nomeA.localeCompare(nomeB, 'pt-BR');
      return (a.funcao ?? '').localeCompare(b.funcao ?? '', 'pt-BR');
    });
  }, [listaUsuarios, busca]);

  return (
    <>
      {/* Modal */}
      {selectedUser && (
        <ModalGruposUsuario
          user={selectedUser}
          allGrupos={allGrupos}
          onClose={() => setSelectedUser(null)}
          onFuncoesChange={(userId, funcoes) =>
            setListaUsuarios(prev =>
              prev.map(u => u._id === userId ? { ...u, funcoes } : u)
            )
          }
        />
      )}

      <div className='space-y-3'>
        <div className='flex items-center justify-between gap-3 flex-wrap'>
          <p className='text-sm text-gray-500'>
            {filtrados.length} usuário(s)
            <span className='ml-2 text-xs text-gray-400'>· clique em um usuário para gerenciar grupos</span>
          </p>
          <input
            type='text'
            placeholder='Buscar por nome, usuário, função...'
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className='border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 w-full sm:w-64'
          />
        </div>

        {/* Mobile: cards */}
        <div className='flex flex-col gap-3 sm:hidden'>
          {filtrados.length === 0 && (
            <p className='text-center py-8 text-gray-400 text-sm'>Nenhum usuário encontrado.</p>
          )}
          {filtrados.map(u => (
            <div
              key={u._id}
              onClick={() => setSelectedUser(u)}
              className='bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3 shadow-sm cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors'
            >
              <Image
                className='rounded-full object-cover flex-shrink-0'
                width={44} height={44}
                src={u.foto_base64 || ImagemPadrao}
                alt={u.nome}
              />
              <div className='flex-1 min-w-0'>
                <p className='font-semibold text-gray-800 text-sm truncate'>{u.nome} {u.sobrenome}</p>
                <p className='text-xs text-gray-400 truncate'>@{u.usuario} · {u.funcao || '—'}</p>
                <p className='text-xs text-gray-400 truncate'>{u.email || '—'}</p>
                <div className='flex items-center gap-2 mt-1.5 flex-wrap' onClick={e => e.stopPropagation()}>
                  {u.admin === 'S' && (
                    <span className='px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700'>Admin</span>
                  )}
                  <ToggleAtivoButton user={u} loading={toggling === u._id} onToggle={toggleAtivo} />
                </div>
              </div>
              <FaUsersCog size={14} className='text-gray-300 flex-shrink-0' />
            </div>
          ))}
        </div>

        {/* Desktop: tabela */}
        <div className='hidden sm:block overflow-x-auto rounded-lg border border-gray-200'>
          <table className='w-full text-sm text-left'>
            <thead className='bg-gray-50 text-gray-500 text-xs uppercase'>
              <tr>
                <th className='px-3 py-3'>Usuário</th>
                <th className='px-3 py-3'>Nome</th>
                <th className='px-3 py-3'>E-mail</th>
                <th className='px-3 py-3'>Função</th>
                <th className='px-3 py-3'>Registro</th>
                <th className='px-3 py-3'>Admin</th>
                <th className='px-3 py-3'>Status</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={7} className='text-center py-10 text-gray-400 text-sm'>
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
              {filtrados.map((linha) => (
                <tr
                  key={linha._id}
                  onClick={() => setSelectedUser(linha)}
                  className={`cursor-pointer transition-colors
                    ${linha.ativo !== 'S' ? 'bg-red-50 opacity-70' : 'hover:bg-indigo-50/40'}
                  `}
                >
                  <td className='px-3 py-2.5 whitespace-nowrap'>
                    <div className='flex items-center gap-2'>
                      <Image
                        className='rounded-full object-cover flex-shrink-0'
                        width={32} height={32}
                        src={linha.foto_base64 || ImagemPadrao}
                        alt={linha.nome}
                      />
                      <span className='font-medium text-gray-800'>{linha.usuario}</span>
                    </div>
                  </td>
                  <td className='px-3 py-2.5 whitespace-nowrap text-gray-700'>
                    {linha.nome} {linha.sobrenome}
                  </td>
                  <td className='px-3 py-2.5 whitespace-nowrap text-gray-500 text-xs'>{linha.email}</td>
                  <td className='px-3 py-2.5 whitespace-nowrap text-gray-600'>{linha.funcao}</td>
                  <td className='px-3 py-2.5 whitespace-nowrap text-gray-500 text-xs'>{linha.registro}</td>
                  <td className='px-3 py-2.5'>
                    {linha.admin === 'S' && (
                      <span className='inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700'>
                        Sim
                      </span>
                    )}
                  </td>
                  <td className='px-3 py-2.5' onClick={e => e.stopPropagation()}>
                    <ToggleAtivoButton user={linha} loading={toggling === linha._id} onToggle={toggleAtivo} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

// ---- Toggle Ativo Button ----

const ToggleAtivoButton = ({
  user,
  loading,
  onToggle,
}: {
  user: ListaData;
  loading: boolean;
  onToggle: (u: ListaData) => void;
}) => {
  const isAtivo = user.ativo === 'S';
  return (
    <button
      onClick={() => onToggle(user)}
      disabled={loading}
      title={isAtivo ? 'Clique para desativar' : 'Clique para ativar'}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all
        ${isAtivo
          ? 'bg-green-100 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
          : 'bg-red-100 text-red-600 border-red-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
        }
        ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isAtivo ? 'bg-green-500' : 'bg-red-500'}`} />
      {loading ? '...' : isAtivo ? 'Ativo' : 'Inativo'}
    </button>
  );
};

export default ListaUsuarios;
