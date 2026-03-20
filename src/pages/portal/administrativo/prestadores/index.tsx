import React, { useEffect, useMemo, useState } from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';
import PortalBase from '@/components/Portal/PortalBase';
import { useHasGroup } from '@/hooks/useHasGroup';
import { T_PrestadorServicoComUsuario } from '@/types/T_prestadoresServico';
import S_prestadoresServico from '@/services/S_prestadoresServico';
import PrestadorTable from '@/components/prestadores/PrestadorTable';
import PrestadorLinkModal from '@/components/prestadores/PrestadorLinkModal';
import Button_M3 from '@/components/Formularios/Button_M3';
import { useRouter } from 'next/router';

const STATUS_FILTROS = [
  { value: '', label: 'Todos' },
  { value: 'ativo', label: 'Ativos' },
  { value: 'inativo', label: 'Inativos' },
  { value: 'suspenso', label: 'Suspensos' },
];

const PrestadoresPage = () => {
  const { hasGroup, loading: loadingPermission } = useHasGroup('rh');
  const router = useRouter();

  const [prestadores, setPrestadores] = useState<T_PrestadorServicoComUsuario[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');

  const loadPrestadores = async () => {
    try {
      setLoadingData(true);
      const data = await S_prestadoresServico.getAll();
      setPrestadores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar prestadores:', error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (hasGroup) loadPrestadores();
  }, [hasGroup]);

  const tiposServico = useMemo(() => {
    const set = new Set(prestadores.map((p) => p.contrato?.tipoServico).filter(Boolean));
    return Array.from(set).sort();
  }, [prestadores]);

  const prestadoresFiltrados = useMemo(() => {
    return prestadores.filter((p) => {
      if (filtroStatus && p.status !== filtroStatus) return false;
      if (filtroTipo && p.contrato?.tipoServico !== filtroTipo) return false;
      if (filtroBusca) {
        const nome = `${p.usuario?.nome ?? ''} ${p.usuario?.sobrenome ?? ''}`.toLowerCase();
        if (!nome.includes(filtroBusca.toLowerCase())) return false;
      }
      return true;
    });
  }, [prestadores, filtroStatus, filtroTipo, filtroBusca]);

  const usuariosJaVinculados = prestadores.map((p) => p.usuarioId);

  const handleSuccess = (novoId: string) => {
    setShowModal(false);
    router.push(`/portal/administrativo/prestadores/${novoId}`);
  };

  return (
    <PermissionWrapper href="/portal">
      <PortalBase>
        <div className="col-span-full">

          {/* Header */}
          <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Prestadores de Serviço</h1>
              <p className="text-sm text-gray-500 mt-1">
                {loadingData ? 'Carregando...' : `${prestadoresFiltrados.length} prestador(es) encontrado(s)`}
              </p>
            </div>
            {hasGroup && !loadingPermission && (
              <Button_M3 label="+ Vincular Prestador" onClick={() => setShowModal(true)} type="button" />
            )}
          </div>

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
                <div className="flex gap-1 flex-wrap">
                  {STATUS_FILTROS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setFiltroStatus(s.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition ${filtroStatus === s.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Buscar por nome..."
                  value={filtroBusca}
                  onChange={(e) => setFiltroBusca(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                />

                {tiposServico.length > 0 && (
                  <select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Todos os serviços</option>
                    {tiposServico.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                )}
              </div>

              {loadingData ? (
                <div className="flex items-center justify-center py-20">
                  <p className="text-gray-500 text-sm">Carregando prestadores...</p>
                </div>
              ) : (
                <PrestadorTable prestadores={prestadoresFiltrados} />
              )}
            </>
          )}
        </div>

        <PrestadorLinkModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
          usuariosJaVinculados={usuariosJaVinculados}
        />
      </PortalBase>
    </PermissionWrapper>
  );
};

export default PrestadoresPage;
