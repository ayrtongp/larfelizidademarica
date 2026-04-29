import React, { useEffect, useMemo, useState } from 'react';
import { FaChevronDown, FaChevronRight, FaLayerGroup, FaSearch, FaSyncAlt, FaUsers } from 'react-icons/fa';

type MembroGrupo = {
  _id: string;
  nome?: string;
  sobrenome?: string;
  usuario?: string;
  ativo?: string;
  funcao?: string;
  registro?: string;
};

type GrupoComMembros = {
  _id: string;
  cod_grupo?: string;
  nome_grupo: string;
  descricao?: string;
  membros: MembroGrupo[];
  totalMembros: number;
};

const ListaGrupos = () => {
  const [grupos, setGrupos] = useState<GrupoComMembros[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [gruposAbertos, setGruposAbertos] = useState<string[]>([]);

  const carregarGrupos = async () => {
    setLoading(true);
    setErro('');

    try {
      const res = await fetch('/api/Controller/Grupos?type=getAllWithMembers');
      const data = await res.json().catch(() => []);

      if (!res.ok) {
        throw new Error(data?.message || 'Erro ao carregar grupos.');
      }

      const lista = Array.isArray(data) ? data : [];
      setGrupos(lista);
      setGruposAbertos((anterior) =>
        anterior.length > 0
          ? anterior.filter((id) => lista.some((grupo) => grupo._id === id))
          : lista.map((grupo) => grupo._id)
      );
    } catch (error) {
      setGrupos([]);
      setErro(error instanceof Error ? error.message : 'Erro ao carregar grupos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarGrupos();
  }, []);

  const gruposFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return grupos;

    return grupos.filter((grupo) => {
      const nomeGrupo = `${grupo.cod_grupo || ''} ${grupo.nome_grupo} ${grupo.descricao || ''}`.toLowerCase();
      const encontrouNoGrupo = nomeGrupo.includes(termo);
      const encontrouNosMembros = grupo.membros.some((membro) => {
        const nomeMembro = `${membro.nome || ''} ${membro.sobrenome || ''} ${membro.usuario || ''} ${membro.funcao || ''} ${membro.registro || ''}`.toLowerCase();
        return nomeMembro.includes(termo);
      });

      return encontrouNoGrupo || encontrouNosMembros;
    });
  }, [grupos, busca]);

  const totais = useMemo(() => {
    const totalGrupos = grupos.length;
    const totalVinculos = grupos.reduce((acc, grupo) => acc + grupo.totalMembros, 0);
    const gruposVazios = grupos.filter((grupo) => grupo.totalMembros === 0).length;
    return { totalGrupos, totalVinculos, gruposVazios };
  }, [grupos]);

  const toggleGrupo = (grupoId: string) => {
    setGruposAbertos((anterior) =>
      anterior.includes(grupoId)
        ? anterior.filter((id) => id !== grupoId)
        : [...anterior, grupoId]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-slate-600">
            Visualize os grupos cadastrados e quem faz parte de cada um.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-[240px]">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar grupo ou membro..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
            />
          </div>

          <button
            type="button"
            onClick={carregarGrupos}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <FaSyncAlt className="text-xs" />
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Grupos</p>
          <p className="mt-2 text-2xl font-bold text-slate-700">{totais.totalGrupos}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Vínculos</p>
          <p className="mt-2 text-2xl font-bold text-slate-700">{totais.totalVinculos}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sem membros</p>
          <p className="mt-2 text-2xl font-bold text-slate-700">{totais.gruposVazios}</p>
        </div>
      </div>

      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          Carregando grupos...
        </div>
      ) : gruposFiltrados.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          Nenhum grupo encontrado para essa busca.
        </div>
      ) : (
        <div className="space-y-3">
          {gruposFiltrados.map((grupo) => {
            const aberto = gruposAbertos.includes(grupo._id);

            return (
              <div key={grupo._id} className="overflow-hidden rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => toggleGrupo(grupo._id)}
                  className="flex w-full items-center justify-between gap-3 bg-white px-4 py-4 text-left transition hover:bg-slate-50"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                      <FaLayerGroup size={14} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-700">{grupo.nome_grupo}</p>
                        {grupo.cod_grupo && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            {grupo.cod_grupo}
                          </span>
                        )}
                      </div>

                      {grupo.descricao && (
                        <p className="mt-1 text-sm text-slate-500">{grupo.descricao}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      <FaUsers size={10} />
                      {grupo.totalMembros}
                    </span>
                    {aberto ? (
                      <FaChevronDown className="text-sm text-slate-400" />
                    ) : (
                      <FaChevronRight className="text-sm text-slate-400" />
                    )}
                  </div>
                </button>

                {aberto && (
                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-4">
                    {grupo.membros.length === 0 ? (
                      <p className="text-sm italic text-slate-400">Nenhum usuário vinculado a este grupo.</p>
                    ) : (
                      <div className="grid gap-2 lg:grid-cols-2">
                        {grupo.membros.map((membro) => (
                          <div
                            key={membro._id}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-700">
                                  {`${membro.nome || ''} ${membro.sobrenome || ''}`.trim() || 'Usuário sem nome'}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-slate-400">
                                  {membro.usuario ? `@${membro.usuario}` : 'Sem login'}
                                  {membro.registro ? ` · ${membro.registro}` : ''}
                                </p>
                                {membro.funcao && (
                                  <p className="mt-1 text-xs text-slate-500">{membro.funcao}</p>
                                )}
                              </div>

                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                  membro.ativo === 'S'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {membro.ativo === 'S' ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ListaGrupos;
