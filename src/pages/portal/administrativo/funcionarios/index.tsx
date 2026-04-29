import React, { useEffect, useMemo, useState } from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';
import PortalBase from '@/components/Portal/PortalBase';
import { useHasGroup } from '@/hooks/useHasGroup';
import { T_FuncionarioCLTComUsuario } from '@/types/T_funcionariosCLT';
import S_funcionariosCLT from '@/services/S_funcionariosCLT';
import FuncionarioTable from '@/components/funcionarios/FuncionarioTable';
import FuncionarioLinkModal from '@/components/funcionarios/FuncionarioLinkModal';
import Button_M3 from '@/components/Formularios/Button_M3';
import { useRouter } from 'next/router';

const STATUS_FILTROS = [
  { value: '', label: 'Todos' },
  { value: 'ativo', label: 'Ativos' },
  { value: 'demitido', label: 'Demitidos' },
  { value: 'afastado', label: 'Afastados' },
  { value: 'ferias', label: 'Férias' },
];

const FuncionariosPage = () => {
  const { hasGroup, loading: loadingPermission } = useHasGroup('rh');
  const router = useRouter();

  const [funcionarios, setFuncionarios] = useState<T_FuncionarioCLTComUsuario[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroSetor, setFiltroSetor] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');

  const loadFuncionarios = async () => {
    try {
      setLoadingData(true);
      const data = await S_funcionariosCLT.getAll();
      setFuncionarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (hasGroup) loadFuncionarios();
  }, [hasGroup]);

  const setoresDisponiveis = useMemo(() => {
    const set = new Set(funcionarios.map((f) => f.contrato?.setor).filter(Boolean));
    return Array.from(set).sort();
  }, [funcionarios]);

  const funcionariosFiltrados = useMemo(() => {
    return funcionarios.filter((f) => {
      if (filtroStatus && f.status !== filtroStatus) return false;
      if (filtroSetor && f.contrato?.setor !== filtroSetor) return false;
      if (filtroBusca) {
        const nome = `${f.usuario?.nome ?? ''} ${f.usuario?.sobrenome ?? ''}`.toLowerCase();
        if (!nome.includes(filtroBusca.toLowerCase())) return false;
      }
      return true;
    });
  }, [funcionarios, filtroStatus, filtroSetor, filtroBusca]);

  const usuariosJaVinculados = funcionarios.map((f) => f.usuarioId);

  const handleSuccess = (novoId: string) => {
    setShowModal(false);
    router.push(`/portal/administrativo/funcionarios/${novoId}`);
  };

  return (
    <PermissionWrapper href="/portal" groups={['rh']}>
      <PortalBase>
        <div className="col-span-full">

          {/* Header */}
          <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Funcionários CLT</h1>
              <p className="text-sm text-gray-500 mt-1">
                {loadingData ? 'Carregando...' : `${funcionariosFiltrados.length} funcionário(s) encontrado(s)`}
              </p>
            </div>
            {hasGroup && !loadingPermission && (
              <Button_M3 label="+ Vincular Funcionário" onClick={() => setShowModal(true)} type="button" />
            )}
          </div>

          {/* Permission/loading states */}
          {loadingPermission ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-gray-500 text-sm">Verificando permissões...</p>
            </div>
          ) : !hasGroup ? (
            <div className="flex items-center justify-center py-20 text-center">
              <div>
                <p className="text-xl font-semibold text-gray-700">Sem permissão</p>
                <p className="text-sm text-gray-500 mt-2">Você não tem acesso ao módulo de RH. Contate um administrador.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Filtros */}
              <div className="flex flex-wrap gap-3 mb-4">
                {/* Status pills */}
                <div className="flex gap-1 flex-wrap">
                  {STATUS_FILTROS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setFiltroStatus(s.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition ${filtroStatus === s.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Busca por nome */}
                <input
                  type="text"
                  placeholder="Buscar por nome..."
                  value={filtroBusca}
                  onChange={(e) => setFiltroBusca(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                />

                {/* Filtro setor */}
                {setoresDisponiveis.length > 0 && (
                  <select
                    value={filtroSetor}
                    onChange={(e) => setFiltroSetor(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Todos os setores</option>
                    {setoresDisponiveis.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Tabela */}
              {loadingData ? (
                <div className="flex items-center justify-center py-20">
                  <p className="text-gray-500 text-sm">Carregando funcionários...</p>
                </div>
              ) : (
                <FuncionarioTable funcionarios={funcionariosFiltrados} />
              )}
            </>
          )}
        </div>

        {/* Modal de vinculação */}
        <FuncionarioLinkModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
          usuariosJaVinculados={usuariosJaVinculados}
        />
      </PortalBase>
    </PermissionWrapper>
  );
};

export default FuncionariosPage;
